
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Villa, Testimonial, Lead, AppTheme, SiteSettings, Service } from '../types';
import { generateVillaFromPrompt, generateVillaDescription } from '../services/geminiService';
import { uploadMedia, verifyCloudConnectivity } from '../services/villaService';
import { updateSettings } from '../services/settingsService';
import { subscribeToLeads, updateLeadStatus, deleteLead } from '../services/leadService';
import { subscribeToTestimonials, deleteTestimonial, addTestimonial } from '../services/testimonialService';
import { subscribeToServices, createService, updateService, deleteService } from '../services/serviceService';

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
  subMessage?: string;
  error?: string | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ villas, settings, onAddVilla, onUpdateVilla, onDeleteVilla }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncingBroadcast, setIsSyncingBroadcast] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isDescLoading, setIsDescLoading] = useState(false);
  
  const [promoText, setPromoText] = useState(settings.promoText);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone);
  const [activeTheme, setActiveTheme] = useState(settings.activeTheme);
  
  const [villaToDelete, setVillaToDelete] = useState<Villa | null>(null);
  const [cloudStatus, setCloudStatus] = useState<{db: boolean, storage: boolean, loading: boolean}>({
    db: false, storage: false, loading: false
  });

  const [progress, setProgress] = useState<ProgressState>({
    active: false,
    message: '',
    percentage: 0,
    subMessage: '',
    error: null
  });
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);
  const replaceTypeRef = useRef<'image' | 'video'>('image');
  
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

  const checkCloud = async () => {
    setCloudStatus(prev => ({ ...prev, loading: true }));
    const result = await verifyCloudConnectivity();
    setCloudStatus({ db: !!result.db, storage: !!result.storage, loading: false });
  };

  const [formData, setFormData] = useState<Partial<Villa>>({
    name: '', location: '', pricePerNight: 0, bedrooms: 2, bathrooms: 2, capacity: 4, numRooms: 2,
    description: '', longDescription: '', imageUrls: [], videoUrls: [],
    amenities: ['Wi-Fi', 'AC', 'Private Pool'], includedServices: ['Housekeeping'], isFeatured: false,
    rating: 5, ratingCount: 1, mealsAvailable: true, petFriendly: true,
    refundPolicy: 'Full refund if cancelled 48 hours before check-in.'
  });

  const filteredVillas = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return villas;
    return villas.filter(v => v.name.toLowerCase().includes(q) || v.location.toLowerCase().includes(q));
  }, [villas, searchTerm]);

  const handleMagicFill = async () => {
    if (!magicPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const parsedData = await generateVillaFromPrompt(magicPrompt);
      if (parsedData) {
        setFormData(prev => ({
          ...prev,
          ...parsedData,
          numRooms: parsedData.bedrooms || prev.bedrooms,
          capacity: parsedData.capacity || (parsedData.bedrooms ? parsedData.bedrooms * 2 : prev.capacity),
          bathrooms: parsedData.bathrooms || prev.bathrooms || 1
        }));
        setMagicPrompt('');
      }
    } catch (err) {
      console.error("AI Fill failed", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAutoGenerateDesc = async () => {
    if (!formData.name || !formData.location) return;
    setIsDescLoading(true);
    try {
      const { short, long } = await generateVillaDescription(
        formData.name || "", 
        formData.location || "", 
        [...(formData.amenities || []), `BHK: ${formData.bedrooms}`]
      );
      setFormData(prev => ({ ...prev, description: short, longDescription: long }));
    } catch (err) {
      console.error("Desc generation failed", err);
    } finally {
      setIsDescLoading(false);
    }
  };

  const handleEdit = (villa: Villa) => {
    // Deep copy arrays to avoid reference sharing
    setFormData({ 
      ...villa,
      imageUrls: Array.isArray(villa.imageUrls) ? [...villa.imageUrls] : [],
      videoUrls: Array.isArray(villa.videoUrls) ? [...villa.videoUrls] : [],
      amenities: Array.isArray(villa.amenities) ? [...villa.amenities] : [],
      includedServices: Array.isArray(villa.includedServices) ? [...villa.includedServices] : []
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', location: '', pricePerNight: 0, bedrooms: 2, bathrooms: 2, capacity: 4, numRooms: 2,
      description: '', longDescription: '', imageUrls: [], videoUrls: [],
      amenities: ['Wi-Fi', 'AC', 'Private Pool'], includedServices: ['Housekeeping'], isFeatured: false,
      rating: 5, ratingCount: 1, mealsAvailable: true, petFriendly: true,
      refundPolicy: 'Full refund if cancelled 48 hours before check-in.'
    });
    setIsEditing(false);
    setIsUploading(false);
    replaceIndexRef.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || isUploading) return;
    
    setIsSyncing(true);
    setProgress({ active: true, message: 'Syncing Changes...', percentage: 50, error: null });
    
    try {
      if (isEditing) {
        await onUpdateVilla(formData as Villa);
      } else {
        await onAddVilla(formData as Villa);
      }
      setProgress({ active: true, message: 'Success', percentage: 100, error: null });
      setTimeout(() => setProgress(prev => ({ ...prev, active: false })), 1500);
      resetForm();
    } catch (err: any) {
      setProgress({ active: true, message: 'Error', percentage: 0, error: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMediaPicker = (type: 'image' | 'video', index?: number) => {
    replaceTypeRef.current = type;
    replaceIndexRef.current = index !== undefined ? index : null;
    if (type === 'image') imageInputRef.current?.click();
    else videoInputRef.current?.click();
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const isReplacing = replaceIndexRef.current !== null;
    const key = type === 'image' ? ('imageUrls' as const) : ('videoUrls' as const);
    
    setIsUploading(true);
    const totalFiles = files.length;
    
    setProgress({ 
      active: true, 
      message: isReplacing ? 'Replacing asset...' : `Uploading ${totalFiles} assets...`, 
      percentage: 0, 
      error: null 
    });

    try {
      if (isReplacing) {
        const url = await uploadMedia(files[0], type === 'image' ? 'images' : 'videos', (p) => setProgress(prev => ({ ...prev, percentage: p })));
        setFormData(prev => {
          const arr = [...(prev[key] || [])];
          arr[replaceIndexRef.current!] = url;
          return { ...prev, [key]: arr };
        });
      } else {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < totalFiles; i++) {
          setProgress(prev => ({ 
            ...prev, 
            percentage: (i / totalFiles) * 100, 
            message: `Uploading ${type} ${i + 1}/${totalFiles}...` 
          }));
          const url = await uploadMedia(files[i], type === 'image' ? 'images' : 'videos', (p) => {
             // Sub-progress per file (simulated 100 on upload completion)
          });
          uploadedUrls.push(url);
          
          // Incremental update for UI feedback
          setFormData(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), url]
          }));
        }
      }
      
      setProgress({ active: true, message: 'Media Synced', percentage: 100, error: null });
      setTimeout(() => setProgress(prev => ({ ...prev, active: false })), 1000);
    } catch (err: any) {
      setProgress({ active: true, message: 'Upload Failed', percentage: 0, error: err.message });
    } finally {
      setIsUploading(false);
      replaceIndexRef.current = null;
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleUpdateBranding = async () => {
    setIsSyncingBroadcast(true);
    try {
      await updateSettings({ 
        promoText, 
        whatsappNumber, 
        contactEmail, 
        contactPhone, 
        activeTheme 
      });
      alert('Global settings synced successfully!');
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setIsSyncingBroadcast(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade">
      {/* Sync Manager Bar */}
      {progress.active && (
        <div className="fixed top-32 right-12 z-[500] animate-popup">
          <div className={`bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-2xl w-80 ${progress.error ? 'border-red-100' : ''}`}>
             <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${progress.error ? 'bg-red-500' : 'bg-slate-900 animate-spin'}`}>
                  <i className={`fa-solid ${progress.error ? 'fa-triangle-exclamation' : 'fa-cloud-arrow-up'}`}></i>
                </div>
                <div>
                   <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Sync Manager</h4>
                   <p className="text-sm font-bold text-slate-900 truncate">{progress.message}</p>
                </div>
             </div>
             {!progress.error && (
               <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden mb-2">
                 <div className="h-full bg-slate-900 transition-all duration-300" style={{ width: `${progress.percentage}%` }}></div>
               </div>
             )}
             {progress.error && <p className="text-[10px] font-bold text-red-500 mt-4 leading-relaxed whitespace-pre-wrap">{progress.error}</p>}
          </div>
        </div>
      )}

      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
        <div>
          <h1 className="text-4xl font-bold font-serif text-slate-900">Admin Control</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${cloudStatus.db ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Database: {cloudStatus.db ? 'Live' : 'Check Schema'}
            </span>
          </div>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto max-w-full">
          {(['inventory', 'inquiries', 'services', 'reviews', 'branding'] as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Side */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold font-serif text-slate-900">
                  {isEditing ? 'Modify Property' : 'New Listing'}
                </h2>
                {isEditing && (
                  <button onClick={resetForm} className="text-[10px] font-black uppercase text-red-500">Cancel</button>
                )}
              </div>
              
              {!isEditing && (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">AI Fast Draft</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. 5BHK Lonavala Estate..." 
                      className="flex-grow px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900"
                      value={magicPrompt}
                      onChange={(e) => setMagicPrompt(e.target.value)}
                    />
                    <button 
                      onClick={handleMagicFill}
                      disabled={isAiLoading}
                      className="px-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-50"
                    >
                      {isAiLoading ? '...' : 'Fill'}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <input required placeholder="Villa Name" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <input required placeholder="Location" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  <input type="number" required placeholder="Price/Night" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" value={formData.pricePerNight} onChange={e => setFormData({...formData, pricePerNight: Number(e.target.value)})} />
                </div>

                <div className="flex items-center justify-between py-4 border-y border-slate-50">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="featured" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900" />
                    <label htmlFor="featured" className="text-[10px] font-black uppercase text-slate-600">Featured</label>
                  </div>
                  <button type="button" onClick={handleAutoGenerateDesc} disabled={isDescLoading} className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-2 hover:underline">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    {isDescLoading ? 'Writing...' : 'AI Describe'}
                  </button>
                </div>

                <textarea rows={2} placeholder="Teaser Text" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <textarea rows={4} placeholder="Full Architecture Narrative" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none resize-none" value={formData.longDescription} onChange={e => setFormData({...formData, longDescription: e.target.value})} />

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Media Hub</label>
                    <div className="flex gap-2">
                       <button type="button" onClick={() => handleMediaPicker('image')} className="text-[9px] font-black uppercase text-sky-600 px-3 py-1.5 rounded-lg bg-sky-50">+ Photo</button>
                       <button type="button" onClick={() => handleMediaPicker('video')} className="text-[9px] font-black uppercase text-amber-600 px-3 py-1.5 rounded-lg bg-amber-50">+ Video</button>
                       <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleMediaUpload(e, 'image')} />
                       <input ref={videoInputRef} type="file" multiple accept="video/*" className="hidden" onChange={e => handleMediaUpload(e, 'video')} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {formData.imageUrls?.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-50 shadow-inner">
                         <img src={url} className="w-full h-full object-cover" alt="" onError={(e) => (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=200'} />
                         <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                            <button type="button" onClick={() => handleMediaPicker('image', i)} className="text-white hover:text-sky-400"><i className="fa-solid fa-arrows-rotate text-xs"></i></button>
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls?.filter((_, idx) => idx !== i) }))} className="text-white hover:text-red-400"><i className="fa-solid fa-trash text-xs"></i></button>
                         </div>
                      </div>
                    ))}
                  </div>

                  {formData.videoUrls && formData.videoUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                       {formData.videoUrls.map((url, i) => (
                         <div key={i} className="relative aspect-video rounded-xl overflow-hidden group border border-slate-50 bg-slate-900">
                            <video src={url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all">
                                <button type="button" onClick={() => handleMediaPicker('video', i)} className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"><i className="fa-solid fa-arrows-rotate text-xs"></i></button>
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, videoUrls: prev.videoUrls?.filter((_, idx) => idx !== i) }))} className="w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500"><i className="fa-solid fa-trash-can text-xs"></i></button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSyncing || isUploading} className="w-full py-6 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                  {isSyncing ? 'Synchronizing...' : (isUploading ? 'Waiting for Media...' : (isEditing ? 'Commit Changes' : 'Sync New Property'))}
                </button>
              </form>
            </div>
          </div>

          {/* List Side */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
                 <h2 className="text-2xl font-bold font-serif text-slate-900">Villa Registry</h2>
                 <input type="text" placeholder="Search by name/city..." className="w-full md:w-64 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-slate-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {filteredVillas.map(v => (
                   <div key={v.id} className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 flex gap-6 group hover:bg-white hover:shadow-xl transition-all">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                        <img 
                          src={(v.imageUrls && Array.isArray(v.imageUrls) && v.imageUrls.length > 0) ? v.imageUrls[0] : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400'} 
                          className="w-full h-full object-cover" 
                          alt="" 
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400'; }}
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                         <h3 className="font-bold text-slate-900 truncate">{v.name}</h3>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{v.location}</p>
                         <div className="flex gap-2 mt-4">
                            <button onClick={() => handleEdit(v)} className="flex-grow py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest">Modify</button>
                            <button onClick={() => setVillaToDelete(v)} className="px-3 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm animate-reveal">
          <h2 className="text-3xl font-bold font-serif text-slate-900 mb-12">Global Leads Registry</h2>
          <div className="space-y-4">
            {leads.length > 0 ? leads.map(lead => (
              <div key={lead.id} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6 flex-grow">
                   <div className={`w-3 h-3 rounded-full ${lead.status === 'new' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                   <div>
                     <h3 className="text-xl font-bold text-slate-900">{lead.villaName}</h3>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                       Guest: {lead.customerName || 'Direct'} • {lead.source} • {new Date(lead.timestamp).toLocaleDateString()}
                     </p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)}
                    className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="booked">Booked</option>
                    <option value="lost">Lost</option>
                  </select>
                  <button onClick={() => deleteLead(lead.id)} className="w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                </div>
              </div>
            )) : <p className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-xs">No entries found</p>}
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm animate-reveal max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold font-serif text-slate-900 mb-12 text-center">Global Identity Hub</h2>
          <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.values(AppTheme).map(theme => (
                <button 
                  key={theme}
                  onClick={() => setActiveTheme(theme)}
                  className={`p-6 rounded-[2rem] border-2 transition-all text-center flex flex-col items-center gap-3 ${activeTheme === theme ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">{theme.replace('_', ' ')}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <textarea value={promoText} onChange={e => setPromoText(e.target.value)} rows={3} placeholder="Campaign Text" className="w-full px-6 py-5 bg-slate-50 rounded-3xl border border-slate-100 text-sm font-bold resize-none" />
               <div className="space-y-3">
                  <input value={whatsappNumber} onChange={setWhatsappNumber} placeholder="WhatsApp" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold" />
                  <input value={contactEmail} onChange={setContactEmail} placeholder="Email" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold" />
                  <input value={contactPhone} onChange={setContactPhone} placeholder="Hotline" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold" />
               </div>
            </div>

            <button onClick={handleUpdateBranding} disabled={isSyncingBroadcast} className="w-full py-6 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:opacity-50">
              {isSyncingBroadcast ? 'Syncing...' : 'Broadcast Global Identity'}
            </button>
          </div>
        </div>
      )}

      {villaToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-md w-full shadow-2xl text-center animate-popup">
             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-3xl mx-auto mb-8"><i className="fa-solid fa-triangle-exclamation"></i></div>
             <h2 className="text-2xl font-bold font-serif mb-10 text-slate-900">Confirm Deletion?</h2>
             <div className="flex flex-col gap-4">
                <button onClick={async () => { await onDeleteVilla(villaToDelete.id); setVillaToDelete(null); }} className="w-full py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Yes, Delete</button>
                <button onClick={() => setVillaToDelete(null)} className="w-full py-5 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
