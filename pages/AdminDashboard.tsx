
import React, { useState, useEffect } from 'react';
import { Villa, Testimonial, Lead, AppTheme, SiteSettings, Service, UserRole, OfferPopup } from '../types';
import { uploadMedia, verifyCloudConnectivity } from '../services/villaService';
import { updateSettings } from '../services/settingsService';
import { subscribeToLeads, updateLeadStatus, deleteLead } from '../services/leadService';
import { subscribeToTestimonials, deleteTestimonial, addTestimonial, updateTestimonial } from '../services/testimonialService';
import { subscribeToServices, createService, updateService, deleteService } from '../services/serviceService';
import { generateVillaDescription, generateVillaFromPrompt, generateCustomNarrative } from '../services/geminiService';
import { runFullDiagnostics, DiagnosticResult } from '../services/diagnosticsService';

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

const SERVICE_ICONS = [
  'fa-concierge-bell', 'fa-utensils', 'fa-car', 'fa-spa', 'fa-swimming-pool', 
  'fa-wifi', 'fa-shield-halved', 'fa-soap', 'fa-wine-glass', 'fa-coffee', 
  'fa-tv', 'fa-key', 'fa-vault', 'fa-bicycle', 'fa-dumbbell', 'fa-fire-burner',
  'fa-person-swimming', 'fa-van-shuttle', 'fa-broom', 'fa-baby-carriage'
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ villas, settings, onAddVilla, onUpdateVilla, onDeleteVilla, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [isEditingVilla, setIsEditingVilla] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [descriptionPrompt, setDescriptionPrompt] = useState('');
  
  const [brandingData, setBrandingData] = useState<SiteSettings>(settings);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [villaToDelete, setVillaToDelete] = useState<Villa | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

  const [cloudStatus, setCloudStatus] = useState<{db: boolean, storage: boolean}>({ db: false, storage: false });
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  
  const [progress, setProgress] = useState<ProgressState>({ 
    active: false, message: '', percentage: 0, error: null, status: 'idle'
  });

  const initialVilla: Partial<Villa> = {
    name: '', location: '', pricePerNight: 0, bedrooms: 2, bathrooms: 2, capacity: 4, 
    description: '', longDescription: '', imageUrls: [], amenities: [], includedServices: [],
    isFeatured: false, mealsAvailable: true, petFriendly: true, refundPolicy: 'Flexible cancellation policy applies.'
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

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const results = await runFullDiagnostics();
      setDiagnostics(results);
      checkCloud(); 
    } catch (err) {
      console.error("Diagnostics failed", err);
    } finally {
      setIsRunningDiagnostics(false);
    }
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
    triggerSyncFeedback('AI Drafting Property...');
    try {
      const result = await generateVillaFromPrompt(aiPrompt);
      if (result && Object.keys(result).length > 0) {
        setVillaForm(prev => ({ ...prev, ...result }));
        setAiPrompt('');
        triggerSyncFeedback('Drafted successfully', true);
      } else {
        triggerSyncFeedback('AI Parse Error', false, 'The model returned an incompatible format.');
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

  const handleCustomDescriptionGenerate = async () => {
    if (!villaForm.name || !descriptionPrompt.trim()) return;
    setIsGeneratingAI(true);
    triggerSyncFeedback('Crafting custom narrative...');
    try {
      const res = await generateCustomNarrative(villaForm.name, descriptionPrompt);
      setVillaForm(prev => ({ ...prev, description: res.short, longDescription: res.long }));
      setDescriptionPrompt('');
      triggerSyncFeedback('Narrative updated', true);
    } catch (err: any) {
      triggerSyncFeedback('AI Narrative Error', false, err.message);
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

  const handleConfirmDeleteLead = async () => {
    if (!leadToDelete) return;
    setIsSyncing(true);
    triggerSyncFeedback('Archiving lead...');
    try { 
      await deleteLead(leadToDelete.id); 
      setLeadToDelete(null);
      triggerSyncFeedback('Lead archived', true);
    } catch (err: any) {
      triggerSyncFeedback('Error', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

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

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsSyncing(true);
    triggerSyncFeedback('Removing service...');
    try {
      await deleteService(serviceToDelete.id);
      setServiceToDelete(null);
      triggerSyncFeedback('Service removed', true);
    } catch (err: any) {
      triggerSyncFeedback('Error', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

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

  const handleConfirmDeleteReview = async () => {
    if (!testimonialToDelete) return;
    setIsSyncing(true);
    triggerSyncFeedback('Deleting Review...');
    try {
      await deleteTestimonial(testimonialToDelete.id);
      setTestimonialToDelete(null);
      triggerSyncFeedback('Review deleted', true);
    } catch (err: any) {
      triggerSyncFeedback('Error', false, err.message);
    } finally {
      setIsSyncing(false);
    }
  };

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    triggerSyncFeedback('Syncing brand assets...');
    try {
      const url = await uploadMedia(file, 'images');
      setBrandingData(prev => ({ ...prev, siteLogo: url }));
      triggerSyncFeedback('Logo uploaded', true);
    } catch (err: any) {
      triggerSyncFeedback('Upload failed', false, err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'booked': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'contacted': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'lost': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-sky-100 text-sky-700 border-sky-200';
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-10 lg:py-20 bg-[#fcfdfe] min-h-screen text-left relative selection:bg-sky-100 selection:text-sky-900">
      
      {/* GLOBAL HUD */}
      {progress.active && (
        <div className="fixed bottom-10 right-10 z-[500] animate-reveal">
          <div className={`bg-white border p-8 rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.1)] w-80 transition-all ${progress.status === 'error' ? 'border-red-100' : 'border-sky-50'}`}>
             <div className="flex items-center gap-6 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all duration-500 ${
                  progress.status === 'error' ? 'bg-red-500' : 
                  progress.status === 'synced' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 animate-pulse'
                }`}>
                  <i className={`fa-solid ${progress.status === 'error' ? 'fa-triangle-exclamation' : (progress.status === 'synced' ? 'fa-check' : 'fa-rotate')}`}></i>
                </div>
                <div className="min-w-0">
                   <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-300">Sync Engine</h4>
                   <p className="text-sm font-black text-slate-800 truncate leading-none mt-1">{progress.message}</p>
                </div>
             </div>
             {progress.status === 'syncing' && (
               <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${progress.percentage}%` }}></div>
               </div>
             )}
             {progress.error && (
               <p className="mt-3 text-[9px] text-red-500 font-bold uppercase tracking-widest">{progress.error}</p>
             )}
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 lg:mb-16 gap-10">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-[2px] bg-sky-600"></div>
            <span className="text-[10px] font-black uppercase text-sky-600 tracking-[0.5em]">Executive Console</span>
          </div>
          <h1 className="text-4xl lg:text-7xl font-bold font-serif text-slate-900 tracking-tighter leading-none mb-6">Mission Control</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${cloudStatus.db ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">DB: {cloudStatus.db ? 'STABLE' : 'OFFLINE'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${cloudStatus.storage ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">STORAGE: {cloudStatus.storage ? 'STABLE' : 'OFFLINE'}</span>
            </div>
            <button onClick={handleRunDiagnostics} className="ml-2 w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-white transition-all">
              <i className={`fa-solid fa-microchip ${isRunningDiagnostics ? 'animate-spin' : ''}`}></i>
            </button>
          </div>
        </div>
        
        <div className="w-full lg:w-auto bg-white p-2 rounded-[2rem] shadow-xl border border-slate-50 flex overflow-x-auto no-scrollbar gap-1">
          {(['inventory', 'inquiries', 'services', 'reviews', 'branding'] as AdminTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-8 lg:px-10 py-3 lg:py-4 rounded-2xl text-[9px] lg:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="animate-reveal">
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Sidebar List */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 h-[800px] flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-bold font-serif text-slate-900">Registry</h2>
                  <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{villas.length} Items</span>
                </div>
                <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-1">
                  {villas.map(v => (
                    <div key={v.id} onClick={() => { setVillaForm(v); setIsEditingVilla(true); }} className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center gap-5 group hover:shadow-lg ${villaForm.id === v.id ? 'bg-sky-50 border-sky-100 shadow-md' : 'bg-white border-slate-50'}`}>
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-white">
                        <img src={v.imageUrls?.[0]} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-sm font-black text-slate-800 truncate leading-none mb-1">{v.name}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{v.location.split(',')[0]}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setVillaToDelete(v); }} className="opacity-0 group-hover:opacity-100 w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setIsEditingVilla(false); setVillaForm(initialVilla); }}
                  className="w-full mt-8 py-5 border-2 border-dashed border-slate-100 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 rounded-[1.5rem] hover:border-sky-300 hover:text-sky-600 transition-all hover:bg-sky-50 active:scale-95">
                  + Register Property
                </button>
              </div>
            </div>

            {/* Main Form Area */}
            <div className="lg:col-span-8 space-y-10">
               {/* AI Studio Strip */}
               <div className="bg-slate-900 p-3 rounded-[2.5rem] flex items-center shadow-2xl border border-white/5 group hover:border-sky-500/30 transition-all">
                 <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-sky-500 via-sky-400 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg group-hover:rotate-6 transition-transform">
                   <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                 </div>
                 <input 
                    placeholder="AI Prompt: 'A 5BHK luxury estate in Karjat with a infinity pool...'" 
                    className="flex-grow bg-transparent border-none outline-none px-6 text-white font-bold text-sm lg:text-base placeholder:text-slate-600"
                    value={aiPrompt} 
                    onChange={e => setAiPrompt(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleMagicPrompt()} 
                 />
                 <button onClick={handleMagicPrompt} disabled={isGeneratingAI || !aiPrompt.trim()} className="px-8 py-4 bg-white text-slate-900 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-sky-400 transition-all disabled:opacity-30 active:scale-95 shadow-xl">
                   {isGeneratingAI ? 'Processing...' : 'Draft'}
                 </button>
               </div>

               {/* Inventory Editor */}
               <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-slate-50">
                  <form onSubmit={handleSubmitVilla} className="space-y-12">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-50 pb-10">
                       <div>
                         <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2">Editor Suite</p>
                         <h2 className="text-3xl lg:text-5xl font-bold font-serif text-slate-900">{isEditingVilla ? 'Modify Sanctuary' : 'New Property'}</h2>
                       </div>
                       <button type="button" onClick={handleGenerateAI} disabled={isGeneratingAI || !villaForm.name} className="px-8 py-4 bg-sky-50 text-sky-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-100 active:scale-95 disabled:opacity-30 transition-all flex items-center gap-3">
                          <i className="fa-solid fa-sparkles text-amber-500"></i> AI Enrichment
                       </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Sanctuary Identity</label>
                          <input required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] text-sm lg:text-base font-bold text-slate-800 border-none shadow-inner focus:ring-4 focus:ring-sky-500/10 transition-all" value={villaForm.name} onChange={e => setVillaForm({...villaForm, name: e.target.value})} placeholder="Property Name" />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Geography</label>
                          <input required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] text-sm lg:text-base font-bold text-slate-800 border-none shadow-inner focus:ring-4 focus:ring-sky-500/10 transition-all" value={villaForm.location} onChange={e => setVillaForm({...villaForm, location: e.target.value})} placeholder="Location (e.g. Goa, India)" />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                          { id: 'pricePerNight', label: 'Rate / Night', icon: 'fa-indian-rupee-sign' },
                          { id: 'bedrooms', label: 'BHK', icon: 'fa-bed' },
                          { id: 'bathrooms', label: 'Baths', icon: 'fa-shower' },
                          { id: 'capacity', label: 'Capacity', icon: 'fa-users' }
                        ].map(field => (
                          <div key={field.id} className="space-y-4">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">{field.label}</label>
                            <div className="relative">
                              <i className={`fa-solid ${field.icon} absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-xs`}></i>
                              <input type="number" className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl font-black text-slate-900 text-base border-none shadow-inner" value={(villaForm as any)[field.id]} onChange={e => setVillaForm({...villaForm, [field.id]: Number(e.target.value)})} />
                            </div>
                          </div>
                        ))}
                     </div>

                     <div className="space-y-10 pt-10 border-t border-slate-50">
                        <div className="p-8 bg-sky-50 rounded-[3rem] border border-sky-100 flex flex-col md:flex-row items-center gap-8">
                          <div className="flex-grow space-y-4">
                            <label className="text-[10px] font-black uppercase text-sky-600 tracking-widest px-1">AI Narrative Studio</label>
                            <input 
                              placeholder="Creative hint: 'Focus on infinity pool and sunset views'..." 
                              className="w-full bg-white px-8 py-4 rounded-2xl border border-sky-100 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                              value={descriptionPrompt}
                              onChange={e => setDescriptionPrompt(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleCustomDescriptionGenerate()}
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={handleCustomDescriptionGenerate}
                            disabled={isGeneratingAI || !descriptionPrompt.trim() || !villaForm.name}
                            className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 shadow-xl disabled:opacity-30 transition-all flex items-center gap-3 shrink-0"
                          >
                            <i className="fa-solid fa-wand-sparkles"></i> Build Narrative
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-10">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Elevator Pitch (Short)</label>
                            <textarea rows={2} className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] text-sm lg:text-base font-medium border-none shadow-inner leading-relaxed" value={villaForm.description} onChange={e => setVillaForm({...villaForm, description: e.target.value})} placeholder="Engaging one-liner..." />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Detailed Chronicle (Long)</label>
                            <textarea rows={6} className="w-full px-8 py-6 bg-slate-50 rounded-[2.5rem] text-sm lg:text-base font-medium border-none shadow-inner leading-relaxed" value={villaForm.longDescription} onChange={e => setVillaForm({...villaForm, longDescription: e.target.value})} placeholder="Immersive property story..." />
                          </div>
                        </div>
                     </div>

                     <div className="space-y-6 pt-10 border-t border-slate-50">
                        <div className="flex justify-between items-center mb-4">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Visual Gallery</label>
                           <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">{(villaForm.imageUrls || []).length} Assets</span>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                           {(villaForm.imageUrls || []).map((url, i) => (
                             <div key={i} className="aspect-square rounded-[1.5rem] overflow-hidden bg-slate-100 relative group border border-slate-100 shadow-sm hover:scale-105 transition-transform">
                                <img src={url} className="w-full h-full object-cover" alt="" />
                                <button type="button" className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all" onClick={() => setVillaForm(prev => ({...prev, imageUrls: (prev.imageUrls || []).filter(u => u !== url)}))}>
                                   <i className="fa-solid fa-trash-can text-base"></i>
                                </button>
                             </div>
                           ))}
                           <label className="aspect-square rounded-[1.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-sky-300 transition-all active:scale-95 group">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-500 transition-all mb-2">
                                {isUploading ? <i className="fa-solid fa-rotate animate-spin text-sm"></i> : <i className="fa-solid fa-plus text-sm"></i>}
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Add Asset</span>
                              <input type="file" multiple className="hidden" onChange={handleMediaUpload} disabled={isUploading} />
                           </label>
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row gap-6 items-center pt-16">
                        <button type="submit" disabled={isSyncing} className="w-full md:flex-1 py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-sky-600 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-5">
                           {isSyncing ? <i className="fa-solid fa-rotate animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                           {isEditingVilla ? 'Sync Changes' : 'Publish Property'}
                        </button>
                        {isEditingVilla && (
                          <button type="button" onClick={() => { setIsEditingVilla(false); setVillaForm(initialVilla); }} className="w-full md:w-auto px-12 py-7 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:text-red-500 transition-colors">
                            Discard
                          </button>
                        )}
                     </div>
                  </form>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-10 animate-fade">
             <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-slate-50">
                <div className="flex justify-between items-end mb-16">
                  <div>
                    <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2">Guest Relations</p>
                    <h2 className="text-3xl lg:text-6xl font-bold font-serif text-slate-900 tracking-tighter">Stay Inquiries</h2>
                  </div>
                  <div className="flex gap-4">
                    <div className="px-6 py-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 flex items-center gap-3">
                      <i className="fa-solid fa-bolt text-amber-500"></i> {leads.length} Total
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left border-separate border-spacing-y-4">
                      <thead>
                         <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-8">
                            <th className="px-8 py-5">Sanctuary</th>
                            <th className="px-8 py-5">Guest Information</th>
                            <th className="px-8 py-5">Stay Window</th>
                            <th className="px-8 py-5">Lead Status</th>
                            <th className="px-8 py-5 text-right">Registry Actions</th>
                         </tr>
                      </thead>
                      <tbody>
                         {leads.map(lead => (
                           <tr key={lead.id} className="bg-slate-50/40 hover:bg-white transition-all group rounded-3xl shadow-sm hover:shadow-xl border border-transparent hover:border-slate-50">
                              <td className="px-8 py-8 font-black text-slate-800 rounded-l-[2rem] text-sm lg:text-base">{lead.villaName}</td>
                              <td className="px-8 py-8">
                                <p className="text-sm font-bold text-slate-700">{lead.customerName || 'Anonymous Guest'}</p>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Source: {lead.source}</p>
                              </td>
                              <td className="px-8 py-8">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 text-[10px]">
                                     <i className="fa-solid fa-calendar"></i>
                                   </div>
                                   <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                      {lead.checkIn || 'TBD'} <span className="mx-1 text-slate-200">/</span> {lead.checkOut || 'TBD'}
                                   </span>
                                 </div>
                              </td>
                              <td className="px-8 py-8">
                                 <select 
                                   className={`border rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-sm outline-none cursor-pointer transition-all ${getStatusBadge(lead.status)}`}
                                   value={lead.status}
                                   onChange={(e) => handleUpdateLead(lead.id, e.target.value as any)}
                                 >
                                    <option value="new">New Inquiry</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="booked">Booked</option>
                                    <option value="lost">Archived</option>
                                 </select>
                              </td>
                              <td className="px-8 py-8 text-right rounded-r-[2rem]">
                                 <div className="flex justify-end gap-3">
                                   <button onClick={() => window.open(`https://wa.me/${settings.whatsappNumber}`, '_blank')} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                      <i className="fa-brands fa-whatsapp text-lg"></i>
                                   </button>
                                   <button onClick={() => setLeadToDelete(lead)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                      <i className="fa-solid fa-trash-can text-sm"></i>
                                   </button>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                {leads.length === 0 && (
                  <div className="py-40 text-center text-slate-200">
                     <i className="fa-solid fa-inbox text-7xl mb-6 block opacity-20"></i>
                     <p className="font-black text-[12px] uppercase tracking-[0.5em] opacity-40">Pipeline empty</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 animate-fade items-start">
             <div className="lg:col-span-4 sticky top-40">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50">
                   <h2 className="text-2xl font-bold font-serif text-slate-900 mb-10">{editingServiceId ? 'Update Ritual' : 'New Ritual'}</h2>
                   <form onSubmit={handleSubmitService} className="space-y-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Service Title</label>
                         <input required className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm border-none shadow-inner transition-all focus:ring-4 focus:ring-sky-500/10" value={serviceForm.title} onChange={e => setServiceForm({...serviceForm, title: e.target.value})} placeholder="e.g. Bespoke Butler" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Icon Representation</label>
                         <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto no-scrollbar p-1">
                            {SERVICE_ICONS.map(icon => (
                              <button type="button" key={icon} onClick={() => setServiceForm({...serviceForm, icon})} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${serviceForm.icon === icon ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-300 hover:bg-sky-50 hover:text-sky-600'}`}>
                                 <i className={`fa-solid ${icon} text-sm`}></i>
                              </button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Service Narrative</label>
                         <textarea rows={4} required className="w-full px-6 py-5 bg-slate-50 rounded-2xl text-sm font-medium border-none shadow-inner leading-relaxed" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} placeholder="Describe the concierge offering..." />
                      </div>
                      <div className="flex gap-4 pt-4">
                         <button type="submit" className="flex-grow py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-sky-600 transition-all active:scale-95">
                            {editingServiceId ? 'Sync Ritual' : 'Commit Ritual'}
                         </button>
                         {editingServiceId && (
                           <button type="button" onClick={() => { setEditingServiceId(null); setServiceForm({title: '', description: '', icon: 'fa-concierge-bell'}); }} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all">
                             <i className="fa-solid fa-xmark"></i>
                           </button>
                         )}
                      </div>
                   </form>
                </div>
             </div>
             <div className="lg:col-span-8">
                <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-slate-50 min-h-[600px]">
                   <h2 className="text-3xl lg:text-5xl font-bold font-serif text-slate-900 mb-16 tracking-tight">Ritual Catalog</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {services.map(service => (
                        <div key={service.id} className="p-8 rounded-[2.5rem] bg-slate-50/50 border border-slate-50 flex flex-col group hover:bg-white hover:shadow-2xl hover:border-sky-100 transition-all">
                           <div className="flex justify-between items-start mb-6">
                              <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-lg flex items-center justify-center text-sky-500 text-2xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                                 <i className={`fa-solid ${service.icon}`}></i>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                 <button onClick={() => { setEditingServiceId(service.id); setServiceForm(service); }} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-sky-600 shadow-sm transition-all"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                                 <button onClick={() => setServiceToDelete(service)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 shadow-sm transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                              </div>
                           </div>
                           <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight">{service.title}</h3>
                           <p className="text-xs text-slate-500 leading-relaxed font-medium opacity-80">{service.description}</p>
                        </div>
                      ))}
                   </div>
                   {services.length === 0 && (
                     <div className="py-40 text-center text-slate-200">
                        <i className="fa-solid fa-concierge-bell text-7xl mb-6 block opacity-20"></i>
                        <p className="font-black text-[12px] uppercase tracking-[0.5em] opacity-40">Rituals registry empty</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 animate-fade items-start">
             <div className="lg:col-span-4 sticky top-40">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50">
                   <h2 className="text-2xl font-bold font-serif text-slate-900 mb-10">{editingReviewId ? 'Modify Story' : 'New Story'}</h2>
                   <form onSubmit={handleSubmitReview} className="space-y-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Guest Identity</label>
                         <input required className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm border-none shadow-inner focus:ring-4 focus:ring-sky-500/10 transition-all" value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name: e.target.value})} placeholder="Guest Name" />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Chapter</label>
                            <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase tracking-widest border-none shadow-inner outline-none cursor-pointer hover:bg-slate-100 transition-colors" value={reviewForm.category} onChange={e => setReviewForm({...reviewForm, category: e.target.value as any})}>
                               {['Trip', 'Booking', 'Food', 'Service', 'Hospitality'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Quality</label>
                            <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black text-[10px] border-none shadow-inner outline-none cursor-pointer hover:bg-slate-100 transition-colors" value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})}>
                               {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                            </select>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Chronicle Narrative</label>
                         <textarea rows={5} required className="w-full px-6 py-5 bg-slate-50 rounded-2xl text-sm font-medium border-none shadow-inner leading-relaxed" value={reviewForm.content} onChange={e => setReviewForm({...reviewForm, content: e.target.value})} placeholder="What was their stay like?..." />
                      </div>
                      <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-sky-600 transition-all active:scale-95">
                         {editingReviewId ? 'Sync Story' : 'Publish Story'}
                      </button>
                   </form>
                </div>
             </div>
             <div className="lg:col-span-8">
                <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-slate-50 min-h-[600px]">
                   <h2 className="text-3xl lg:text-5xl font-bold font-serif text-slate-900 mb-16 tracking-tight">Verified Chronicles</h2>
                   <div className="space-y-8">
                      {testimonials.map(t => (
                        <div key={t.id} className="p-10 rounded-[3rem] bg-slate-50/40 border border-slate-50 flex flex-col md:flex-row gap-10 group hover:bg-white hover:shadow-2xl hover:border-sky-100 transition-all duration-500">
                           <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shrink-0 shadow-lg border-4 border-white group-hover:rotate-3 transition-transform">
                              <img src={t.avatar} className="w-full h-full object-cover" alt="" />
                           </div>
                           <div className="flex-grow">
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <h3 className="text-xl font-bold text-slate-900 leading-none mb-2">{t.name}</h3>
                                    <div className="flex text-amber-400 text-[10px] gap-1">
                                       {[...Array(t.rating)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                                    </div>
                                 </div>
                                 <span className="text-[9px] font-black uppercase tracking-widest px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full border border-sky-100">{t.category}</span>
                              </div>
                              <p className="text-sm lg:text-base text-slate-600 italic leading-relaxed mb-8 opacity-80">"{t.content}"</p>
                              <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                 <button onClick={() => { setEditingReviewId(t.id); setReviewForm(t); }} className="w-11 h-11 rounded-xl bg-slate-50 text-slate-400 hover:text-sky-600 shadow-sm transition-all"><i className="fa-solid fa-pen-nib text-sm"></i></button>
                                 <button onClick={() => setTestimonialToDelete(t)} className="w-11 h-11 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 shadow-sm transition-all"><i className="fa-solid fa-trash-can text-sm"></i></button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                   {testimonials.length === 0 && (
                     <div className="py-40 text-center text-slate-200">
                        <i className="fa-solid fa-comment-dots text-7xl mb-6 block opacity-20"></i>
                        <p className="font-black text-[12px] uppercase tracking-[0.5em] opacity-40">Chronicles database empty</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 animate-fade">
             {/* Configuration Panel */}
             <div className="lg:col-span-8 bg-white p-10 lg:p-20 rounded-[4rem] shadow-2xl border border-slate-50">
                <div className="flex items-center gap-6 mb-12 border-b border-slate-50 pb-12">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-sky-500 shadow-xl">
                      <i className="fa-solid fa-palette text-3xl"></i>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">Brand Studio</p>
                      <h2 className="text-3xl lg:text-5xl font-bold font-serif text-slate-900 tracking-tighter">Identity Console</h2>
                   </div>
                </div>
                
                <div className="space-y-16 text-left">
                   {/* Assets Studio */}
                   <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100">
                      <h3 className="text-2xl font-bold font-serif text-slate-900 mb-8 flex items-center gap-4">
                        <i className="fa-solid fa-fingerprint text-sky-600 text-lg"></i> Brand Assets
                      </h3>
                      <div className="flex flex-col md:flex-row items-center gap-12">
                         <div className="w-40 h-40 rounded-[2.5rem] bg-white border border-slate-100 shadow-inner flex items-center justify-center overflow-hidden relative group">
                            {brandingData.siteLogo ? (
                               <img src={brandingData.siteLogo} alt="Logo Preview" className="w-full h-full object-contain p-6 transition-transform group-hover:scale-110" />
                            ) : (
                               <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-200">
                                  <i className="fa-solid fa-mountain text-4xl"></i>
                               </div>
                            )}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                               <label className="cursor-pointer text-white text-[10px] font-black uppercase tracking-[0.2em] flex flex-col items-center gap-2">
                                  {isUploading ? <i className="fa-solid fa-rotate animate-spin text-lg"></i> : <i className="fa-solid fa-camera text-lg"></i>}
                                  <span>Update</span>
                                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                               </label>
                            </div>
                         </div>
                         <div className="flex-grow space-y-6">
                            <div>
                               <p className="text-lg font-black text-slate-800 leading-none mb-2">Master Logo Mark</p>
                               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest opacity-80">Syncs to Navbar, Footer & PWA manifest</p>
                            </div>
                            <div className="flex gap-4">
                               <label className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-sky-300 transition-all cursor-pointer shadow-sm">
                                  {isUploading ? 'Processing Asset...' : 'Upload New Mark'}
                                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                               </label>
                               {brandingData.siteLogo && (
                                  <button onClick={() => setBrandingData({...brandingData, siteLogo: ''})} className="px-8 py-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                     Purge
                                  </button>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* UI Configuration */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Visual Atmosphere</label>
                         <select className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] font-black text-slate-800 border-none shadow-inner outline-none transition-all cursor-pointer hover:bg-white focus:ring-4 focus:ring-sky-500/10 appearance-none" value={brandingData.activeTheme} onChange={e => setBrandingData({...brandingData, activeTheme: e.target.value as AppTheme})}>
                            {Object.values(AppTheme).map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Signature Color</label>
                         <div className="flex items-center gap-4">
                            <input type="color" className="w-20 h-20 rounded-[2rem] p-1.5 bg-white border border-slate-100 cursor-pointer shadow-sm hover:scale-110 transition-transform" value={brandingData.primaryColor} onChange={e => setBrandingData({...brandingData, primaryColor: e.target.value})} />
                            <input className="flex-grow px-6 py-5 bg-slate-50 rounded-[2rem] font-mono text-sm font-black border-none shadow-inner focus:ring-4 focus:ring-sky-500/10 transition-all" value={brandingData.primaryColor} onChange={e => setBrandingData({...brandingData, primaryColor: e.target.value})} />
                         </div>
                      </div>
                   </div>

                   {/* Connectivity Info */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Executive Email</label>
                         <input className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] font-black text-slate-800 border-none shadow-inner focus:ring-4 focus:ring-sky-500/10 transition-all" value={brandingData.contactEmail} onChange={e => setBrandingData({...brandingData, contactEmail: e.target.value})} placeholder="reservations@domain.com" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">WhatsApp Priority</label>
                         <input className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] font-black text-slate-800 border-none shadow-inner focus:ring-4 focus:ring-sky-500/10 transition-all" value={brandingData.whatsappNumber} onChange={e => setBrandingData({...brandingData, whatsappNumber: e.target.value})} placeholder="+91..." />
                      </div>
                   </div>

                   {/* Global Marquee */}
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Global Sky Marquee (Announcement)</label>
                      <div className="relative group">
                        <i className="fa-solid fa-megaphone absolute left-6 top-1/2 -translate-y-1/2 text-sky-400 group-hover:rotate-12 transition-transform"></i>
                        <input className="w-full pl-16 pr-8 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs sm:text-sm border-none shadow-2xl focus:ring-4 focus:ring-sky-500/20 outline-none transition-all" value={brandingData.promoText} onChange={e => setBrandingData({...brandingData, promoText: e.target.value})} />
                      </div>
                   </div>

                   {/* Conversion Studio */}
                   <div className="p-10 bg-slate-900 text-white rounded-[3.5rem] shadow-2xl space-y-10">
                      <div className="flex items-center justify-between border-b border-white/10 pb-10">
                         <div>
                            <h3 className="text-2xl font-bold font-serif">Engagement Hook</h3>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">Modal Popup Orchestra</p>
                         </div>
                         <button 
                           onClick={() => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, enabled: !brandingData.offerPopup.enabled}})}
                           className={`w-16 h-9 rounded-full transition-all flex items-center px-1.5 ${brandingData.offerPopup.enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                         >
                            <div className="w-6 h-6 bg-white rounded-full shadow-lg"></div>
                         </button>
                      </div>

                      <div className={`space-y-8 transition-all duration-700 ${brandingData.offerPopup.enabled ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-4 pointer-events-none'}`}>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                               <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Modal Headline</label>
                               <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-white focus:bg-white/10 outline-none transition-all" value={brandingData.offerPopup.title} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, title: e.target.value}})} />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Visual Asset URL</label>
                               <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-white focus:bg-white/10 outline-none transition-all" value={brandingData.offerPopup.imageUrl} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, imageUrl: e.target.value}})} />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Offer Narrative</label>
                            <textarea rows={3} className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] text-sm font-medium text-slate-300 focus:bg-white/10 outline-none transition-all leading-relaxed" value={brandingData.offerPopup.description} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, description: e.target.value}})} />
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                               <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Action Button</label>
                               <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-white focus:bg-white/10 outline-none transition-all" value={brandingData.offerPopup.buttonText} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, buttonText: e.target.value}})} />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Internal Target</label>
                               <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-white focus:bg-white/10 outline-none transition-all" value={brandingData.offerPopup.buttonLink} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, buttonLink: e.target.value}})} />
                            </div>
                         </div>
                      </div>
                   </div>

                   <button onClick={handleSaveBranding} disabled={isSyncing} className="w-full py-8 bg-sky-600 text-white rounded-[3rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-5">
                      {isSyncing ? <i className="fa-solid fa-rotate animate-spin text-lg"></i> : <i className="fa-solid fa-cloud-arrow-up text-lg"></i>}
                      Synchronize Visual Identity
                   </button>
                </div>
             </div>

             {/* Live Preview Console */}
             <div className="lg:col-span-4 space-y-8 sticky top-40">
                <div className="bg-slate-900 p-10 lg:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px]"></div>
                   <h3 className="text-2xl font-bold font-serif mb-10 flex items-center gap-4 relative z-10">
                     <i className="fa-solid fa-desktop text-sky-400"></i> Identity Stream
                   </h3>
                   <div className="p-10 bg-white rounded-[3rem] text-slate-900 shadow-2xl space-y-10 relative z-10 border border-white/5 group hover:scale-[1.02] transition-transform duration-500">
                      {/* Nav Simulation */}
                      <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                         <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
                            {brandingData.siteLogo ? <img src={brandingData.siteLogo} className="w-full h-full object-contain p-2" /> : <i className="fa-solid fa-mountain text-sky-500 text-xl"></i>}
                         </div>
                         <div className="flex-grow space-y-1.5">
                            <div className="w-24 h-2.5 bg-slate-200 rounded-full" style={{background: brandingData.primaryColor, opacity: 0.15}}></div>
                            <div className="w-14 h-1.5 bg-slate-100 rounded-full opacity-40"></div>
                         </div>
                      </div>
                      {/* Hero Simulation */}
                      <div className="space-y-4">
                         <div className="w-full h-4 rounded-full bg-slate-100 mb-6 overflow-hidden relative">
                            <div className="absolute inset-0 transition-all duration-700" style={{background: brandingData.primaryColor}}></div>
                         </div>
                         <div className="space-y-2.5">
                            <div className="w-full h-2 rounded-full bg-slate-50"></div>
                            <div className="w-5/6 h-2 rounded-full bg-slate-50"></div>
                            <div className="w-2/3 h-2 rounded-full bg-slate-50"></div>
                            <div className="w-full h-14 rounded-2xl mt-8 text-white flex items-center justify-center text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-700 shadow-xl" style={{background: brandingData.primaryColor}}>
                               Interaction
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="mt-12 space-y-6 opacity-60">
                     <div className="flex items-start gap-4">
                       <i className="fa-solid fa-shield-halved text-emerald-500 text-sm mt-1"></i>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Identity changes synchronize globally across all active guest sessions.</p>
                     </div>
                     <div className="flex items-start gap-4">
                       <i className="fa-solid fa-server text-emerald-500 text-sm mt-1"></i>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Assets are served via globally distributed edge cache endpoints.</p>
                     </div>
                   </div>
                </div>

                {/* Local Diagnostics */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden group">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="font-bold text-slate-900 text-lg">Platform Health</h4>
                    <button onClick={handleRunDiagnostics} className="text-sky-600 hover:rotate-180 transition-all duration-500">
                      <i className={`fa-solid fa-rotate ${isRunningDiagnostics ? 'animate-spin' : ''}`}></i>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {diagnostics.length > 0 ? diagnostics.slice(0, 4).map(test => (
                      <div key={test.id} className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{test.name}</span>
                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${test.status === 'healthy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {test.status === 'healthy' ? 'Verified' : 'Failure'}
                        </div>
                      </div>
                    )) : (
                      <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic py-4">Diagnostics idle...</p>
                    )}
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-50 flex justify-center">
                    <button onClick={handleRunDiagnostics} className="text-[9px] font-black uppercase tracking-[0.3em] text-sky-600 hover:text-slate-900 transition-colors">
                      Run Deep Diagnostics <i className="fa-solid fa-arrow-right-long ml-2 group-hover:translate-x-2 transition-transform"></i>
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODALS */}
      {(villaToDelete || leadToDelete || serviceToDelete || testimonialToDelete) && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl animate-fade">
           <div className="bg-white rounded-[4rem] p-12 lg:p-16 max-w-lg w-full text-center shadow-[0_50px_120px_rgba(0,0,0,0.5)] animate-popup border border-white/10">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                 <i className="fa-solid fa-trash-can text-3xl"></i>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold font-serif text-slate-900 mb-4 tracking-tight">Purge Registry Entry?</h2>
              <p className="text-slate-400 font-medium text-base lg:text-lg mb-12 leading-relaxed italic">
                "This action is irreversible and will permanently remove the record from the cloud persistence layer."
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                   onClick={() => {
                     if (villaToDelete) handleConfirmDeleteVilla();
                     if (leadToDelete) handleConfirmDeleteLead();
                     if (serviceToDelete) handleConfirmDeleteService();
                     if (testimonialToDelete) handleConfirmDeleteReview();
                   }}
                   className="flex-grow py-5 bg-red-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-red-700 transition-all active:scale-95 shadow-2xl shadow-red-600/20"
                 >
                   Confirm Deletion
                 </button>
                 <button 
                   onClick={() => { setVillaToDelete(null); setLeadToDelete(null); setServiceToDelete(null); setTestimonialToDelete(null); }}
                   className="px-10 py-5 bg-slate-50 text-slate-400 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-200 hover:text-slate-700 transition-all"
                 >
                   Retreat
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
