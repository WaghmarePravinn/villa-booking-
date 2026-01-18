
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Villa, Testimonial, Lead, AppTheme, SiteSettings, Service, OfferPopup } from '../types';
import { uploadMedia, verifyCloudConnectivity } from '../services/villaService';
import { updateSettings } from '../services/settingsService';
import { subscribeToLeads, updateLeadStatus, deleteLead } from '../services/leadService';
import { subscribeToTestimonials, deleteTestimonial, addTestimonial, updateTestimonial } from '../services/testimonialService';
import { subscribeToServices, createService, updateService, deleteService } from '../services/serviceService';
import { generateVillaDescription } from '../services/geminiService';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Site Settings Local State for Branding Tab
  const [brandingData, setBrandingData] = useState<SiteSettings>(settings);

  // Lists State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Deletion Tracking
  const [villaToDelete, setVillaToDelete] = useState<Villa | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

  // Sync Status
  const [cloudStatus, setCloudStatus] = useState<{db: boolean, storage: boolean}>({ db: false, storage: false });
  const [progress, setProgress] = useState<ProgressState>({ 
    active: false, message: '', percentage: 0, error: null, status: 'idle'
  });

  // Forms State
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

  // VILLA ACTIONS
  const handleEditVilla = (v: Villa) => {
    setVillaForm(v);
    setIsEditingVilla(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitVilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villaForm.name) return;
    setIsSyncing(true);
    triggerSyncFeedback(isEditingVilla ? 'Updating Villa Registry...' : 'Adding New Sanctuary...');
    try {
      if (isEditingVilla) await onUpdateVilla(villaForm as Villa);
      else await onAddVilla(villaForm as Villa);
      triggerSyncFeedback('Registry Successfully Synchronized', true);
      setVillaForm(initialVilla);
      setIsEditingVilla(false);
    } catch (err: any) {
      triggerSyncFeedback('Sync Failed', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!villaForm.name || !villaForm.location) return;
    setIsGeneratingAI(true);
    try {
      const res = await generateVillaDescription(villaForm.name, villaForm.location, [...(villaForm.amenities || []), ...(villaForm.includedServices || [])]);
      setVillaForm(prev => ({ ...prev, description: res.short, longDescription: res.long }));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    triggerSyncFeedback('Transmitting Assets to Cloud...');
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadMedia(files[i], 'images');
        urls.push(url);
      }
      setVillaForm(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...urls] }));
      triggerSyncFeedback('Media Synchronized', true);
    } catch (err: any) {
      triggerSyncFeedback('Upload Failed', false, err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // SERVICE ACTIONS
  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerSyncFeedback('Updating Service Registry...');
    try {
      if (editingServiceId) await updateService(editingServiceId, serviceForm);
      else await createService(serviceForm as Omit<Service, 'id'>);
      setServiceForm({ title: '', description: '', icon: 'fa-concierge-bell' });
      setEditingServiceId(null);
      triggerSyncFeedback('Services Synchronized', true);
    } catch (err: any) {
      triggerSyncFeedback('Sync Failed', false, err.message);
    }
  };

  // REVIEW ACTIONS
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerSyncFeedback('Broadcasting Guest Chronicle...');
    try {
      if (editingReviewId) await updateTestimonial(editingReviewId, reviewForm);
      else await addTestimonial({ ...reviewForm, avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(reviewForm.name || 'guest')}` } as any);
      setReviewForm({ name: '', content: '', category: 'Trip', rating: 5 });
      setEditingReviewId(null);
      triggerSyncFeedback('Chronicles Updated', true);
    } catch (err: any) {
      triggerSyncFeedback('Broadcast Failed', false, err.message);
    }
  };

  // BRANDING ACTIONS
  const handleSaveBranding = async () => {
    triggerSyncFeedback('Updating Site Intelligence...');
    try {
      await updateSettings(brandingData);
      triggerSyncFeedback('Branding Synchronized', true);
    } catch (err: any) {
      triggerSyncFeedback('Sync Failed', false, err.message);
    }
  };

  // LEADS ACTIONS
  const handleUpdateLead = async (id: string, status: Lead['status']) => {
    triggerSyncFeedback('Updating Inquiry Status...');
    try {
      await updateLeadStatus(id, status);
      triggerSyncFeedback('Inquiry Synchronized', true);
    } catch (err: any) {
      triggerSyncFeedback('Sync Failed', false, err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 bg-[#fcfdfe] min-h-screen text-left">
      
      {/* Global Sync Notification HUD */}
      {progress.active && (
        <div className="fixed bottom-24 sm:bottom-10 right-4 sm:right-10 z-[500] animate-reveal">
          <div className={`bg-white border p-8 rounded-[2.5rem] shadow-2xl w-80 transition-all ${progress.status === 'error' ? 'border-red-100' : 'border-sky-50'}`}>
             <div className="flex items-center gap-6 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                  progress.status === 'error' ? 'bg-red-500' : 
                  progress.status === 'synced' ? 'bg-emerald-500' : 'bg-slate-900 animate-pulse'
                }`}>
                  <i className={`fa-solid ${progress.status === 'error' ? 'fa-triangle-exclamation' : (progress.status === 'synced' ? 'fa-check' : 'fa-cloud-arrow-up')}`}></i>
                </div>
                <div>
                   <h4 className="font-black text-[9px] uppercase tracking-widest text-slate-400">Cloud Sync</h4>
                   <p className="text-sm font-black text-slate-900 truncate">{progress.message}</p>
                </div>
             </div>
             {progress.status === 'syncing' && (
               <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${progress.percentage}%` }}></div>
               </div>
             )}
             {progress.status === 'error' && <p className="text-[10px] text-red-500 bg-red-50 p-3 rounded-xl">{progress.error}</p>}
          </div>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-10">
        <div>
          <h1 className="text-5xl font-bold font-serif text-slate-900 mb-2 tracking-tighter">Mission Control</h1>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${cloudStatus.db ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">DATABASE: {cloudStatus.db ? 'CONNECTED' : 'OFFLINE'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${cloudStatus.storage ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">STORAGE: {cloudStatus.storage ? 'CONNECTED' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
        <div className="flex bg-white p-2 rounded-3xl shadow-sm border border-slate-50 overflow-x-auto max-w-full no-scrollbar">
          {(['inventory', 'inquiries', 'services', 'reviews', 'branding'] as AdminTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-50 h-fit lg:sticky lg:top-36">
              <h2 className="text-xl font-bold font-serif text-slate-900 mb-8">Villa Registry</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar">
                {villas.map(v => (
                  <div key={v.id} onClick={() => handleEditVilla(v)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${villaForm.id === v.id ? 'bg-sky-50 border-sky-100 shadow-sm' : 'bg-white border-slate-50 hover:border-slate-200'}`}>
                    <img src={v.imageUrls?.[0] || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="min-w-0 flex-grow">
                      <p className="text-xs font-bold text-slate-900 truncate">{v.name}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{v.location}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setVillaToDelete(v); }} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500 hover:text-white">
                      <i className="fa-solid fa-trash text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
             <div className="bg-white p-10 sm:p-16 rounded-[3rem] shadow-xl border border-slate-50">
                <form onSubmit={handleSubmitVilla} className="space-y-16">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-50 pb-8">
                     <div>
                        <h2 className="text-3xl font-bold font-serif text-slate-900 mb-1">{isEditingVilla ? 'Modify Sanctuary' : 'Register New Stay'}</h2>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Immediate Cloud Synchronization</p>
                     </div>
                     <button type="button" onClick={handleGenerateAI} disabled={isGeneratingAI || !villaForm.name} className="px-6 py-3 bg-sky-50 text-sky-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-600 hover:text-white transition-all">
                        {isGeneratingAI ? <i className="fa-solid fa-sparkles animate-spin mr-2"></i> : <i className="fa-solid fa-sparkles mr-2"></i>}
                        AI Narrative
                     </button>
                   </div>

                   <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Property Name</label>
                          <input required placeholder="e.g. Villa Azzura" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold" value={villaForm.name} onChange={e => setVillaForm({...villaForm, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Location</label>
                          <input required placeholder="e.g. Anjuna, Goa" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold" value={villaForm.location} onChange={e => setVillaForm({...villaForm, location: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rate (₹)</label>
                            <input type="number" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-black" value={villaForm.pricePerNight} onChange={e => setVillaForm({...villaForm, pricePerNight: Number(e.target.value)})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bedrooms</label>
                            <input type="number" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-black" value={villaForm.bedrooms} onChange={e => setVillaForm({...villaForm, bedrooms: Number(e.target.value)})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bathrooms</label>
                            <input type="number" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-black" value={villaForm.bathrooms} onChange={e => setVillaForm({...villaForm, bathrooms: Number(e.target.value)})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Guests</label>
                            <input type="number" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-black" value={villaForm.capacity} onChange={e => setVillaForm({...villaForm, capacity: Number(e.target.value)})} />
                         </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Visuals</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                           {(villaForm.imageUrls || []).map((url, i) => (
                             <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative group">
                                <img src={url} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setVillaForm(prev => ({...prev, imageUrls: (prev.imageUrls || []).filter(u => u !== url)}))} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><i className="fa-solid fa-trash"></i></button>
                             </div>
                           ))}
                           <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-300">
                              <i className="fa-solid fa-plus text-xl"></i>
                              <input type="file" multiple className="hidden" onChange={handleMediaUpload} />
                           </label>
                        </div>
                      </div>
                      <textarea className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-medium h-48 leading-relaxed" placeholder="Narrative Description" value={villaForm.longDescription} onChange={e => setVillaForm({...villaForm, longDescription: e.target.value})} />
                   </div>

                   <div className="flex gap-4">
                     {isEditingVilla && <button type="button" onClick={() => { setIsEditingVilla(false); setVillaForm(initialVilla); }} className="px-10 py-6 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase text-[12px] tracking-widest">Cancel</button>}
                     <button type="submit" disabled={isSyncing || isUploading} className="flex-grow py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl hover:bg-sky-600 transition-all active:scale-95 disabled:opacity-50">
                        {isSyncing ? 'SYNCHRONIZING...' : (isEditingVilla ? 'UPDATE REGISTRY' : 'PUBLISH SANCTUARY')}
                     </button>
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div className="space-y-6 animate-fade">
          <h2 className="text-3xl font-bold font-serif text-slate-900 mb-10">Guest Inquiries</h2>
          <div className="grid grid-cols-1 gap-4">
             {leads.map(lead => (
               <div key={lead.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-serif">{lead.customerName?.charAt(0) || 'G'}</div>
                     <div>
                        <h3 className="text-xl font-bold text-slate-900">{lead.customerName || 'Anonymous'}</h3>
                        <p className="text-[10px] font-black uppercase text-sky-600 tracking-widest">{lead.villaName}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     {(['new', 'contacted', 'booked', 'lost'] as Lead['status'][]).map(s => (
                       <button key={s} onClick={() => handleUpdateLead(lead.id, s)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${lead.status === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{s}</button>
                     ))}
                     <button onClick={() => setLeadToDelete(lead)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade">
          <div className="lg:col-span-5">
             <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-50">
                <h2 className="text-2xl font-bold font-serif mb-8 text-slate-900">{editingServiceId ? 'Edit Service' : 'Add Service'}</h2>
                <form onSubmit={handleSubmitService} className="space-y-6">
                   <input required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold" value={serviceForm.title} placeholder="Title" onChange={e => setServiceForm({...serviceForm, title: e.target.value})} />
                   <input required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold" value={serviceForm.icon} placeholder="Icon Class (fa-utensils)" onChange={e => setServiceForm({...serviceForm, icon: e.target.value})} />
                   <textarea required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-medium h-32" value={serviceForm.description} placeholder="Description" onChange={e => setServiceForm({...serviceForm, description: e.target.value})} />
                   <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                      {editingServiceId ? 'Update Service' : 'Synchronize Service'}
                   </button>
                </form>
             </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
             {services.map(s => (
               <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 text-xl"><i className={`fa-solid ${s.icon}`}></i></div>
                    <h3 className="text-xl font-bold font-serif text-slate-900">{s.title}</h3>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => { setEditingServiceId(s.id); setServiceForm(s); }} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"><i className="fa-solid fa-pen-nib"></i></button>
                     <button onClick={() => setServiceToDelete(s)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash"></i></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade">
          <div className="lg:col-span-5">
             <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-50">
                <h2 className="text-2xl font-bold font-serif mb-8 text-slate-900">{editingReviewId ? 'Modify Chronicle' : 'Add Chronicle'}</h2>
                <form onSubmit={handleSubmitReview} className="space-y-6">
                   <input required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold" value={reviewForm.name} placeholder="Guest Name" onChange={e => setReviewForm({...reviewForm, name: e.target.value})} />
                   <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold" value={reviewForm.category} onChange={e => setReviewForm({...reviewForm, category: e.target.value as any})}>
                      <option value="Trip">Trip Overall</option>
                      <option value="Food">Culinary</option>
                      <option value="Booking">Booking</option>
                      <option value="Service">Staff</option>
                   </select>
                   <textarea required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-medium h-32" value={reviewForm.content} placeholder="Experience Narrative" onChange={e => setReviewForm({...reviewForm, content: e.target.value})} />
                   <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                      {editingReviewId ? 'Update Chronicle' : 'Publish Chronicle'}
                   </button>
                </form>
             </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
             {testimonials.map(t => (
               <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 group">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-4">
                        <img src={t.avatar} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                           <h3 className="text-lg font-bold font-serif text-slate-900">{t.name}</h3>
                           <p className="text-[8px] font-black uppercase text-sky-600 tracking-widest">{t.category}</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => { setEditingReviewId(t.id); setReviewForm(t); }} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"><i className="fa-solid fa-pen-nib text-xs"></i></button>
                        <button onClick={() => setTestimonialToDelete(t)} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                     </div>
                  </div>
                  <p className="text-xs text-slate-500 italic">"{t.content}"</p>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="max-w-4xl animate-fade">
          <div className="bg-white p-12 sm:p-20 rounded-[4rem] shadow-xl border border-slate-50">
             <div className="flex justify-between items-center mb-12 border-b border-slate-50 pb-8">
                <div>
                   <h2 className="text-3xl font-bold font-serif text-slate-900 mb-1">Site Intelligence</h2>
                   <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Global Identity Parameters</p>
                </div>
                <button onClick={handleSaveBranding} className="px-10 py-5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-sky-600 transition-all active:scale-95">
                   Sync Site Intelligence
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-sky-500 pl-4">Communication</h3>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-slate-300">Contact Email</label>
                         <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold" value={brandingData.contactEmail} onChange={e => setBrandingData({...brandingData, contactEmail: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-slate-300">WhatsApp Hotlink</label>
                         <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold" value={brandingData.whatsappNumber} onChange={e => setBrandingData({...brandingData, whatsappNumber: e.target.value})} />
                      </div>
                   </div>
                </div>

                <div className="space-y-8">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-orange-500 pl-4">Aesthetics</h3>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-slate-300">Active Holiday Theme</label>
                         <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold cursor-pointer" value={brandingData.activeTheme} onChange={e => setBrandingData({...brandingData, activeTheme: e.target.value as AppTheme})}>
                            {Object.values(AppTheme).map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-slate-300">Primary Color Hex</label>
                         <div className="flex gap-4">
                            <input className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold" value={brandingData.primaryColor} onChange={e => setBrandingData({...brandingData, primaryColor: e.target.value})} />
                            <div className="w-14 h-14 rounded-2xl shadow-inner border border-white" style={{ backgroundColor: brandingData.primaryColor }}></div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-emerald-500 pl-4">Messaging</h3>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-300">Global Marquee Promo Text</label>
                      <textarea className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold h-20" value={brandingData.promoText} onChange={e => setBrandingData({...brandingData, promoText: e.target.value})} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Confirmation Overlays */}
      {(villaToDelete || leadToDelete || serviceToDelete || testimonialToDelete) && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-fade" onClick={() => { setVillaToDelete(null); setLeadToDelete(null); setServiceToDelete(null); setTestimonialToDelete(null); }}>
          <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8"><i className="fa-solid fa-triangle-exclamation text-3xl"></i></div>
             <h2 className="text-2xl font-bold font-serif mb-4 text-slate-900">Confirm Deletion?</h2>
             <p className="text-slate-500 text-[11px] mb-10 leading-relaxed font-medium uppercase tracking-widest">Permanent Cloud Removal Sequence</p>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setVillaToDelete(null); setLeadToDelete(null); setServiceToDelete(null); setTestimonialToDelete(null); }} className="py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400">Cancel</button>
                <button onClick={async () => {
                  setIsSyncing(true);
                  triggerSyncFeedback('Executing Purge Sequence...');
                  try {
                    if (villaToDelete) await onDeleteVilla(villaToDelete.id);
                    if (leadToDelete) await deleteLead(leadToDelete.id);
                    if (serviceToDelete) await deleteService(serviceToDelete.id);
                    if (testimonialToDelete) await deleteTestimonial(testimonialToDelete.id);
                    setVillaToDelete(null); setLeadToDelete(null); setServiceToDelete(null); setTestimonialToDelete(null);
                    triggerSyncFeedback('Purge Sequence Successful', true);
                  } catch (err: any) {
                    triggerSyncFeedback('Purge Failed', false, err.message);
                  } finally {
                    setIsSyncing(false);
                  }
                }} className="py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white shadow-xl">Confirm Purge</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
