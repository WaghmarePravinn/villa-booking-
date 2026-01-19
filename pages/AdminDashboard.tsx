
import React, { useState, useEffect } from 'react';
import { Villa, Testimonial, Lead, AppTheme, SiteSettings, Service, UserRole } from '../types';
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
    isFeatured: false, mealsAvailable: true, petFriendly: true, refundPolicy: 'Flexible cancellation policy applies.'
  };
  const [villaForm, setVillaForm] = useState<Partial<Villa>>(initialVilla);

  // Additional forms
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({ title: '', description: '', icon: 'fa-concierge-bell' });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  const [reviewForm, setReviewForm] = useState<Partial<Testimonial>>({ name: '', content: '', category: 'Trip', rating: 5 });
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const unsubLeads = subscribeToLeads(setLeads);
    const unsubTestimonials = subscribeToTestimonials(setTestimonials);
    const unsubServices = subscribeToServices(setServices);
    checkCloud();
    return () => { 
      unsubLeads(); 
      unsubTestimonials(); 
      unsubServices(); 
    };
  }, []);

  useEffect(() => {
    setBrandingData(settings);
  }, [settings]);

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

  // --- Inventory Actions ---
  const handleMagicPrompt = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    triggerSyncFeedback('AI Drafting Property...');
    try {
      const result = await generateVillaFromPrompt(aiPrompt);
      if (result) {
        setVillaForm(prev => ({ ...prev, ...result }));
        setAiPrompt('');
        triggerSyncFeedback('Drafted successfully', true);
      } else {
        triggerSyncFeedback('AI Parse Error', false, 'Invalid format.');
      }
    } catch (err: any) {
      triggerSyncFeedback('Generation Failed', false, err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!villaForm.name) return;
    setIsGeneratingAI(true);
    triggerSyncFeedback('Enriching descriptions...');
    try {
      const res = await generateVillaDescription(villaForm.name!, villaForm.location! || '', villaForm.amenities || []);
      setVillaForm(prev => ({ ...prev, description: res.short, longDescription: res.long }));
      triggerSyncFeedback('Description updated', true);
    } catch (err: any) { 
      triggerSyncFeedback('AI Error', false, err.message); 
    } finally { 
      setIsGeneratingAI(false); 
    }
  };

  const handleSubmitVilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villaForm.name) return;
    setIsSyncing(true);
    triggerSyncFeedback(isEditingVilla ? 'Updating...' : 'Publishing...');
    try {
      if (isEditingVilla && villaForm.id) {
        await onUpdateVilla(villaForm as Villa);
      } else {
        await onAddVilla(villaForm as Villa);
      }
      setVillaForm(initialVilla);
      setIsEditingVilla(false);
      triggerSyncFeedback('Catalog updated', true);
    } catch (err: any) { 
      triggerSyncFeedback('Sync Failed', false, err.message); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const handleConfirmDeleteVilla = async () => {
    if (!villaToDelete) return;
    setIsSyncing(true);
    triggerSyncFeedback('Removing property...');
    try {
      await onDeleteVilla(villaToDelete.id);
      setVillaToDelete(null);
      triggerSyncFeedback('Property archived', true);
    } catch (err: any) {
      triggerSyncFeedback('Failed to remove', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    triggerSyncFeedback('Syncing assets...');
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadMedia(files[i], 'images');
        urls.push(url);
      }
      setVillaForm(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...urls] }));
      triggerSyncFeedback('Assets uploaded', true);
    } catch (err: any) { 
      triggerSyncFeedback('Upload error', false, err.message); 
    } finally { 
      setIsUploading(false); 
    }
  };

  // --- Inquiries Actions ---
  const handleUpdateLead = async (id: string, status: Lead['status']) => {
    setIsSyncing(true);
    triggerSyncFeedback('Updating pipeline...');
    try { 
      await updateLeadStatus(id, status); 
      triggerSyncFeedback('Status updated', true);
    } catch (err: any) {
      triggerSyncFeedback('Failed to update', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    setIsSyncing(true);
    triggerSyncFeedback('Archiving lead...');
    try { 
      await deleteLead(id); 
      triggerSyncFeedback('Lead archived', true);
    } catch (err: any) {
      triggerSyncFeedback('Error', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Services Actions ---
  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    triggerSyncFeedback('Saving Service...');
    try {
      if (editingServiceId) {
        await updateService(editingServiceId, serviceForm);
      } else {
        await createService(serviceForm as Omit<Service, 'id'>);
      }
      setServiceForm({ title: '', description: '', icon: 'fa-concierge-bell' });
      setEditingServiceId(null);
      triggerSyncFeedback('Service Synced', true);
    } catch (err: any) {
      triggerSyncFeedback('Failed to save', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    setIsSyncing(true);
    triggerSyncFeedback('Removing service...');
    try {
      await deleteService(id);
      triggerSyncFeedback('Service removed', true);
    } catch (err: any) {
      triggerSyncFeedback('Error', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Reviews Actions ---
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    triggerSyncFeedback('Publishing Review...');
    try {
      if (editingReviewId) {
        await updateTestimonial(editingReviewId, reviewForm);
      } else {
        await addTestimonial({ 
          ...reviewForm, 
          avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(reviewForm.name || 'guest')}` 
        } as any);
      }
      setReviewForm({ name: '', content: '', category: 'Trip', rating: 5 });
      setEditingReviewId(null);
      triggerSyncFeedback('Review published', true);
    } catch (err: any) {
      triggerSyncFeedback('Failed to publish', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    setIsSyncing(true);
    triggerSyncFeedback('Deleting Review...');
    try {
      await deleteTestimonial(id);
      triggerSyncFeedback('Review deleted', true);
    } catch (err: any) {
      triggerSyncFeedback('Error', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Branding Actions ---
  const handleSaveBranding = async () => {
    setIsSyncing(true);
    triggerSyncFeedback('Updating Identity...');
    try { 
      await updateSettings(brandingData); 
      triggerSyncFeedback('Identity synchronized', true);
    } catch (err: any) {
      triggerSyncFeedback('Update failed', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 bg-[#fcfdfe] min-h-screen text-left relative">
      
      {/* GLOBAL SYNC HUD */}
      {progress.active && (
        <div className="fixed bottom-24 lg:bottom-10 right-4 lg:right-10 z-[500] animate-reveal">
          <div className={`bg-white border p-6 lg:p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-72 lg:w-80 transition-all ${progress.status === 'error' ? 'border-red-100' : 'border-sky-50'}`}>
             <div className="flex items-center gap-4 lg:gap-6 mb-4">
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white transition-all duration-500 ${
                  progress.status === 'error' ? 'bg-red-500' : 
                  progress.status === 'synced' ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900 animate-pulse'
                }`}>
                  <i className={`fa-solid ${progress.status === 'error' ? 'fa-triangle-exclamation' : (progress.status === 'synced' ? 'fa-check' : 'fa-rotate')}`}></i>
                </div>
                <div className="min-w-0">
                   <h4 className="font-black text-[8px] uppercase tracking-widest text-slate-400">Cloud Sync</h4>
                   <p className="text-xs lg:text-sm font-black text-slate-900 truncate">{progress.message}</p>
                </div>
             </div>
             {progress.status === 'syncing' && (
               <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${progress.percentage}%` }}></div>
               </div>
             )}
             {progress.error && <p className="text-[9px] text-red-500 font-bold mt-2 leading-tight uppercase tracking-tighter">{progress.error}</p>}
          </div>
        </div>
      )}

      {/* ADMIN HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 lg:mb-16 gap-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold font-serif text-slate-900 mb-1 tracking-tighter">Mission Control</h1>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cloudStatus.db ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Main Engine: {cloudStatus.db ? 'STABLE' : 'OFFLINE'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cloudStatus.storage ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Media CDN: {cloudStatus.storage ? 'STABLE' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
        
        {/* NAV TABS */}
        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-2 -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 min-w-max">
            {(['inventory', 'inquiries', 'services', 'reviews', 'branding'] as AdminTab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 lg:px-8 py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-fade">
          {/* List Sidebar */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-xl border border-slate-50 sticky top-36">
              <h2 className="text-xl font-bold font-serif text-slate-900 mb-6">Property Registry</h2>
              <div className="space-y-3 max-h-[50vh] lg:max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                {villas.map(v => (
                  <div key={v.id} onClick={() => { setVillaForm(v); setIsEditingVilla(true); }} className={`p-4 rounded-xl lg:rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${villaForm.id === v.id ? 'bg-sky-50 border-sky-100 shadow-sm' : 'bg-white border-slate-50 hover:border-sky-100'}`}>
                    <img src={v.imageUrls?.[0]} className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl object-cover shadow-sm" />
                    <div className="min-w-0 flex-grow">
                      <p className="text-[10px] lg:text-xs font-bold text-slate-900 truncate">{v.name}</p>
                      <p className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{v.location}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setVillaToDelete(v); }} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => { setIsEditingVilla(false); setVillaForm(initialVilla); }}
                className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 rounded-xl hover:border-sky-300 hover:text-sky-600 transition-all">
                + REGISTER NEW VILLA
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-8 order-1 lg:order-2">
             <div className="mb-8 bg-slate-900 p-2 rounded-2xl flex items-center shadow-lg border border-white/10 group focus-within:ring-2 ring-sky-500/20">
               <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg">
                 <i className="fa-solid fa-wand-magic-sparkles text-sm lg:text-lg"></i>
               </div>
               <input 
                  placeholder="AI Smart Draft: '3BHK Villa with Infinity Pool in Lonavala...'" 
                  className="flex-grow bg-transparent border-none outline-none px-4 text-white font-bold text-xs lg:text-sm placeholder:text-slate-600"
                  value={aiPrompt} 
                  onChange={e => setAiPrompt(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleMagicPrompt()} 
               />
               <button onClick={handleMagicPrompt} disabled={isGeneratingAI || !aiPrompt.trim()} className="px-4 lg:px-6 py-2.5 lg:py-3.5 bg-white text-slate-900 rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest hover:bg-sky-400 active:scale-95 disabled:opacity-20 transition-all">
                 {isGeneratingAI ? 'DRAFTING...' : 'GENERATE'}
               </button>
             </div>

             <div className="bg-white p-6 lg:p-12 rounded-[3rem] shadow-xl border border-slate-100">
                <form onSubmit={handleSubmitVilla} className="space-y-10 lg:space-y-12">
                   <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-50 pb-8">
                     <h2 className="text-2xl lg:text-3xl font-bold font-serif text-slate-900">{isEditingVilla ? 'Modify Property' : 'Register Property'}</h2>
                     <button type="button" onClick={handleGenerateAI} disabled={isGeneratingAI || !villaForm.name} className="px-6 py-3 bg-sky-50 text-sky-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-100 active:scale-95 disabled:opacity-30 transition-all">
                        <i className="fa-solid fa-sparkles mr-2"></i> ENRICH DESCRIPTION
                     </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Property Identity</label>
                        <input required className="w-full px-6 py-5 bg-slate-50 rounded-2xl text-sm font-bold text-slate-800 border-none focus:ring-2 focus:ring-sky-500 shadow-inner" value={villaForm.name} onChange={e => setVillaForm({...villaForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Geography</label>
                        <input required className="w-full px-6 py-5 bg-slate-50 rounded-2xl text-sm font-bold text-slate-800 border-none focus:ring-2 focus:ring-sky-500 shadow-inner" value={villaForm.location} onChange={e => setVillaForm({...villaForm, location: e.target.value})} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { id: 'pricePerNight', label: 'Rate/Night', icon: 'fa-indian-rupee-sign' },
                        { id: 'bedrooms', label: 'Rooms', icon: 'fa-bed' },
                        { id: 'bathrooms', label: 'Baths', icon: 'fa-shower' },
                        { id: 'capacity', label: 'Guests', icon: 'fa-users' }
                      ].map(field => (
                        <div key={field.id} className="space-y-3">
                          <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest truncate">{field.label}</label>
                          <div className="relative">
                            <i className={`fa-solid ${field.icon} absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]`}></i>
                            <input type="number" className="w-full pl-10 pr-5 py-5 bg-slate-50 rounded-2xl font-black text-slate-900 text-sm border-none shadow-inner" value={(villaForm as any)[field.id]} onChange={e => setVillaForm({...villaForm, [field.id]: Number(e.target.value)})} />
                          </div>
                        </div>
                      ))}
                   </div>

                   <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Visual Catalog</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                         {(villaForm.imageUrls || []).map((url, i) => (
                           <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative group border border-slate-200 shadow-sm transition-transform hover:scale-105">
                              <img src={url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity" onClick={() => setVillaForm(prev => ({...prev, imageUrls: (prev.imageUrls || []).filter(u => u !== url)}))}>
                                 <i className="fa-solid fa-trash-can text-sm"></i>
                              </div>
                           </div>
                         ))}
                         <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-sky-300 text-slate-400 transition-all active:scale-95">
                            {isUploading ? <i className="fa-solid fa-spinner animate-spin text-xl"></i> : <i className="fa-solid fa-cloud-arrow-up text-xl mb-1"></i>}
                            <span className="text-[8px] font-black uppercase mt-1">{isUploading ? 'SYNCING' : 'UPLOAD'}</span>
                            <input type="file" multiple className="hidden" onChange={handleMediaUpload} disabled={isUploading} />
                         </label>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Property Narrative</label>
                      <textarea placeholder="Describe the atmosphere and architecture..." className="w-full px-6 py-6 bg-slate-50 rounded-[2.5rem] text-sm font-medium h-48 border-none shadow-inner resize-none focus:ring-2 focus:ring-sky-500 outline-none" value={villaForm.longDescription} onChange={e => setVillaForm({...villaForm, longDescription: e.target.value})} />
                   </div>

                   <div className="flex flex-col sm:flex-row gap-6 items-center pt-8 border-t border-slate-50">
                      <button type="submit" disabled={isSyncing} className="w-full sm:flex-1 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-sky-600 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
                         {isSyncing ? <i className="fa-solid fa-rotate animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                         {isEditingVilla ? 'UPDATE REGISTRY' : 'COMMIT PROPERTY'}
                      </button>
                      {isEditingVilla && (
                        <button type="button" onClick={() => { setIsEditingVilla(false); setVillaForm(initialVilla); }} className="w-full sm:w-auto px-10 py-6 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors">
                          CANCEL
                        </button>
                      )}
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6 animate-fade max-w-5xl mx-auto">
           <div className="flex items-center justify-between mb-10 px-4">
              <h2 className="text-2xl font-bold font-serif text-slate-900">Lead Pipeline</h2>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{leads.length} TOTAL INQUIRIES</span>
           </div>
           {leads.length > 0 ? (
             leads.map(lead => (
               <div key={lead.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-2xl transition-all group">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center text-2xl font-serif shrink-0 shadow-lg group-hover:rotate-6 transition-transform">{lead.customerName?.charAt(0) || 'G'}</div>
                     <div className="text-left min-w-0">
                        <h3 className="text-xl font-bold text-slate-900 truncate">{lead.customerName || 'Direct Guest'}</h3>
                        <p className="text-[10px] font-black uppercase text-sky-600 tracking-widest truncate mb-2">{lead.villaName}</p>
                        <div className="flex flex-wrap gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                           <span><i className="fa-solid fa-calendar mr-2"></i>{lead.checkIn || 'Dates flexible'}</span>
                           <span><i className="fa-solid fa-clock mr-2"></i>{new Date(lead.timestamp).toLocaleDateString()}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                     {(['new', 'contacted', 'booked', 'lost'] as Lead['status'][]).map(s => (
                       <button key={s} onClick={() => handleUpdateLead(lead.id, s)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${lead.status === s ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>{s}</button>
                     ))}
                     <button onClick={() => setLeadToDelete(lead)} className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all ml-4">
                       <i className="fa-solid fa-trash-can text-lg"></i>
                     </button>
                  </div>
               </div>
             ))
           ) : (
             <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
               <i className="fa-solid fa-inbox text-5xl text-slate-200 mb-8"></i>
               <h3 className="text-2xl font-bold font-serif text-slate-300 uppercase tracking-widest">No Active Inquiries</h3>
             </div>
           )}
        </div>
      )}

      {/* TAB CONTENT: SERVICES */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade">
           <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] shadow-xl border border-slate-100 h-fit sticky top-36">
              <h2 className="text-2xl lg:text-3xl font-bold font-serif text-slate-900 mb-10">{editingServiceId ? 'Edit Experience' : 'New Concierge Definition'}</h2>
              <form onSubmit={handleSubmitService} className="space-y-8 text-left">
                 <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Service Title</label>
                    <input required className="w-full px-6 py-5 bg-slate-50 rounded-2xl font-bold text-slate-900 border-none shadow-inner focus:ring-2 focus:ring-sky-500" value={serviceForm.title} onChange={e => setServiceForm({...serviceForm, title: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Experience Description</label>
                    <textarea required className="w-full px-6 py-5 bg-slate-50 rounded-2xl h-32 text-sm font-medium border-none shadow-inner resize-none focus:ring-2 focus:ring-sky-500" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Visual Icon (FA Class)</label>
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                          <i className={`fa-solid ${serviceForm.icon}`}></i>
                       </div>
                       <input className="flex-grow px-6 py-5 bg-slate-50 rounded-2xl text-xs font-mono border-none shadow-inner focus:ring-2 focus:ring-sky-500" value={serviceForm.icon} onChange={e => setServiceForm({...serviceForm, icon: e.target.value})} />
                    </div>
                 </div>
                 <button type="submit" disabled={isSyncing} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-sky-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                   {isSyncing ? <i className="fa-solid fa-rotate animate-spin"></i> : <i className="fa-solid fa-check"></i>}
                   {editingServiceId ? 'UPDATE SERVICE' : 'ESTABLISH SERVICE'}
                 </button>
                 {editingServiceId && <button type="button" onClick={() => { setEditingServiceId(null); setServiceForm({title:'', description:'', icon: 'fa-concierge-bell'}); }} className="w-full py-4 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:text-red-500 transition-colors">CANCEL EDITION</button>}
              </form>
           </div>
           <div className="space-y-6">
              {services.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-50 flex items-center justify-between group hover:shadow-2xl transition-all">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-sky-50 flex items-center justify-center text-sky-600 text-3xl shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all"><i className={`fa-solid ${s.icon}`}></i></div>
                      <div className="text-left">
                         <h4 className="font-bold text-slate-900 text-lg">{s.title}</h4>
                         <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-xs">{s.description}</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => { setServiceForm(s); setEditingServiceId(s.id); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="w-11 h-11 rounded-xl bg-slate-50 text-slate-400 hover:bg-sky-600 hover:text-white transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                      <button onClick={() => handleDeleteService(s.id)} className="w-11 h-11 rounded-xl bg-slate-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can"></i></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* TAB CONTENT: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade">
           <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] shadow-xl border border-slate-100 h-fit sticky top-36">
              <h2 className="text-2xl lg:text-3xl font-bold font-serif text-slate-900 mb-10">{editingReviewId ? 'Edit Chronicle' : 'Record Guest Chronicle'}</h2>
              <form onSubmit={handleSubmitReview} className="space-y-8 text-left">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Guest Identity</label>
                      <input required className="w-full px-6 py-5 bg-slate-50 rounded-2xl font-bold text-slate-900 border-none shadow-inner" value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Chronicle Type</label>
                      <select className="w-full px-6 py-5 bg-slate-50 rounded-2xl font-bold text-slate-900 border-none shadow-inner cursor-pointer" value={reviewForm.category} onChange={e => setReviewForm({...reviewForm, category: e.target.value as any})}>
                        {['Trip', 'Booking', 'Food', 'Service', 'Hospitality'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Narrative Content</label>
                    <textarea required className="w-full px-6 py-5 bg-slate-50 rounded-2xl h-40 text-sm font-medium border-none shadow-inner resize-none focus:ring-2 focus:ring-sky-500 outline-none" value={reviewForm.content} onChange={e => setReviewForm({...reviewForm, content: e.target.value})} />
                 </div>
                 <button type="submit" disabled={isSyncing} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50">
                   {isSyncing ? <i className="fa-solid fa-rotate animate-spin"></i> : <i className="fa-solid fa-feather"></i>}
                   {editingReviewId ? 'UPDATE CHRONICLE' : 'PUBLISH CHRONICLE'}
                 </button>
                 {editingReviewId && <button type="button" onClick={() => { setEditingReviewId(null); setReviewForm({name:'', content:'', category: 'Trip', rating: 5}); }} className="w-full py-4 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:text-red-500 transition-colors">CANCEL MODERATION</button>}
              </form>
           </div>
           <div className="space-y-6 max-h-[850px] overflow-y-auto no-scrollbar pr-2">
              {testimonials.map(r => (
                <div key={r.id} className="bg-white p-8 rounded-[3rem] border border-slate-50 flex items-start justify-between group hover:shadow-2xl transition-all">
                   <div className="flex gap-6 min-w-0">
                      <img src={r.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover shadow-md group-hover:rotate-3 transition-transform" />
                      <div className="text-left min-w-0">
                         <h4 className="font-bold text-slate-900 text-lg">{r.name}</h4>
                         <span className="text-[9px] font-black uppercase tracking-widest text-sky-600 mb-3 block">{r.category} EXPERIENCE</span>
                         <p className="text-[13px] text-slate-500 leading-relaxed italic line-clamp-4">"{r.content}"</p>
                      </div>
                   </div>
                   <div className="flex flex-col gap-3 ml-4">
                      <button onClick={() => { setReviewForm(r); setEditingReviewId(r.id); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-sky-600 hover:text-white transition-all"><i className="fa-solid fa-pen text-[11px]"></i></button>
                      <button onClick={() => handleDeleteReview(r.id)} className="w-10 h-10 rounded-xl bg-slate-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-[11px]"></i></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* TAB CONTENT: BRANDING */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade">
           <div className="lg:col-span-8 bg-white p-10 lg:p-20 rounded-[4rem] shadow-xl border border-slate-100">
              <h2 className="text-3xl lg:text-4xl font-bold font-serif text-slate-900 mb-12 border-b border-slate-50 pb-8">Global Identity Engine</h2>
              
              <div className="space-y-16 text-left">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Atmosphere Preset (Theme)</label>
                       <select className="w-full p-6 bg-slate-50 rounded-[2rem] font-black text-slate-800 border-none shadow-inner focus:ring-2 focus:ring-sky-500 outline-none transition-all cursor-pointer" value={brandingData.activeTheme} onChange={e => setBrandingData({...brandingData, activeTheme: e.target.value as AppTheme})}>
                          {Object.values(AppTheme).map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Core Identity Color</label>
                       <div className="flex items-center gap-6">
                          <input type="color" className="w-20 h-20 rounded-[2rem] p-1.5 bg-white border border-slate-100 cursor-pointer shadow-sm" value={brandingData.primaryColor} onChange={e => setBrandingData({...brandingData, primaryColor: e.target.value})} />
                          <input className="flex-grow p-5 bg-slate-50 rounded-2xl font-mono text-xs border-none shadow-inner focus:ring-2 focus:ring-sky-500" value={brandingData.primaryColor} onChange={e => setBrandingData({...brandingData, primaryColor: e.target.value})} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Sky Banner Promotion (Marquee)</label>
                    <div className="relative">
                      <i className="fa-solid fa-megaphone absolute left-6 top-1/2 -translate-y-1/2 text-sky-400 text-lg"></i>
                      <input className="w-full pl-16 pr-8 py-6 bg-slate-900 text-white rounded-[2rem] font-bold tracking-[0.2em] uppercase text-xs border-none shadow-2xl" value={brandingData.promoText} onChange={e => setBrandingData({...brandingData, promoText: e.target.value})} />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">WhatsApp ID</label>
                       <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none shadow-inner" value={brandingData.whatsappNumber} onChange={e => setBrandingData({...brandingData, whatsappNumber: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Support Email</label>
                       <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none shadow-inner" value={brandingData.contactEmail} onChange={e => setBrandingData({...brandingData, contactEmail: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Direct Hotline</label>
                       <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none shadow-inner" value={brandingData.contactPhone} onChange={e => setBrandingData({...brandingData, contactPhone: e.target.value})} />
                    </div>
                 </div>

                 <div className="pt-16 border-t border-slate-50 space-y-12">
                    <div className="flex items-center justify-between px-2">
                       <div>
                         <h3 className="text-2xl font-bold font-serif text-slate-900">Conversion Accelerator</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Managed Promotional Popup</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={brandingData.offerPopup.enabled} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, enabled: e.target.checked}})} className="sr-only peer" />
                          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                       </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Offer Title</label>
                            <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-900 border-none shadow-inner" value={brandingData.offerPopup.title} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, title: e.target.value}})} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Button Link (Route)</label>
                            <input className="w-full p-5 bg-slate-50 rounded-2xl font-mono text-xs border-none shadow-inner" value={brandingData.offerPopup.buttonLink} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, buttonLink: e.target.value}})} />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Promotional Narrative</label>
                          <textarea className="w-full p-5 bg-slate-50 rounded-[2rem] h-[134px] text-sm font-medium border-none shadow-inner resize-none focus:ring-2 focus:ring-sky-500" value={brandingData.offerPopup.description} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, description: e.target.value}})} />
                       </div>
                    </div>
                 </div>

                 <button onClick={handleSaveBranding} disabled={isSyncing} className="w-full py-7 bg-sky-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4">
                    {isSyncing ? <i className="fa-solid fa-rotate animate-spin"></i> : <i className="fa-solid fa-shield-check"></i>}
                    {isSyncing ? 'SYNCING IDENTITY...' : 'COMMIT BRAND UPDATES'}
                 </button>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-10">
              <div className="bg-slate-900 p-10 lg:p-14 rounded-[4rem] text-white shadow-2xl relative overflow-hidden text-left">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                 <h3 className="text-2xl font-bold font-serif mb-8 relative z-10">Real-time Preview</h3>
                 <div className="p-8 bg-white rounded-[2.5rem] text-slate-900 shadow-2xl">
                    <div className="w-full h-4 rounded-full bg-slate-100 mb-6 overflow-hidden relative">
                       <div className="absolute inset-0 bg-sky-500 animate-[marquee_10s_linear_infinite]" style={{width:'300%', background: brandingData.primaryColor}}></div>
                    </div>
                    <h4 className="font-bold text-sm mb-4 truncate" style={{color: brandingData.primaryColor}}>{brandingData.promoText}</h4>
                    <div className="space-y-3">
                       <div className="w-full h-2 rounded-full bg-slate-100" style={{background: brandingData.primaryColor, opacity: 0.15}}></div>
                       <div className="w-2/3 h-2 rounded-full bg-slate-100 opacity-50"></div>
                       <div className="w-1/2 h-8 rounded-xl mt-6 bg-slate-900" style={{background: brandingData.primaryColor}}></div>
                    </div>
                 </div>
                 <div className="mt-10 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Changes synchronize instantly to all active guest sessions.</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* OVERLAYS & MODALS */}
      {villaToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-2xl animate-fade" onClick={() => !isSyncing && setVillaToDelete(null)}>
          <div className="bg-white rounded-[3.5rem] p-10 lg:p-14 max-w-sm w-full text-center shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-white/20" onClick={e => e.stopPropagation()}>
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
                <i className="fa-solid fa-triangle-exclamation text-3xl"></i>
             </div>
             <h2 className="text-3xl font-bold font-serif mb-4 text-slate-900 leading-tight">Archive Registry?</h2>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-12 leading-relaxed px-4">
               Removing <span className="text-slate-900 font-black">"{villaToDelete.name}"</span> will permanently delist it from the live catalog.
             </p>
             <div className="grid grid-cols-2 gap-4">
                <button 
                  disabled={isSyncing}
                  onClick={() => setVillaToDelete(null)} 
                  className="py-5 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  KEEP
                </button>
                <button 
                  disabled={isSyncing}
                  onClick={handleConfirmDeleteVilla} 
                  className="py-5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSyncing ? <i className="fa-solid fa-spinner animate-spin"></i> : 'ARCHIVE'}
                </button>
             </div>
          </div>
        </div>
      )}

      {leadToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-2xl animate-fade" onClick={() => !isSyncing && setLeadToDelete(null)}>
          <div className="bg-white rounded-[3rem] p-10 lg:p-14 max-w-sm w-full text-center shadow-2xl border border-slate-50" onClick={e => e.stopPropagation()}>
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-box-archive text-2xl"></i></div>
             <h2 className="text-2xl font-bold font-serif mb-3">Archive Inquiry?</h2>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10 leading-relaxed">IDENTITY: {leadToDelete.customerName}</p>
             <div className="grid grid-cols-2 gap-4">
                <button disabled={isSyncing} onClick={() => setLeadToDelete(null)} className="py-4 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase">CANCEL</button>
                <button disabled={isSyncing} onClick={async () => { await handleDeleteLead(leadToDelete.id); setLeadToDelete(null); }} className="py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">ARCHIVE</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
