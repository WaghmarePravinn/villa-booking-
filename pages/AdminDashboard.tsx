
import React, { useState, useEffect, useRef } from 'react';
import { Villa, Testimonial, Lead, AppTheme, SiteSettings, Service } from '../types';
import { uploadMedia, verifyCloudConnectivity } from '../services/villaService';
import { updateSettings } from '../services/settingsService';
import { subscribeToLeads, updateLeadStatus, deleteLead } from '../services/leadService';
import { subscribeToTestimonials, deleteTestimonial, addTestimonial, updateTestimonial } from '../services/testimonialService';
import { subscribeToServices, createService, updateService, deleteService } from '../services/serviceService';
import { generateVillaDescription, generateVillaFromPrompt } from '../services/geminiService';

interface AdminDashboardProps {
  villas: Villa[];
  settings: SiteSettings;
  onAddVilla: (villa: Villa) => Promise<void>;
  onUpdateVilla: (villa: Villa) => Promise<void>;
  onDeleteVilla: (id: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

type AdminTab = 'inventory' | 'inquiries' | 'services' | 'reviews' | 'branding';

interface ProgressState { 
  active: boolean; 
  message: string; 
  percentage: number; 
  error?: string | null; 
  status: 'syncing' | 'synced' | 'error' | 'idle';
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ villas, settings, onAddVilla, onUpdateVilla, onDeleteVilla, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [isEditingVilla, setIsEditingVilla] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  const [brandingData, setBrandingData] = useState<SiteSettings>(settings);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [villaToDelete, setVillaToDelete] = useState<Villa | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

  const [cloudStatus, setCloudStatus] = useState<{db: boolean, storage: boolean}>({ db: false, storage: false });
  const [progress, setProgress] = useState<ProgressState>({ 
    active: false, message: '', percentage: 0, error: null, status: 'idle'
  });

  const initialVilla: Partial<Villa> = {
    name: '', location: '', pricePerNight: 0, bedrooms: 2, bathrooms: 2, capacity: 4, 
    description: '', longDescription: '', imageUrls: [], amenities: [], includedServices: [],
    isFeatured: false, mealsAvailable: true, petFriendly: true, refundPolicy: 'Flexible.'
  };
  const [villaForm, setVillaForm] = useState<Partial<Villa>>(initialVilla);
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({ title: '', description: '', icon: 'fa-concierge-bell' });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState<Partial<Testimonial>>({ name: '', content: '', category: 'Trip', rating: 5 });
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const unsubLeads = subscribeToLeads(setLeads);
    const unsubTestimonials = subscribeToTestimonials(setTestimonials);
    const unsubServices = subscribeToServices(setServices);
    checkCloud();
    return () => { unsubLeads(); unsubTestimonials(); unsubServices(); };
  }, []);

  const checkCloud = async () => {
    const res = await verifyCloudConnectivity();
    setCloudStatus(res);
  };

  const triggerSyncFeedback = (message: string, isDone: boolean = false, error: string | null = null) => {
    setProgress({
      active: !isDone || !!error,
      message,
      percentage: isDone ? 100 : 40,
      status: error ? 'error' : (isDone ? 'synced' : 'syncing'),
      error
    });
    if (isDone && !error) {
      setTimeout(() => setProgress(p => ({ ...p, active: false })), 2500);
    }
  };

  const handleMagicPrompt = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    triggerSyncFeedback('AI is drafting sanctuary profile...');
    try {
      const result = await generateVillaFromPrompt(aiPrompt);
      if (result) {
        setVillaForm(prev => ({ ...prev, ...result }));
        setAiPrompt('');
        triggerSyncFeedback('Sanctuary Drafted Successfully', true);
      } else {
        triggerSyncFeedback('AI Generation Failed', false, 'Parse error.');
      }
    } catch (err: any) {
      triggerSyncFeedback('AI Intelligence Error', false, err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!villaForm.name) return;
    setIsGeneratingAI(true);
    triggerSyncFeedback('Enriching architectural narrative...');
    try {
      const res = await generateVillaDescription(villaForm.name!, villaForm.location!, []);
      setVillaForm(prev => ({ ...prev, description: res.short, longDescription: res.long }));
      triggerSyncFeedback('Narrative Enhanced', true);
    } catch (err: any) { triggerSyncFeedback('AI Error', false, err.message); }
    finally { setIsGeneratingAI(false); }
  };

  const handleEditVilla = (v: Villa) => {
    setVillaForm(v);
    setIsEditingVilla(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitVilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villaForm.name) return;
    setIsSyncing(true);
    triggerSyncFeedback('Syncing Registry...');
    try {
      if (isEditingVilla) await onUpdateVilla(villaForm as Villa);
      else await onAddVilla(villaForm as Villa);
      setVillaForm(initialVilla);
      setIsEditingVilla(false);
      triggerSyncFeedback('Synchronized', true);
    } catch (err: any) { triggerSyncFeedback('Failed', false, err.message); }
    finally { setIsSyncing(false); }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    triggerSyncFeedback('Uploading Assets...');
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadMedia(files[i], 'images');
        urls.push(url);
      }
      setVillaForm(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...urls] }));
      triggerSyncFeedback('Assets Synced', true);
    } catch (err: any) { triggerSyncFeedback('Upload Error', false, err.message); }
    finally { setIsUploading(false); }
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingServiceId) await updateService(editingServiceId, serviceForm);
      else await createService(serviceForm as Omit<Service, 'id'>);
      setServiceForm({ title: '', description: '', icon: 'fa-concierge-bell' });
      setEditingServiceId(null);
    } catch (err) {}
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReviewId) await updateTestimonial(editingReviewId, reviewForm);
      else await addTestimonial({ ...reviewForm, avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(reviewForm.name || 'guest')}` } as any);
      setReviewForm({ name: '', content: '', category: 'Trip', rating: 5 });
      setEditingReviewId(null);
    } catch (err) {}
  };

  const handleSaveBranding = async () => {
    try { await updateSettings(brandingData); } catch (err) {}
  };

  const handleUpdateLead = async (id: string, status: Lead['status']) => {
    try { await updateLeadStatus(id, status); } catch (err) {}
  };

  const clearAllDeletions = () => {
    setVillaToDelete(null);
    setLeadToDelete(null);
    setServiceToDelete(null);
    setTestimonialToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 bg-[#fcfdfe] min-h-screen text-left">
      
      {/* Global Sync HUD */}
      {progress.active && (
        <div className="fixed bottom-24 sm:bottom-10 right-4 sm:right-10 z-[500] animate-reveal">
          <div className={`bg-white border p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-72 sm:w-80 transition-all ${progress.status === 'error' ? 'border-red-100' : 'border-sky-50'}`}>
             <div className="flex items-center gap-4 sm:gap-6 mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white ${
                  progress.status === 'error' ? 'bg-red-500' : 
                  progress.status === 'synced' ? 'bg-emerald-500' : 'bg-slate-900 animate-pulse'
                }`}>
                  <i className={`fa-solid ${progress.status === 'error' ? 'fa-triangle-exclamation' : (progress.status === 'synced' ? 'fa-check' : 'fa-rotate')}`}></i>
                </div>
                <div>
                   <h4 className="font-black text-[8px] uppercase tracking-widest text-slate-400">System</h4>
                   <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{progress.message}</p>
                </div>
             </div>
             {progress.status === 'syncing' && (
               <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${progress.percentage}%` }}></div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 sm:mb-16 gap-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold font-serif text-slate-900 mb-1 tracking-tighter">Mission Control</h1>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cloudStatus.db ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">DB: {cloudStatus.db ? 'ON' : 'OFF'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cloudStatus.storage ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">STORE: {cloudStatus.storage ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </div>
        
        {/* Scrollable Tabs */}
        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-2 -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="flex bg-white p-1.5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-50 min-w-max">
            {(['inventory', 'inquiries', 'services', 'reviews', 'branding'] as AdminTab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
          {/* Inventory Sidebar */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-xl border border-slate-50">
              <h2 className="text-xl font-bold font-serif text-slate-900 mb-6">Villa Registry</h2>
              <div className="space-y-3 max-h-[50vh] lg:max-h-[600px] overflow-y-auto no-scrollbar">
                {villas.map(v => (
                  <div key={v.id} onClick={() => handleEditVilla(v)} className={`p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${villaForm.id === v.id ? 'bg-sky-50 border-sky-100' : 'bg-white border-slate-50'}`}>
                    <img src={v.imageUrls?.[0] || 'https://via.placeholder.com/150'} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-cover" />
                    <div className="min-w-0 flex-grow">
                      <p className="text-[10px] sm:text-xs font-bold text-slate-900 truncate">{v.name}</p>
                      <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{v.location}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setVillaToDelete(v); }} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center opacity-60 hover:opacity-100">
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => { setIsEditingVilla(false); setVillaForm(initialVilla); }}
                className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-300 rounded-xl hover:border-sky-300 hover:text-sky-600 transition-all">
                + New Sanctuary
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-8 order-1 lg:order-2">
             {!isEditingVilla && (
               <div className="mb-6 bg-slate-900 p-1.5 rounded-2xl sm:rounded-[2rem] flex items-center shadow-lg">
                 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shrink-0">
                   <i className="fa-solid fa-sparkles text-sm sm:text-lg"></i>
                 </div>
                 <input placeholder="AI Draft: '3BHK pool villa Goa...'" className="flex-grow bg-transparent border-none outline-none px-4 text-white font-bold text-xs sm:text-sm"
                    value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleMagicPrompt()} />
                 <button onClick={handleMagicPrompt} disabled={isGeneratingAI || !aiPrompt.trim()} className="px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white text-slate-900 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-20">
                   {isGeneratingAI ? '...' : 'Auto'}
                 </button>
               </div>
             )}

             <div className="bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-slate-50">
                <form onSubmit={handleSubmitVilla} className="space-y-10 sm:space-y-12 text-left">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-6">
                     <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">{isEditingVilla ? 'Modify' : 'Register'}</h2>
                     <button type="button" onClick={handleGenerateAI} disabled={isGeneratingAI || !villaForm.name} className="px-6 py-2.5 bg-sky-50 text-sky-600 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-30">
                        <i className="fa-solid fa-wand-magic-sparkles mr-2"></i> AI Enrich
                     </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Name</label>
                        <input required className="w-full px-5 py-4 bg-slate-50 rounded-xl text-sm font-bold text-slate-800" value={villaForm.name} onChange={e => setVillaForm({...villaForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Location</label>
                        <input required className="w-full px-5 py-4 bg-slate-50 rounded-xl text-sm font-bold text-slate-800" value={villaForm.location} onChange={e => setVillaForm({...villaForm, location: e.target.value})} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {['pricePerNight', 'bedrooms', 'bathrooms', 'capacity'].map(field => (
                        <div key={field} className="space-y-2">
                          <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest truncate">{field.replace(/([A-Z])/g, ' $1')}</label>
                          <input type="number" className="w-full px-4 py-4 bg-slate-50 rounded-xl font-black text-slate-800 text-sm" value={(villaForm as any)[field]} onChange={e => setVillaForm({...villaForm, [field]: Number(e.target.value)})} />
                        </div>
                      ))}
                   </div>

                   <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Assets</label>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                         {(villaForm.imageUrls || []).map((url, i) => (
                           <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group">
                              <img src={url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer" onClick={() => setVillaForm(prev => ({...prev, imageUrls: (prev.imageUrls || []).filter(u => u !== url)}))}>
                                 <i className="fa-solid fa-trash-can text-xs"></i>
                              </div>
                           </div>
                         ))}
                         <label className="aspect-square rounded-xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-200">
                            <i className="fa-solid fa-plus text-lg"></i>
                            <input type="file" multiple className="hidden" onChange={handleMediaUpload} />
                         </label>
                      </div>
                   </div>

                   <textarea placeholder="Architecture narrative..." className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-medium h-32" value={villaForm.longDescription} onChange={e => setVillaForm({...villaForm, longDescription: e.target.value})} />

                   <button type="submit" disabled={isSyncing} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl active:scale-95 disabled:opacity-50">
                      {isEditingVilla ? 'Save Updates' : 'Publish Stay'}
                   </button>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Other tabs follow similar refactor for high-density spacing */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4 animate-fade">
           {leads.map(lead => (
             <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-serif shrink-0">{lead.customerName?.charAt(0) || 'G'}</div>
                   <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{lead.customerName || 'Anonymous'}</h3>
                      <p className="text-[9px] font-black uppercase text-sky-600 tracking-widest truncate">{lead.villaName}</p>
                   </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                   {['new', 'contacted', 'booked', 'lost'].map(s => (
                     <button key={s} onClick={() => handleUpdateLead(lead.id, s as any)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${lead.status === s ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>{s}</button>
                   ))}
                   <button onClick={() => setLeadToDelete(lead)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash"></i></button>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Confirmation Overlays */}
      {villaToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl animate-fade" onClick={clearAllDeletions}>
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 max-w-sm w-full text-center shadow-2xl border border-slate-100" onClick={e => e.stopPropagation()}>
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-warning text-2xl"></i></div>
             <h2 className="text-2xl font-bold font-serif mb-3">Confirm Deletion?</h2>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10 leading-relaxed">Entry: {villaToDelete.name}</p>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={clearAllDeletions} className="py-4 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                <button onClick={async () => { await onDeleteVilla(villaToDelete.id); clearAllDeletions(); }} className="py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Delete</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
