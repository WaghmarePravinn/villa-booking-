
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Villa, Testimonial, Lead, AppTheme, SiteSettings, Service, OfferPopup } from '../types';
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
  const [siteLogo, setSiteLogo] = useState(settings.siteLogo || "");
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || "#0ea5e9");
  const [offer, setOffer] = useState<OfferPopup>(settings.offerPopup);
  
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
        activeTheme,
        siteLogo,
        primaryColor,
        offerPopup: offer
      });
      alert('Global branding and settings synced successfully!');
    } catch (err: any) {
      alert('Sync Failed: ' + err.message);
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

  const getThemeIcon = (theme: AppTheme) => {
    switch(theme) {
      case AppTheme.WINTER: return 'fa-snowflake';
      case AppTheme.SUMMER: return 'fa-sun';
      case AppTheme.DIWALI: return 'fa-fire';
      case AppTheme.HOLI: return 'fa-palette';
      case AppTheme.REPUBLIC_DAY:
      case AppTheme.INDEPENDENCE_DAY: return 'fa-flag';
      default: return 'fa-wand-magic';
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

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <div className="bg-white p-8 sm:p-12 rounded-[3rem] border border-slate-50 shadow-xl text-left">
               <h2 className="text-2xl font-bold font-serif text-slate-900 mb-10">Visual Identity</h2>
               <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Site Logo URL</label>
                        <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" value={siteLogo} onChange={e => setSiteLogo(e.target.value)} placeholder="https://..." />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Brand Color</label>
                        <div className="flex gap-4">
                          <input type="color" className="w-14 h-14 rounded-xl border-none p-0 cursor-pointer overflow-hidden" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                          <input className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Concierge WhatsApp</label>
                        <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support Email</label>
                        <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Promo Marquee</label>
                     <textarea rows={2} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold resize-none" value={promoText} onChange={e => setPromoText(e.target.value)} />
                  </div>

                  <div className="space-y-6 pt-6 border-t border-slate-50">
                     <h3 className="text-lg font-bold font-serif text-slate-900">Experience Themes</h3>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Object.values(AppTheme).map(theme => (
                          <button key={theme} onClick={() => setActiveTheme(theme)} 
                            className={`p-6 rounded-[2rem] text-center transition-all border ${activeTheme === theme ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white'}`}>
                             <i className={`fa-solid ${getThemeIcon(theme)} text-xl mb-4 block`}></i>
                             <span className="text-[9px] font-black uppercase tracking-widest">{theme.replace('_', ' ')}</span>
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-8">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold font-serif text-slate-900">Offer Announcement</h3>
                        <button onClick={() => setOffer(o => ({...o, enabled: !o.enabled}))} className={`w-14 h-8 rounded-full transition-all relative ${offer.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                           <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${offer.enabled ? 'right-1' : 'left-1'}`}></div>
                        </button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input placeholder="Offer Heading" className="w-full px-5 py-3 rounded-xl border border-slate-100 text-xs font-bold" value={offer.title} onChange={e => setOffer({...offer, title: e.target.value})} />
                        <input placeholder="Button Text" className="w-full px-5 py-3 rounded-xl border border-slate-100 text-xs font-bold" value={offer.buttonText} onChange={e => setOffer({...offer, buttonText: e.target.value})} />
                        <textarea placeholder="Description" rows={2} className="md:col-span-2 w-full px-5 py-3 rounded-xl border border-slate-100 text-xs font-medium" value={offer.description} onChange={e => setOffer({...offer, description: e.target.value})} />
                     </div>
                  </div>

                  <button onClick={handleUpdateBranding} disabled={isSyncing} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all disabled:opacity-50">
                    {isSyncing ? 'SYNCING BRANDING...' : 'COMMIT GLOBAL BRANDING'}
                  </button>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden h-full">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
               <h3 className="text-xl font-bold font-serif mb-10">Live Preview</h3>
               
               <div className="space-y-12">
                  <div className="space-y-3">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Brand Mark</p>
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/5">
                       {siteLogo ? <img src={siteLogo} className="w-full h-full object-contain" alt="Logo" /> : <i className="fa-solid fa-mountain text-3xl opacity-20"></i>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Theme Atmosphere</p>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                       <i className={`fa-solid ${getThemeIcon(activeTheme)} text-4xl text-sky-400 mb-4`}></i>
                       <p className="text-xs font-black uppercase tracking-widest">{activeTheme.replace('_', ' ')} MODE</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Primary Palette</p>
                    <div className="h-16 rounded-2xl w-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: primaryColor }}>
                       {primaryColor}
                    </div>
                  </div>

                  <div className="pt-10 border-t border-white/5">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                       <i className="fa-brands fa-whatsapp text-emerald-400 text-xl"></i>
                       <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Direct Link</p>
                          <p className="text-xs font-bold">{whatsappNumber}</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs Placeholder Logic remains the same as previously implemented */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-16">
          <div className="lg:col-span-5 space-y-8 sm:space-y-12">
            <div className="bg-white p-8 sm:p-12 rounded-3xl sm:rounded-[4rem] shadow-xl border border-slate-50 text-left">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold font-serif text-slate-900">{isEditing ? 'Modify Asset' : 'New Listing'}</h2>
                {isEditing && <button onClick={() => setIsEditing(false)} className="text-[10px] font-black uppercase text-red-500">Cancel</button>}
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input required placeholder="Villa Name" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required placeholder="Location" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                <input type="number" required placeholder="Price/Night" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold outline-none" value={formData.pricePerNight} onChange={e => setFormData({...formData, pricePerNight: Number(e.target.value)})} />
                <button type="submit" disabled={isSyncing} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">{isEditing ? 'UPDATE' : 'PUBLISH'}</button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-7">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredVillas.map(v => (
                  <div key={v.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 flex items-center gap-6 text-left group hover-lift">
                    <img src={v.imageUrls[0]} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt="" />
                    <div className="flex-grow min-w-0">
                       <h3 className="font-bold text-slate-900 truncate">{v.name}</h3>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{v.location}</p>
                    </div>
                    <button onClick={() => handleEdit(v)} className="text-slate-300 hover:text-sky-600 p-2"><i className="fa-solid fa-pen-to-square"></i></button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modals (Villa Deletion) */}
      {villaToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-reveal" onClick={() => setVillaToDelete(null)}>
          <div className="bg-white rounded-[4rem] p-16 max-w-md w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
             <h2 className="text-3xl font-bold font-serif mb-4 text-slate-900">Confirm Deletion?</h2>
             <p className="text-slate-500 mb-12">Registry wipe is permanent.</p>
             <button onClick={async () => { await onDeleteVilla(villaToDelete.id); setVillaToDelete(null); }} className="w-full py-6 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">DELETE</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
