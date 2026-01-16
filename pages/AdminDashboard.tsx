
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Villa, Testimonial, Lead, AppTheme, SiteSettings, Service } from '../types';
import { generateVillaFromPrompt, generateVillaDescription } from '../services/geminiService';
import { uploadMedia, verifyCloudConnectivity } from '../services/villaService';
import { updateSettings } from '../services/settingsService';
import { subscribeToLeads, updateLeadStatus, deleteLead } from '../services/leadService';
import { subscribeToTestimonials, deleteTestimonial } from '../services/testimonialService';
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

interface ProgressState { active: boolean; message: string; percentage: number; error?: string | null; }

const AdminDashboard: React.FC<AdminDashboardProps> = ({ villas, settings, onAddVilla, onUpdateVilla, onDeleteVilla }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isDescLoading, setIsDescLoading] = useState(false);
  
  // Site Settings State
  const [promoText, setPromoText] = useState(settings.promoText);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone);
  const [activeTheme, setActiveTheme] = useState(settings.activeTheme);
  
  // Entity Deletion/Management State
  const [villaToDelete, setVillaToDelete] = useState<Villa | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);
  
  const [cloudStatus, setCloudStatus] = useState<{db: boolean, storage: boolean, loading: boolean}>({ db: false, storage: false, loading: false });
  const [progress, setProgress] = useState<ProgressState>({ active: false, message: '', percentage: 0, error: null });
  
  // Lists
  const [leads, setLeads] = useState<Lead[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Service Edit State
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const unsubLeads = subscribeToLeads(setLeads);
    const unsubTestimonials = subscribeToTestimonials(setTestimonials);
    const unsubServices = subscribeToServices(setServices);
    checkCloud();
    return () => { unsubLeads(); unsubTestimonials(); unsubServices(); };
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
        setFormData(prev => ({ ...prev, ...parsedData, numRooms: parsedData.bedrooms || prev.bedrooms, capacity: parsedData.capacity || (parsedData.bedrooms ? parsedData.bedrooms * 2 : prev.capacity) }));
        setMagicPrompt('');
      }
    } catch (err) { console.error("AI Fill failed", err); }
    finally { setIsAiLoading(false); }
  };

  const handleAutoGenerateDesc = async () => {
    if (!formData.name || !formData.location) return;
    setIsDescLoading(true);
    try {
      const { short, long } = await generateVillaDescription(formData.name || "", formData.location || "", [...(formData.amenities || []), `BHK: ${formData.bedrooms}`]);
      setFormData(prev => ({ ...prev, description: short, longDescription: long }));
    } catch (err) { console.error("Desc generation failed", err); }
    finally { setIsDescLoading(false); }
  };

  const handleEdit = (villa: Villa) => {
    setFormData({ ...villa, imageUrls: [...villa.imageUrls], videoUrls: [...villa.videoUrls], amenities: [...villa.amenities], includedServices: [...villa.includedServices] });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || isUploading) return;
    setIsSyncing(true);
    setProgress({ active: true, message: 'Syncing Changes...', percentage: 50, error: null });
    try {
      if (isEditing) await onUpdateVilla(formData as Villa);
      else await onAddVilla(formData as Villa);
      setProgress({ active: true, message: 'Registry Updated', percentage: 100, error: null });
      setTimeout(() => setProgress(prev => ({ ...prev, active: false })), 1500);
      setIsEditing(false);
      setFormData({ name: '', location: '', pricePerNight: 0, bedrooms: 2, capacity: 4, description: '', imageUrls: [], videoUrls: [], amenities: ['Wi-Fi', 'AC'], includedServices: ['Daily Housekeeping'], isFeatured: false });
    } catch (err: any) { setProgress({ active: true, message: 'Sync Error', percentage: 0, error: err.message }); }
    finally { setIsSyncing(false); }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const totalFiles = files.length;
    setProgress({ active: true, message: `Uploading ${totalFiles} assets...`, percentage: 0, error: null });
    try {
      for (let i = 0; i < totalFiles; i++) {
        const url = await uploadMedia(files[i], type === 'image' ? 'images' : 'videos');
        setFormData(prev => ({ ...prev, [type === 'image' ? 'imageUrls' : 'videoUrls']: [...(prev[type === 'image' ? 'imageUrls' : 'videoUrls'] || []), url] }));
        setProgress(p => ({ ...p, percentage: ((i + 1) / totalFiles) * 100 }));
      }
      setProgress({ active: true, message: 'Media Broadcast Complete', percentage: 100, error: null });
      setTimeout(() => setProgress(prev => ({ ...prev, active: false })), 1000);
    } catch (err: any) { setProgress({ active: true, message: 'Upload Failed', percentage: 0, error: err.message }); }
    finally { setIsUploading(false); if (imageInputRef.current) imageInputRef.current.value = ''; if (videoInputRef.current) videoInputRef.current.value = ''; }
  };

  const handleUpdateBranding = async () => {
    setIsSyncing(true);
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
      setIsSyncing(false);
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: Lead['status']) => {
    try {
      await updateLeadStatus(id, status);
    } catch (err) {
      console.error("Lead status update failed", err);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.title) return;
    try {
      if (editingService.id) {
        await updateService(editingService.id, editingService);
      } else {
        await createService(editingService as Omit<Service, 'id'>);
      }
      setEditingService(null);
    } catch (err) {
      console.error("Service sync failed", err);
    }
  };

  const getStatusBadgeClass = (status: Lead['status']) => {
    switch(status) {
      case 'booked': return 'bg-emerald-100 text-emerald-700';
      case 'contacted': return 'bg-sky-100 text-sky-700';
      case 'lost': return 'bg-red-50 text-red-700';
      default: return 'bg-amber-50 text-amber-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-reveal bg-[#fcfdfe] min-h-screen">
      {/* Dynamic Sync Manager Bar */}
      {progress.active && (
        <div className="fixed bottom-24 sm:bottom-10 right-4 sm:right-10 z-[500] animate-reveal">
          <div className={`bg-white border border-slate-100 p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] shadow-2xl w-72 sm:w-80 ${progress.error ? 'border-red-100' : ''}`}>
             <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white ${progress.error ? 'bg-red-500' : 'bg-slate-900 animate-spin'}`}>
                  <i className={`fa-solid ${progress.error ? 'fa-triangle-exclamation' : 'fa-cloud-arrow-up'} text-xs sm:text-base`}></i>
                </div>
                <div className="text-left">
                   <h4 className="font-black text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-400">Sync Pipeline</h4>
                   <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{progress.message}</p>
                </div>
             </div>
             {!progress.error && (
               <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden mb-2">
                 <div className="h-full bg-slate-900 transition-all duration-500" style={{ width: `${progress.percentage}%` }}></div>
               </div>
             )}
             {progress.error && <p className="text-[9px] font-bold text-red-500 leading-relaxed bg-red-50 p-3 rounded-xl">{progress.error}</p>}
          </div>
        </div>
      )}

      {/* Header Mission Control */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 sm:mb-16 gap-6 sm:gap-10">
        <div className="text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-bold font-serif text-slate-900 mb-2 tracking-tighter">Mission Control</h1>
          <div className="flex items-center justify-center md:justify-start gap-3 mt-2 sm:mt-4">
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${cloudStatus.db ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-slate-400">
              SUPABASE CLOUD: {cloudStatus.db ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
        </div>
        <div className="flex bg-white p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-50 overflow-x-auto max-w-full no-scrollbar">
          {(['inventory', 'inquiries', 'services', 'reviews', 'branding'] as AdminTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-16">
          <div className="lg:col-span-5 space-y-8 sm:space-y-12">
            <div className="bg-white p-8 sm:p-12 rounded-3xl sm:rounded-[4rem] shadow-xl border border-slate-50">
              <div className="flex justify-between items-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">{isEditing ? 'Modify Asset' : 'New Listing'}</h2>
                {isEditing && <button onClick={() => setIsEditing(false)} className="text-[9px] sm:text-[10px] font-black uppercase text-red-500">Cancel</button>}
              </div>
              
              {!isEditing && (
                <div className="mb-8 sm:mb-12 p-6 sm:p-8 bg-slate-50 rounded-2xl sm:rounded-[2.5rem] border border-slate-100">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 text-left">AI Fast Draft</label>
                  <div className="flex gap-2 sm:gap-3">
                    <input type="text" placeholder="e.g. 5BHK Lonavala..." className="flex-grow px-4 sm:px-6 py-3 sm:py-4 bg-white border border-slate-100 rounded-xl sm:rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900"
                      value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} />
                    <button onClick={handleMagicFill} disabled={isAiLoading} className="px-4 sm:px-6 bg-slate-900 text-white rounded-xl sm:rounded-2xl text-[9px] font-black uppercase disabled:opacity-50">Draft</button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 text-left">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="col-span-2">
                    <input required placeholder="Villa Name" className="w-full px-5 sm:px-6 py-4 sm:py-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <input required placeholder="Location" className="w-full px-5 sm:px-6 py-4 sm:py-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  <input type="number" required placeholder="Price/Night" className="w-full px-5 sm:px-6 py-4 sm:py-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" value={formData.pricePerNight} onChange={e => setFormData({...formData, pricePerNight: Number(e.target.value)})} />
                </div>

                <div className="flex items-center justify-between py-4 sm:py-6 border-y border-slate-50">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <input type="checkbox" id="featured" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="w-4 h-4 sm:w-5 sm:h-5 rounded text-slate-900 focus:ring-slate-900" />
                    <label htmlFor="featured" className="text-[9px] sm:text-[10px] font-black uppercase text-slate-600 tracking-widest">Featured</label>
                  </div>
                  <button type="button" onClick={handleAutoGenerateDesc} disabled={isDescLoading} className="text-[9px] sm:text-[10px] font-black text-sky-600 uppercase flex items-center gap-2 hover:underline">
                    <i className="fa-solid fa-wand-magic-sparkles"></i> {isDescLoading ? 'Drafting...' : 'AI Describe'}
                  </button>
                </div>

                <textarea rows={2} placeholder="Teaser Text" className="w-full px-5 sm:px-6 py-4 sm:py-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                
                <div className="space-y-6 sm:space-y-8">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Media Lab</label>
                    <div className="flex gap-2">
                       <button type="button" onClick={() => imageInputRef.current?.click()} className="text-[8px] font-black uppercase text-sky-600 px-3 py-1.5 rounded-lg bg-sky-50">+ Photo</button>
                       <button type="button" onClick={() => videoInputRef.current?.click()} className="text-[8px] font-black uppercase text-amber-600 px-3 py-1.5 rounded-lg bg-amber-50">+ Video</button>
                       <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleMediaUpload(e, 'image')} />
                       <input ref={videoInputRef} type="file" multiple accept="video/*" className="hidden" onChange={e => handleMediaUpload(e, 'video')} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-4">
                    {formData.imageUrls?.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl sm:rounded-[1.5rem] overflow-hidden group border border-slate-100 shadow-sm">
                         <img src={url} className="w-full h-full object-cover" alt="" />
                         <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <button type="button" onClick={() => setFormData(p => ({ ...p, imageUrls: p.imageUrls?.filter((_, idx) => idx !== i) }))} className="text-white hover:text-red-400"><i className="fa-solid fa-trash-can text-xs"></i></button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={isSyncing || isUploading} className="w-full py-5 sm:py-7 bg-slate-900 text-white rounded-2xl sm:rounded-[2.5rem] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] shadow-xl hover:bg-black transition-all disabled:opacity-50">
                  {isSyncing ? 'SYNCING...' : (isEditing ? 'COMMIT CHANGES' : 'PUBLISH LISTING')}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8 sm:space-y-12">
            <div className="bg-white p-6 sm:p-12 rounded-3xl sm:rounded-[4rem] border border-slate-50 shadow-sm">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 mb-10 sm:mb-16">
                 <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">Sanctuary Registry</h2>
                 <input type="text" placeholder="Filter property..." className="w-full md:w-80 px-5 sm:px-6 py-3 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-[1.5rem] text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                 {filteredVillas.map(v => (
                   <div key={v.id} className="bg-slate-50/50 p-6 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-slate-100 flex gap-4 sm:gap-8 group hover:bg-white transition-all duration-500 text-left">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-[1.5rem] overflow-hidden shrink-0 shadow-inner">
                        <img src={v.imageUrls[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400'} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-grow min-w-0">
                         <h3 className="font-bold text-slate-900 truncate text-base sm:text-lg mb-1">{v.name}</h3>
                         <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">{v.location}</p>
                         <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                            <button onClick={() => handleEdit(v)} className="flex-grow py-2.5 sm:py-3 bg-slate-900 text-white rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all">EDIT</button>
                            <button onClick={() => setVillaToDelete(v)} className="px-4 sm:px-5 py-2.5 sm:py-3 bg-red-50 text-red-500 rounded-lg sm:rounded-xl hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                         </div>
                      </div>
                   </div>
                 ))}
                 {filteredVillas.length === 0 && <p className="col-span-full py-20 text-slate-300 font-black uppercase tracking-widest text-[10px] text-center">No Assets Found</p>}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Inquiries Tab */}
      {activeTab === 'inquiries' && (
        <div className="space-y-12">
          <div className="bg-white p-6 sm:p-12 rounded-[3rem] sm:rounded-[4rem] shadow-sm border border-slate-50">
            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-10 text-left">Guest Inquiries</h2>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-2">Guest / Sanctuary</th>
                    <th className="px-6 py-2">Details</th>
                    <th className="px-6 py-2">Status</th>
                    <th className="px-6 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id} className="bg-slate-50/50 rounded-2xl group hover:bg-white hover:shadow-xl transition-all duration-500">
                      <td className="px-6 py-6 rounded-l-2xl">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{lead.customerName || 'Anonymous Guest'}</span>
                          <span className="text-[10px] text-sky-600 font-black uppercase tracking-widest mt-1">{lead.villaName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex flex-col text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           <span>{lead.checkIn || 'TBD'} to {lead.checkOut || 'TBD'}</span>
                           <span className="opacity-50 mt-1">Ref: {lead.id.slice(0,8)}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6">
                        <select 
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border-none cursor-pointer ${getStatusBadgeClass(lead.status)}`}
                          value={lead.status}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as Lead['status'])}
                        >
                          <option value="new">New Inquiry</option>
                          <option value="contacted">Contacted</option>
                          <option value="booked">Confirmed</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>
                      <td className="px-6 py-6 rounded-r-2xl">
                         <button onClick={() => setLeadToDelete(lead)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                            <i className="fa-solid fa-trash-can text-xs"></i>
                         </button>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No active inquiries</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm sticky top-36">
              <h2 className="text-2xl font-bold font-serif mb-8 text-slate-900 text-left">{editingService?.id ? 'Edit Service' : 'New Service'}</h2>
              <form onSubmit={handleSaveService} className="space-y-6 text-left">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Service Title</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900" 
                    value={editingService?.title || ''} onChange={e => setEditingService({...editingService, title: e.target.value})} placeholder="e.g. Private Chef" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">FontAwesome Icon</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900" 
                    value={editingService?.icon || ''} onChange={e => setEditingService({...editingService, icon: e.target.value})} placeholder="fa-utensils" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
                  <textarea rows={3} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 resize-none" 
                    value={editingService?.description || ''} onChange={e => setEditingService({...editingService, description: e.target.value})} placeholder="Describe the luxury service..." />
                </div>
                <div className="flex gap-3">
                   <button type="submit" className="flex-grow py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Save Service</button>
                   {editingService && <button type="button" onClick={() => setEditingService(null)} className="px-6 bg-slate-50 text-slate-400 rounded-2xl"><i className="fa-solid fa-xmark"></i></button>}
                </div>
              </form>
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {services.map(service => (
                 <div key={service.id} className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm flex flex-col items-center text-center group hover-lift">
                    <div className="w-16 h-16 bg-sky-50 rounded-[1.5rem] flex items-center justify-center text-sky-600 text-2xl mb-6 shadow-inner">
                       <i className={`fa-solid ${service.icon}`}></i>
                    </div>
                    <h3 className="text-xl font-bold font-serif text-slate-900 mb-3">{service.title}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 flex-grow">{service.description}</p>
                    <div className="flex gap-3 w-full border-t border-slate-50 pt-8">
                       <button onClick={() => { setEditingService(service); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="flex-grow py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Edit</button>
                       <button onClick={() => setServiceToDelete(service)} className="w-12 h-12 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div key={t.id} className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-sm flex flex-col group hover-lift animate-reveal" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.3em]">{t.category}</span>
                  <button onClick={() => setTestimonialToDelete(t)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <i className="fa-solid fa-xmark text-xs"></i>
                  </button>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium mb-10 text-lg italic text-left">"{t.content}"</p>
                <div className="flex items-center gap-4 mt-auto border-t border-slate-50 pt-8 text-left">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-50">
                    <img src={t.avatar} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{t.name}</h4>
                    <p className="text-[9px] text-sky-600 font-black uppercase tracking-widest mt-1">Verified Stay</p>
                  </div>
                </div>
              </div>
            ))}
            {testimonials.length === 0 && <p className="col-span-full py-40 text-center text-slate-300 font-black uppercase tracking-widest">No testimonials found</p>}
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 sm:p-16 rounded-[3rem] sm:rounded-[4rem] border border-slate-50 shadow-xl text-left">
             <h2 className="text-3xl font-bold font-serif text-slate-900 mb-12">Global Site Settings</h2>
             <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Concierge WhatsApp</label>
                      <input className="w-full px-6 py-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Email</label>
                      <input className="w-full px-6 py-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marquee Promo Text</label>
                   <textarea rows={2} className="w-full px-6 py-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500 resize-none" value={promoText} onChange={e => setPromoText(e.target.value)} />
                </div>

                <div className="space-y-6">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Active Aesthetic</label>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {Object.values(AppTheme).map(theme => (
                        <button key={theme} onClick={() => setActiveTheme(theme)} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTheme === theme ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-white'}`}>
                           {theme.replace('_', ' ')}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="pt-10 border-t border-slate-50">
                   <button onClick={handleUpdateBranding} disabled={isSyncing} className="w-full py-6 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                      {isSyncing ? 'SYNCING SETTINGS...' : 'COMMIT GLOBAL CHANGES'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {villaToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-reveal" onClick={() => setVillaToDelete(null)}>
          <div className="bg-white rounded-[4rem] p-16 max-w-md w-full shadow-2xl text-center animate-reveal" onClick={e => e.stopPropagation()}>
             <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-4xl mx-auto mb-10"><i className="fa-solid fa-triangle-exclamation"></i></div>
             <h2 className="text-3xl font-bold font-serif mb-4 text-slate-900">Decommission Asset?</h2>
             <p className="text-slate-500 text-base font-medium mb-12">Registry wipe is permanent. Confirm?</p>
             <div className="flex flex-col gap-4">
                <button onClick={async () => { await onDeleteVilla(villaToDelete.id); setVillaToDelete(null); }} className="w-full py-6 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">CONFIRM DELETION</button>
                <button onClick={() => setVillaToDelete(null)} className="w-full py-6 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">ABORT</button>
             </div>
          </div>
        </div>
      )}

      {leadToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-reveal" onClick={() => setLeadToDelete(null)}>
          <div className="bg-white rounded-[4rem] p-16 max-w-md w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-3xl mx-auto mb-10"><i className="fa-solid fa-envelope-circle-check"></i></div>
             <h2 className="text-2xl font-bold font-serif mb-4 text-slate-900">Purge Inquiry?</h2>
             <p className="text-slate-500 mb-12">Delete guest lead from history?</p>
             <div className="flex flex-col gap-3">
                <button onClick={async () => { await deleteLead(leadToDelete.id); setLeadToDelete(null); }} className="w-full py-5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">CONFIRM PURGE</button>
                <button onClick={() => setLeadToDelete(null)} className="w-full py-5 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">CANCEL</button>
             </div>
          </div>
        </div>
      )}

      {serviceToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-reveal" onClick={() => setServiceToDelete(null)}>
          <div className="bg-white rounded-[4rem] p-16 max-w-md w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-3xl mx-auto mb-10"><i className="fa-solid fa-concierge-bell"></i></div>
             <h2 className="text-2xl font-bold font-serif mb-4 text-slate-900">Remove Service?</h2>
             <p className="text-slate-500 mb-12">Guests will no longer see this offering.</p>
             <div className="flex flex-col gap-3">
                <button onClick={async () => { await deleteService(serviceToDelete.id); setServiceToDelete(null); }} className="w-full py-5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">DELETE SERVICE</button>
                <button onClick={() => setServiceToDelete(null)} className="w-full py-5 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">CANCEL</button>
             </div>
          </div>
        </div>
      )}

      {testimonialToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-reveal" onClick={() => setTestimonialToDelete(null)}>
          <div className="bg-white rounded-[4rem] p-16 max-w-md w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-3xl mx-auto mb-10"><i className="fa-solid fa-comment-slash"></i></div>
             <h2 className="text-2xl font-bold font-serif mb-4 text-slate-900">Moderate Review?</h2>
             <p className="text-slate-500 mb-12">Remove this story from the chronicles?</p>
             <div className="flex flex-col gap-3">
                <button onClick={async () => { await deleteTestimonial(testimonialToDelete.id); setTestimonialToDelete(null); }} className="w-full py-5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">REMOVE STORY</button>
                <button onClick={() => setTestimonialToDelete(null)} className="w-full py-5 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">CANCEL</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
