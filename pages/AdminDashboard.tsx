
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

  // --- Inventory Actions ---
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
        triggerSyncFeedback('AI Parse Error', false, 'The model returned an incompatible format. Please try rephrasing.');
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

  // --- Leads / Inquiries ---
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

  // --- Services ---
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

  // --- Reviews ---
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

  // --- Branding ---
  const handleSaveBranding = async () => {
    setIsSyncing(true);
    triggerSyncFeedback('Updating Identity...');
    try { 
      // Always pass the current full state to ensure all fields persist correctly
      await updateSettings(brandingData); 
      triggerSyncFeedback('Identity synchronized', true);
    } catch (err: any) {
      console.error("Save branding error:", err);
      triggerSyncFeedback('Update failed', false, err.message || "Cloud link update failed.");
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16 bg-[#fcfdfe] min-h-screen text-left relative">
      
      {/* GLOBAL HUD */}
      {progress.active && (
        <div className="fixed bottom-24 lg:bottom-10 right-4 lg:right-10 z-[500] animate-reveal">
          <div className={`bg-white border p-6 lg:p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-72 lg:w-80 transition-all ${progress.status === 'error' ? 'border-red-100' : 'border-sky-50'}`}>
             <div className="flex items-center gap-4 lg:gap-6 mb-4">
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white transition-all duration-500 ${
                  progress.status === 'error' ? 'bg-red-500' : 
                  progress.status === 'synced' ? 'bg-emerald-500' : 'bg-slate-900 animate-pulse'
                }`}>
                  <i className={`fa-solid ${progress.status === 'error' ? 'fa-triangle-exclamation' : (progress.status === 'synced' ? 'fa-check' : 'fa-rotate')}`}></i>
                </div>
                <div className="min-w-0">
                   <h4 className="font-black text-[8px] uppercase tracking-widest text-slate-400">Cloud Link</h4>
                   <p className="text-xs lg:text-sm font-black text-slate-900 truncate">{progress.message}</p>
                </div>
             </div>
             {progress.status === 'syncing' && (
               <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${progress.percentage}%` }}></div>
               </div>
             )}
             {progress.error && (
               <p className="mt-2 text-[8px] text-red-500 font-bold uppercase tracking-widest">{progress.error}</p>
             )}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 lg:mb-20 gap-8">
        <div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-slate-900 mb-2 tracking-tighter">Mission Control</h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${cloudStatus.db ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span className="text-[7px] sm:text-[8px] font-black uppercase text-slate-400 tracking-widest">Database: {cloudStatus.db ? 'STABLE' : 'OFFLINE'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${cloudStatus.storage ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span className="text-[7px] sm:text-[8px] font-black uppercase text-slate-400 tracking-widest">Assets: {cloudStatus.storage ? 'STABLE' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-auto -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar py-2">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 min-w-max gap-1">
            {(['inventory', 'inquiries', 'services', 'reviews', 'branding'] as AdminTab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 lg:px-8 py-2.5 lg:py-3.5 rounded-xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-fade">
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-slate-50 lg:sticky lg:top-40 max-h-[60vh] sm:max-h-screen overflow-hidden flex flex-col">
              <h2 className="text-xl font-bold font-serif text-slate-900 mb-6">Property Registry</h2>
              <div className="space-y-2 overflow-y-auto no-scrollbar flex-grow pr-1">
                {villas.map(v => (
                  <div key={v.id} onClick={() => { setVillaForm(v); setIsEditingVilla(true); }} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center gap-3 sm:gap-4 group ${villaForm.id === v.id ? 'bg-sky-50 border-sky-100' : 'bg-white border-slate-50'}`}>
                    <img src={v.imageUrls?.[0]} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shadow-sm" alt="" />
                    <div className="min-w-0 flex-grow">
                      <p className="text-[10px] sm:text-xs font-bold text-slate-900 truncate">{v.name}</p>
                      <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{v.location}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setVillaToDelete(v); }} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                      <i className="fa-solid fa-trash text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => { setIsEditingVilla(false); setVillaForm(initialVilla); }}
                className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 rounded-xl hover:border-sky-300 hover:text-sky-600 transition-all active:scale-95">
                + Add Property
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 order-1 lg:order-2">
             <div className="mb-6 bg-slate-900 p-2 rounded-2xl flex items-center shadow-lg border border-white/5">
               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg">
                 <i className="fa-solid fa-wand-magic-sparkles text-sm sm:text-lg"></i>
               </div>
               <input 
                  placeholder="AI Draft: '4BHK Pool Villa in Goa...'" 
                  className="flex-grow bg-transparent border-none outline-none px-4 text-white font-bold text-xs sm:text-sm placeholder:text-slate-600"
                  value={aiPrompt} 
                  onChange={e => setAiPrompt(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleMagicPrompt()} 
               />
               <button onClick={handleMagicPrompt} disabled={isGeneratingAI || !aiPrompt.trim()} className="px-4 lg:px-6 py-2.5 bg-white text-slate-900 rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest hover:bg-sky-400 transition-all disabled:opacity-20 active:scale-90">
                 {isGeneratingAI ? 'Drafting...' : 'Build'}
               </button>
             </div>

             <div className="bg-white p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] shadow-xl border border-slate-100">
                <form onSubmit={handleSubmitVilla} className="space-y-8 sm:space-y-12">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-8">
                     <h2 className="text-xl sm:text-3xl font-bold font-serif text-slate-900">{isEditingVilla ? 'Modify Sanctuary' : 'Register Sanctuary'}</h2>
                     <button type="button" onClick={handleGenerateAI} disabled={isGeneratingAI || !villaForm.name} className="px-5 py-3 bg-sky-50 text-sky-600 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-sky-100 active:scale-95 disabled:opacity-30 transition-all">
                        <i className="fa-solid fa-sparkles mr-2"></i> Auto Enrich
                     </button>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                      <div className="space-y-2.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Property Name</label>
                        <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-800 border-none shadow-inner focus:ring-2 focus:ring-sky-500" value={villaForm.name} onChange={e => setVillaForm({...villaForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Geography</label>
                        <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-800 border-none shadow-inner focus:ring-2 focus:ring-sky-500" value={villaForm.location} onChange={e => setVillaForm({...villaForm, location: e.target.value})} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                      {[
                        { id: 'pricePerNight', label: 'Rate/Night', icon: 'fa-indian-rupee-sign' },
                        { id: 'bedrooms', label: 'BHK', icon: 'fa-bed' },
                        { id: 'bathrooms', label: 'Baths', icon: 'fa-shower' },
                        { id: 'capacity', label: 'Max Guests', icon: 'fa-users' }
                      ].map(field => (
                        <div key={field.id} className="space-y-2.5">
                          <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest truncate">{field.label}</label>
                          <div className="relative">
                            <i className={`fa-solid ${field.icon} absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]`}></i>
                            <input type="number" className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-xl sm:rounded-2xl font-black text-slate-900 text-sm border-none shadow-inner" value={(villaForm as any)[field.id]} onChange={e => setVillaForm({...villaForm, [field.id]: Number(e.target.value)})} />
                          </div>
                        </div>
                      ))}
                   </div>

                   <div className="space-y-6">
                      <div className="p-5 bg-sky-50/50 rounded-3xl border border-sky-100">
                        <label className="text-[9px] font-black uppercase text-sky-600 tracking-widest px-1 mb-2 block">AI Narrative Instruction</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input 
                            placeholder="e.g. 'Focus on the pool deck and sunset views' or 'Make it sound romantic'..." 
                            className="flex-grow bg-white px-5 py-3 rounded-xl border border-sky-100 text-xs font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                            value={descriptionPrompt}
                            onChange={e => setDescriptionPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCustomDescriptionGenerate()}
                          />
                          <button 
                            type="button"
                            onClick={handleCustomDescriptionGenerate}
                            disabled={isGeneratingAI || !descriptionPrompt.trim() || !villaForm.name}
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-600 disabled:opacity-30 transition-all flex items-center justify-center gap-2 shrink-0"
                          >
                            <i className="fa-solid fa-wand-sparkles"></i> Generate Story
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Short Summary</label>
                        <textarea rows={2} className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-medium border-none shadow-inner" value={villaForm.description} onChange={e => setVillaForm({...villaForm, description: e.target.value})} placeholder="Short captivating summary..." />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Detailed Narrative</label>
                        <textarea rows={6} className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-medium border-none shadow-inner" value={villaForm.longDescription} onChange={e => setVillaForm({...villaForm, longDescription: e.target.value})} placeholder="Detailed property story..." />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Media Catalog</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                         {(villaForm.imageUrls || []).map((url, i) => (
                           <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group border border-slate-200">
                              <img src={url} className="w-full h-full object-cover" alt="" />
                              <button type="button" className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-active:opacity-100 flex items-center justify-center transition-opacity" onClick={() => setVillaForm(prev => ({...prev, imageUrls: (prev.imageUrls || []).filter(u => u !== url)}))}>
                                 <i className="fa-solid fa-trash-can text-sm"></i>
                              </button>
                           </div>
                         ))}
                         <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all active:scale-95">
                            {isUploading ? <i className="fa-solid fa-spinner animate-spin text-lg"></i> : <i className="fa-solid fa-cloud-arrow-up text-lg"></i>}
                            <input type="file" multiple className="hidden" onChange={handleMediaUpload} disabled={isUploading} />
                         </label>
                      </div>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center pt-8 border-t border-slate-50">
                      <button type="submit" disabled={isSyncing} className="w-full sm:flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-sky-600 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
                         {isSyncing ? <i className="fa-solid fa-rotate animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                         {isEditingVilla ? 'Sync Changes' : 'Commit Registry'}
                      </button>
                      {isEditingVilla && (
                        <button type="button" onClick={() => { setIsEditingVilla(false); setVillaForm(initialVilla); }} className="w-full sm:w-auto px-10 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors">
                          Cancel
                        </button>
                      )}
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div className="animate-fade space-y-8">
           <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-slate-50">
              <h2 className="text-2xl font-bold font-serif text-slate-900 mb-8">Guest Inquiry Pipeline</h2>
              <div className="overflow-x-auto no-scrollbar -mx-8 px-8">
                 <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                       <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="px-6 py-4">Stay</th>
                          <th className="px-6 py-4">Guest</th>
                          <th className="px-6 py-4">Dates</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody>
                       {leads.map(lead => (
                         <tr key={lead.id} className="bg-slate-50/50 hover:bg-white transition-all group rounded-2xl">
                            <td className="px-6 py-6 font-bold text-slate-800 rounded-l-2xl">{lead.villaName}</td>
                            <td className="px-6 py-6 text-sm text-slate-600">{lead.customerName || 'Direct Guest'}</td>
                            <td className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               {lead.checkIn || 'TBD'} → {lead.checkOut || 'TBD'}
                            </td>
                            <td className="px-6 py-6">
                               <select 
                                 className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm outline-none cursor-pointer"
                                 value={lead.status}
                                 onChange={(e) => handleUpdateLead(lead.id, e.target.value as any)}
                               >
                                  <option value="new">New</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="booked">Booked</option>
                                  <option value="lost">Archived</option>
                               </select>
                            </td>
                            <td className="px-6 py-6 text-right rounded-r-2xl">
                               <button onClick={() => setLeadToDelete(lead)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                  <i className="fa-solid fa-trash-can"></i>
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              {leads.length === 0 && (
                <div className="py-24 text-center text-slate-300">
                   <i className="fa-solid fa-inbox text-4xl mb-4 block"></i>
                   <p className="font-bold text-[10px] uppercase tracking-widest">No active inquiries</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade">
           <div className="lg:col-span-5">
              <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-slate-50 sticky top-40">
                 <h2 className="text-2xl font-bold font-serif text-slate-900 mb-8">{editingServiceId ? 'Edit Service' : 'Add Service'}</h2>
                 <form onSubmit={handleSubmitService} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Service Title</label>
                       <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-sm border-none shadow-inner" value={serviceForm.title} onChange={e => setServiceForm({...serviceForm, title: e.target.value})} placeholder="e.g. Private Chef" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Icon Representation</label>
                       <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                          {SERVICE_ICONS.map(icon => (
                            <button type="button" key={icon} onClick={() => setServiceForm({...serviceForm, icon})} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${serviceForm.icon === icon ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-sky-50'}`}>
                               <i className={`fa-solid ${icon}`}></i>
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Detailed Description</label>
                       <textarea rows={3} required className="w-full p-5 bg-slate-50 rounded-2xl text-sm font-medium border-none shadow-inner" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} placeholder="Describe the service offering..." />
                    </div>
                    <div className="flex gap-3">
                       <button type="submit" className="flex-grow py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-sky-600 transition-all">
                          {editingServiceId ? 'Update Service' : 'Add to Catalog'}
                       </button>
                       {editingServiceId && (
                         <button type="button" onClick={() => { setEditingServiceId(null); setServiceForm({title: '', description: '', icon: 'fa-concierge-bell'}); }} className="px-6 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-red-500">
                           Cancel
                         </button>
                       )}
                    </div>
                 </form>
              </div>
           </div>
           <div className="lg:col-span-7">
              <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-slate-100">
                 <h2 className="text-2xl font-bold font-serif text-slate-900 mb-8">Active Offerings</h2>
                 <div className="space-y-4">
                    {services.map(service => (
                      <div key={service.id} className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 flex items-center gap-6 group">
                         <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-sky-500 text-xl group-hover:bg-sky-500 group-hover:text-white transition-all">
                            <i className={`fa-solid ${service.icon}`}></i>
                         </div>
                         <div className="flex-grow min-w-0">
                            <h3 className="font-bold text-slate-900">{service.title}</h3>
                            <p className="text-xs text-slate-500 truncate">{service.description}</p>
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingServiceId(service.id); setServiceForm(service); }} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-sky-600 shadow-sm transition-all"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                            <button onClick={() => setServiceToDelete(service)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-red-500 shadow-sm transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade">
           <div className="lg:col-span-5">
              <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-slate-50 sticky top-40">
                 <h2 className="text-2xl font-bold font-serif text-slate-900 mb-8">{editingReviewId ? 'Modify Story' : 'Add Chronicle'}</h2>
                 <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Guest Name</label>
                       <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-sm border-none shadow-inner" value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name: e.target.value})} placeholder="Guest Name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Category</label>
                          <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-[10px] uppercase tracking-widest border-none shadow-inner outline-none cursor-pointer" value={reviewForm.category} onChange={e => setReviewForm({...reviewForm, category: e.target.value as any})}>
                             {['Trip', 'Booking', 'Food', 'Service', 'Hospitality'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Rating</label>
                          <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-[10px] border-none shadow-inner outline-none cursor-pointer" value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})}>
                             {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Chronicle Content</label>
                       <textarea rows={4} required className="w-full p-5 bg-slate-50 rounded-2xl text-sm font-medium border-none shadow-inner" value={reviewForm.content} onChange={e => setReviewForm({...reviewForm, content: e.target.value})} placeholder="What was their stay like?..." />
                    </div>
                    <div className="flex gap-3">
                       <button type="submit" className="flex-grow py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-sky-600 transition-all">
                          {editingReviewId ? 'Commit Update' : 'Publish Chronicle'}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
           <div className="lg:col-span-7">
              <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-slate-50">
                 <h2 className="text-2xl font-bold font-serif text-slate-900 mb-8">Verified Chronicles</h2>
                 <div className="space-y-6">
                    {testimonials.map(t => (
                      <div key={t.id} className="p-8 rounded-3xl bg-slate-50/50 border border-slate-100 flex gap-6 group hover:bg-white hover:shadow-xl transition-all">
                         <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-100">
                            <img src={t.avatar} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div className="flex-grow">
                            <div className="flex justify-between items-start mb-2">
                               <h3 className="font-bold text-slate-900">{t.name}</h3>
                               <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-sky-100 text-sky-600 rounded-full">{t.category}</span>
                            </div>
                            <p className="text-sm text-slate-600 italic leading-relaxed mb-4">"{t.content}"</p>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                               <div className="flex text-amber-400 text-[10px]">
                                  {[...Array(t.rating)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                               </div>
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingReviewId(t.id); setReviewForm(t); }} className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:text-sky-600 transition-all"><i className="fa-solid fa-pen text-[10px]"></i></button>
                                  <button onClick={() => setTestimonialToDelete(t)} className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:text-red-500 transition-all"><i className="fa-solid fa-trash text-[10px]"></i></button>
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-fade">
           <div className="lg:col-span-8 bg-white p-6 sm:p-16 rounded-[2.5rem] sm:rounded-[4rem] shadow-xl border border-slate-100">
              <h2 className="text-2xl sm:text-4xl font-bold font-serif text-slate-900 mb-10 border-b border-slate-50 pb-8">Visual Identity & Offers</h2>
              
              <div className="space-y-12 text-left">
                 {/* Logo Asset Section */}
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    <h3 className="text-xl font-bold font-serif text-slate-900 mb-6">Identity Assets</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-10">
                       <div className="w-32 h-32 rounded-3xl bg-white border border-slate-100 shadow-inner flex items-center justify-center overflow-hidden relative group">
                          {brandingData.siteLogo ? (
                             <img src={brandingData.siteLogo} alt="Site Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                          ) : (
                             <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-sky-500">
                                <i className="fa-solid fa-mountain"></i>
                             </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <label className="cursor-pointer text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                {isUploading ? <i className="fa-solid fa-rotate animate-spin"></i> : <i className="fa-solid fa-camera"></i>}
                                <span>{isUploading ? 'Uploading...' : 'Change'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                             </label>
                          </div>
                       </div>
                       <div className="flex-grow space-y-4">
                          <div>
                             <p className="text-sm font-bold text-slate-900">Company Logo</p>
                             <p className="text-[10px] text-slate-400 font-medium">Upload your company logo. PNG, SVG, or WebP recommended.</p>
                          </div>
                          <div className="flex gap-3">
                             <label className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
                                {isUploading ? 'Processing...' : 'Upload Brand Mark'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                             </label>
                             {brandingData.siteLogo && (
                                <button onClick={() => setBrandingData({...brandingData, siteLogo: ''})} className="px-6 py-2.5 bg-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                                   Remove
                                </button>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Active Atmosphere</label>
                       <select className="w-full p-5 bg-slate-50 rounded-2xl font-black text-slate-800 border-none shadow-inner outline-none transition-all cursor-pointer hover:bg-slate-100" value={brandingData.activeTheme} onChange={e => setBrandingData({...brandingData, activeTheme: e.target.value as AppTheme})}>
                          {Object.values(AppTheme).map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Core Identity Color</label>
                       <div className="flex items-center gap-4">
                          <input type="color" className="w-16 h-16 rounded-xl p-1 bg-white border border-slate-100 cursor-pointer shadow-sm hover:scale-105 transition-transform" value={brandingData.primaryColor} onChange={e => setBrandingData({...brandingData, primaryColor: e.target.value})} />
                          <input className="flex-grow p-4 bg-slate-50 rounded-xl font-mono text-[10px] border-none shadow-inner focus:ring-2 focus:ring-sky-500 transition-all" value={brandingData.primaryColor} onChange={e => setBrandingData({...brandingData, primaryColor: e.target.value})} />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Support Email</label>
                       <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none shadow-inner focus:ring-2 focus:ring-sky-500 transition-all" value={brandingData.contactEmail} onChange={e => setBrandingData({...brandingData, contactEmail: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">WhatsApp Hub</label>
                       <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none shadow-inner focus:ring-2 focus:ring-sky-500 transition-all" value={brandingData.whatsappNumber} onChange={e => setBrandingData({...brandingData, whatsappNumber: e.target.value})} />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Global Sky Marquee (Announcement)</label>
                    <div className="relative">
                      <i className="fa-solid fa-megaphone absolute left-5 top-1/2 -translate-y-1/2 text-sky-400"></i>
                      <input className="w-full pl-14 pr-6 py-5 bg-slate-900 text-white rounded-2xl font-bold text-xs border-none shadow-2xl focus:ring-2 focus:ring-sky-500 outline-none" value={brandingData.promoText} onChange={e => setBrandingData({...brandingData, promoText: e.target.value})} />
                    </div>
                 </div>

                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-8">
                    <div className="flex items-center justify-between">
                       <div>
                          <h3 className="text-xl font-bold font-serif text-slate-900">Engagement Hook (Offer Popup)</h3>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Syncs to guest entry sessions</p>
                       </div>
                       <button 
                         onClick={() => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, enabled: !brandingData.offerPopup.enabled}})}
                         className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${brandingData.offerPopup.enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}
                       >
                          <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                       </button>
                    </div>

                    <div className={`space-y-6 transition-all duration-500 ${brandingData.offerPopup.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Hook Title</label>
                             <input className="w-full p-4 bg-white rounded-xl text-xs font-bold border border-slate-100 focus:ring-2 focus:ring-sky-500 outline-none" value={brandingData.offerPopup.title} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, title: e.target.value}})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Asset Image URL</label>
                             <input className="w-full p-4 bg-white rounded-xl text-xs font-bold border border-slate-100 focus:ring-2 focus:ring-sky-500 outline-none" value={brandingData.offerPopup.imageUrl} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, imageUrl: e.target.value}})} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Offer Narrative</label>
                          <textarea rows={2} className="w-full p-4 bg-white rounded-xl text-xs font-medium border border-slate-100 focus:ring-2 focus:ring-sky-500 outline-none" value={brandingData.offerPopup.description} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, description: e.target.value}})} />
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Button Text</label>
                             <input className="w-full p-4 bg-white rounded-xl text-xs font-bold border border-slate-100 focus:ring-2 focus:ring-sky-500 outline-none" value={brandingData.offerPopup.buttonText} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, buttonText: e.target.value}})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Navigation Target</label>
                             <input className="w-full p-4 bg-white rounded-xl text-xs font-bold border border-slate-100 focus:ring-2 focus:ring-sky-500 outline-none" value={brandingData.offerPopup.buttonLink} onChange={e => setBrandingData({...brandingData, offerPopup: {...brandingData.offerPopup, buttonLink: e.target.value}})} />
                          </div>
                       </div>
                    </div>
                 </div>

                 <button onClick={handleSaveBranding} disabled={isSyncing} className="w-full py-6 bg-sky-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4">
                    {isSyncing ? <i className="fa-solid fa-rotate animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                    Commit Full Branding Sync
                 </button>
              </div>
           </div>

           <div className="lg:col-span-4">
              <div className="bg-slate-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden sticky top-40">
                 <h3 className="text-xl sm:text-2xl font-bold font-serif mb-8 flex items-center gap-3">
                   <i className="fa-solid fa-eye text-sky-400"></i> Identity Preview
                 </h3>
                 <div className="p-8 bg-white rounded-[2rem] text-slate-900 shadow-2xl space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                       <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                          {brandingData.siteLogo ? <img src={brandingData.siteLogo} className="w-full h-full object-contain" /> : <i className="fa-solid fa-mountain text-sky-500"></i>}
                       </div>
                       <div className="flex-grow">
                          <div className="w-20 h-2 bg-slate-200 rounded-full mb-1" style={{background: brandingData.primaryColor, opacity: 0.2}}></div>
                          <div className="w-12 h-1 bg-slate-100 rounded-full"></div>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <div className="w-full h-3 rounded-full bg-slate-100 mb-4 overflow-hidden relative">
                          <div className="absolute inset-0 transition-colors duration-500" style={{background: brandingData.primaryColor}}></div>
                       </div>
                       <div className="space-y-2">
                          <div className="w-full h-2 rounded-full bg-slate-100 opacity-50"></div>
                          <div className="w-2/3 h-2 rounded-full bg-slate-100 opacity-30"></div>
                          <div className="w-full h-10 rounded-xl mt-4 text-white flex items-center justify-center text-[8px] font-black uppercase tracking-widest transition-colors duration-500 shadow-lg" style={{background: brandingData.primaryColor}}>
                             Dynamic Button
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="mt-8 space-y-4">
                   <div className="flex items-start gap-3">
                     <i className="fa-solid fa-circle-check text-emerald-500 text-[10px] mt-0.5"></i>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Changes synchronize instantly to all active guest sessions.</p>
                   </div>
                   <div className="flex items-start gap-3">
                     <i className="fa-solid fa-circle-check text-emerald-500 text-[10px] mt-0.5"></i>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Logo updates reflect in Navbar, Footer, and PWA manifest.</p>
                   </div>
                 </div>
              </div>

              {/* System Integrity (Moved to Brand Tab sidebar for easier access) */}
              <div className="mt-8 p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-slate-900 text-sm">System Health</h4>
                  <button onClick={handleRunDiagnostics} className="text-sky-600 hover:text-sky-700 transition-all">
                    <i className={`fa-solid fa-rotate ${isRunningDiagnostics ? 'animate-spin' : ''}`}></i>
                  </button>
                </div>
                <div className="space-y-3">
                  {diagnostics.slice(0, 3).map(test => (
                    <div key={test.id} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">{test.name}</span>
                      <span className={`font-black ${test.status === 'healthy' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {test.status === 'healthy' ? 'STABLE' : 'ERROR'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      )}

      {/* MODALS */}
      {(villaToDelete || leadToDelete || serviceToDelete || testimonialToDelete) && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade">
           <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-popup">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                 <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold font-serif text-slate-900 mb-2">Are you sure?</h2>
              <p className="text-sm text-slate-500 mb-8">This action is permanent and cannot be undone from the cloud.</p>
              <div className="flex gap-4">
                 <button 
                   onClick={() => {
                     if (villaToDelete) handleConfirmDeleteVilla();
                     if (leadToDelete) handleConfirmDeleteLead();
                     if (serviceToDelete) handleConfirmDeleteService();
                     if (testimonialToDelete) handleConfirmDeleteReview();
                   }}
                   className="flex-grow py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95"
                 >
                   Confirm Delete
                 </button>
                 <button 
                   onClick={() => { setVillaToDelete(null); setLeadToDelete(null); setServiceToDelete(null); setTestimonialToDelete(null); }}
                   className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                 >
                   Back
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
