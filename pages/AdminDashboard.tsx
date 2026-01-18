
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Villa, Testimonial, Lead, AppTheme, SiteSettings, Service, OfferPopup } from '../types';
import { generateVillaFromPrompt, generateVillaDescription } from '../services/geminiService';
import { uploadMedia, verifyCloudConnectivity } from '../services/villaService';
import { updateSettings } from '../services/settingsService';
import { subscribeToLeads, updateLeadStatus, deleteLead } from '../services/leadService';
import { subscribeToTestimonials, deleteTestimonial, addTestimonial, updateTestimonial } from '../services/testimonialService';
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ villas, settings, onAddVilla, onUpdateVilla, onDeleteVilla, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
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
  
  // Service & Testimonial Edit State
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleEdit = (villa: Villa) => {
    setFormData({ ...villa, imageUrls: [...villa.imageUrls], videoUrls: [...villa.videoUrls], amenities: [...villa.amenities], includedServices: [...villa.includedServices] });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || isUploading) return;
    setIsSyncing(true);
    setProgress({ active: true, message: 'Initiating Cloud Sync...', percentage: 20, error: null });
    try {
      if (isEditing) {
        setProgress({ active: true, message: 'Updating Registry...', percentage: 60, error: null });
        await onUpdateVilla(formData as Villa);
      } else {
        setProgress({ active: true, message: 'Publishing New Listing...', percentage: 60, error: null });
        await onAddVilla(formData as Villa);
      }
      setProgress({ active: true, message: 'Sanctuary Registry Updated', percentage: 100, error: null });
      setTimeout(() => setProgress(prev => ({ ...prev, active: false })), 2000);
      setIsEditing(false);
      setFormData({ name: '', location: '', pricePerNight: 0, bedrooms: 2, capacity: 4, description: '', imageUrls: [], videoUrls: [], amenities: ['Wi-Fi', 'AC'], includedServices: ['Daily Housekeeping'], isFeatured: false });
    } catch (err: any) { 
      setProgress({ active: true, message: 'Sync Interrupted', percentage: 0, error: err.message }); 
    } finally { 
      setIsSyncing(false); 
    }
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
    finally { setIsUploading(false); if (imageInputRef.current) imageInputRef.current.value = ''; }
  };

  const handleUpdateBranding = async () => {
    setIsSyncing(true);
    setProgress({ active: true, message: 'Propagating Global Branding...', percentage: 50, error: null });
    try {
      await updateSettings({ 
        promoText, whatsappNumber, contactEmail, contactPhone, activeTheme,
        siteLogo, primaryColor, offerPopup: offer
      });
      setProgress({ active: true, message: 'Branding Synced', percentage: 100, error: null });
      setTimeout(() => setProgress(p => ({...p, active: false})), 1500);
    } catch (err: any) { setProgress({ active: true, message: 'Sync Failed', percentage: 0, error: err.message }); }
    finally { setIsSyncing(false); }
  };

  const handleUpdateLeadStatus = async (id: string, status: Lead['status']) => {
    setIsSyncing(true);
    setProgress({ active: true, message: `Updating Inquiry to ${status}...`, percentage: 50, error: null });
    try {
      await updateLeadStatus(id, status);
      setProgress({ active: true, message: 'Status Updated', percentage: 100, error: null });
      setTimeout(() => setProgress(p => ({...p, active: false})), 1000);
    } catch (err: any) { setProgress({ active: true, message: 'Update Failed', percentage: 0, error: err.message }); }
    finally { setIsSyncing(false); }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.title) return;
    setIsSyncing(true);
    setProgress({ active: true, message: 'Syncing Concierge Service...', percentage: 50, error: null });
    try {
      if (editingService.id) await updateService(editingService.id, editingService);
      else await createService(editingService as Omit<Service, 'id'>);
      setProgress({ active: true, message: 'Service Registry Updated', percentage: 100, error: null });
      setEditingService(null);
      setTimeout(() => setProgress(p => ({...p, active: false})), 1500);
    } catch (err) { setProgress({ active: true, message: 'Sync Failed', percentage: 0, error: 'Database error' }); }
    finally { setIsSyncing(false); }
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial?.name || !editingTestimonial?.content) return;
    setIsSyncing(true);
    setProgress({ active: true, message: 'Publishing Chronicle...', percentage: 50, error: null });
    try {
      if (editingTestimonial.id) await updateTestimonial(editingTestimonial.id, editingTestimonial);
      else await addTestimonial(editingTestimonial as Omit<Testimonial, 'id' | 'timestamp'>);
      setProgress({ active: true, message: 'Guest chronicle updated', percentage: 100, error: null });
      setEditingTestimonial(null);
      setTimeout(() => setProgress(p => ({...p, active: false})), 1500);
    } catch (err) { setProgress({ active: true, message: 'Sync Failed', percentage: 0, error: 'Database error' }); }
    finally { setIsSyncing(false); }
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
      
      {/* Global Sync Pipeline Status */}
      {progress.active && (
        <div className="fixed bottom-24 sm:bottom-10 right-4 sm:right-10 z-[500] animate-reveal">
          <div className={`bg-white border border-slate-100 p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] shadow-2xl w-72 sm:w-80 ${progress.error ? 'border-red-100' : 'border-sky-50'}`}>
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
                 <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${progress.percentage}%` }}></div>
               </div>
             )}
             {progress.error && <p className="text-[9px] font-bold text-red-500 leading-relaxed bg-red-50 p-3 rounded-xl">{progress.error}</p>}
          </div>
        </div>
      )}

      {/* Admin Control Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 sm:mb-16 gap-6 sm:gap-10">
        <div className="text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-bold font-serif text-slate-900 mb-2 tracking-tighter">Mission Control</h1>
          <div className="flex items-center justify-center md:justify-start gap-3 mt-2 sm:mt-4">
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${cloudStatus.db ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-slate-400">
              CLOUD STATUS: {cloudStatus.db ? 'SYNCHRONIZED' : 'INTERRUPTED'}
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

      {/* Tab Content Rendering */}
      
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-16">
          <div className="lg:col-span-5 space-y-8 sm:space-y-12">
            <div className="bg-white p-8 sm:p-12 rounded-3xl sm:rounded-[4rem] shadow-xl border border-slate-50 text-left sticky top-32">
              <h2 className="text-2xl font-bold font-serif text-slate-900 mb-8">{isEditing ? 'Modify Sanctuary' : 'New Listing'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input required placeholder="Name" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required placeholder="Location" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-bold" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Price" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-bold" value={formData.pricePerNight} onChange={e => setFormData({...formData, pricePerNight: Number(e.target.value)})} />
                  <input type="number" placeholder="Guests" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-bold" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
                </div>
                <button type="submit" disabled={isSyncing} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                  {isSyncing ? 'SYNCING...' : 'COMMIT CHANGES'}
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredVillas.map(v => (
              <div key={v.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 flex items-center gap-5 text-left group hover-lift shadow-sm hover:shadow-xl transition-all">
                <img src={v.imageUrls[0]} className="w-16 h-16 rounded-2xl object-cover" />
                <div className="flex-grow min-w-0">
                   <h3 className="font-bold text-slate-900 truncate text-sm">{v.name}</h3>
                   <div className="flex gap-2 mt-2">
                      <button onClick={() => handleEdit(v)} className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center hover:bg-sky-600 hover:text-white transition-all"><i className="fa-solid fa-pen text-[10px]"></i></button>
                      <button onClick={() => setVillaToDelete(v)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><i className="fa-solid fa-trash text-[10px]"></i></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div className="space-y-6 animate-fade">
          <div className="flex justify-between items-center mb-10">
             <h2 className="text-3xl font-bold font-serif text-slate-900">Guest Inquiries</h2>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{leads.length} Active Leads</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {leads.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(lead => (
              <div key={lead.id} className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 group hover:shadow-xl transition-all text-left">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-serif">
                    {lead.customerName?.charAt(0) || 'G'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-slate-900">{lead.customerName || 'Anonymous Guest'}</h3>
                    <p className="text-[9px] font-black uppercase text-sky-600 tracking-widest mt-1">Property: {lead.villaName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                   <div className="text-left">
                      <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Inquiry Date</p>
                      <p className="text-xs font-bold text-slate-600">{new Date(lead.timestamp).toLocaleDateString()}</p>
                   </div>
                   <div className="text-left">
                      <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Source</p>
                      <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">{lead.source}</span>
                   </div>
                   <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                      {(['new', 'contacted', 'booked', 'lost'] as Lead['status'][]).map(status => (
                        <button 
                          key={status} 
                          onClick={() => handleUpdateLeadStatus(lead.id, status)}
                          className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${lead.status === status ? getStatusBadgeClass(status) + ' shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {status}
                        </button>
                      ))}
                   </div>
                   <button onClick={() => setLeadToDelete(lead)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                     <i className="fa-solid fa-trash-can text-sm"></i>
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-10 animate-fade">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold font-serif text-slate-900">Concierge Services</h2>
            <button 
              onClick={() => setEditingService({ title: '', description: '', icon: 'fa-concierge-bell' })}
              className="px-8 py-4 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all"
            >
              Add New Service
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(service => (
              <div key={service.id} className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-lg group hover-lift text-center">
                <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all text-2xl">
                   <i className={`fa-solid ${service.icon}`}></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 font-serif">{service.title}</h3>
                <p className="text-slate-500 text-sm mb-8 line-clamp-2">{service.description}</p>
                <div className="flex justify-center gap-3">
                   <button onClick={() => setEditingService(service)} className="px-6 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Edit</button>
                   <button onClick={() => setServiceToDelete(service)} className="px-6 py-2.5 rounded-xl bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-10 animate-fade">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold font-serif text-slate-900">Guest Chronicles</h2>
            <button 
              onClick={() => setEditingTestimonial({ name: '', content: '', rating: 5, category: 'Trip', avatar: `https://i.pravatar.cc/150?u=${Date.now()}` })}
              className="px-8 py-4 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all"
            >
              Add New Chronicle
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map(t => (
              <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-lg group hover-lift text-left">
                <p className="text-slate-600 text-sm italic mb-8">"{t.content}"</p>
                <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} className="w-10 h-10 rounded-xl" />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{t.name}</p>
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingTestimonial(t)} className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center hover:bg-sky-600 hover:text-white transition-all"><i className="fa-solid fa-pen text-[10px]"></i></button>
                    <button onClick={() => setTestimonialToDelete(t)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><i className="fa-solid fa-trash text-[10px]"></i></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="max-w-4xl mx-auto animate-fade">
          <div className="bg-white p-10 sm:p-16 rounded-[3rem] border border-slate-50 shadow-xl text-left">
            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-10">Branding & Identity</h2>
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Support Email</label>
                  <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">WhatsApp Concierge</label>
                  <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Promotion Banner</label>
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800" value={promoText} onChange={e => setPromoText(e.target.value)} />
              </div>
              <button onClick={handleUpdateBranding} disabled={isSyncing} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-sky-600 transition-all">
                {isSyncing ? 'SYNCING BRANDING...' : 'SAVE GLOBAL IDENTITY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Deleters */}
      
      {editingService && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-reveal" onClick={() => setEditingService(null)}>
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold font-serif mb-8">{editingService.id ? 'Edit Service' : 'New Service'}</h2>
            <form onSubmit={handleSaveService} className="space-y-6 text-left">
              <input required placeholder="Service Title (e.g., Private Chef)" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-bold" value={editingService.title} onChange={e => setEditingService({...editingService, title: e.target.value})} />
              <input placeholder="Icon Class (e.g., fa-utensils)" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-bold" value={editingService.icon} onChange={e => setEditingService({...editingService, icon: e.target.value})} />
              <textarea required rows={4} placeholder="Description" className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium resize-none" value={editingService.description} onChange={e => setEditingService({...editingService, description: e.target.value})} />
              <button type="submit" disabled={isSyncing} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                {isSyncing ? 'SYNCING...' : 'SAVE SERVICE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {(villaToDelete || leadToDelete || serviceToDelete || testimonialToDelete) && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-reveal" onClick={() => { setVillaToDelete(null); setLeadToDelete(null); setServiceToDelete(null); setTestimonialToDelete(null); }}>
          <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
               <i className="fa-solid fa-trash-can text-3xl"></i>
             </div>
             <h2 className="text-2xl font-bold font-serif mb-4 text-slate-900">Confirm Deletion?</h2>
             <p className="text-slate-500 text-sm mb-10 leading-relaxed">This action will permanently remove the record from the cloud.</p>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setVillaToDelete(null); setLeadToDelete(null); setServiceToDelete(null); setTestimonialToDelete(null); }} className="py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400">Cancel</button>
                <button onClick={async () => {
                  setIsSyncing(true);
                  setProgress({ active: true, message: 'Wiping Registry Entry...', percentage: 50, error: null });
                  try {
                    if (villaToDelete) await onDeleteVilla(villaToDelete.id);
                    if (leadToDelete) await deleteLead(leadToDelete.id);
                    if (serviceToDelete) await deleteService(serviceToDelete.id);
                    if (testimonialToDelete) await deleteTestimonial(testimonialToDelete.id);
                    
                    setProgress({ active: true, message: 'Entry Removed Successfully', percentage: 100, error: null });
                    setVillaToDelete(null); setLeadToDelete(null); setServiceToDelete(null); setTestimonialToDelete(null);
                    setTimeout(() => setProgress(p => ({...p, active: false})), 1500);
                  } catch (err: any) { setProgress({ active: true, message: 'Wipe Failed', percentage: 0, error: err.message }); }
                  finally { setIsSyncing(false); }
                }} className="py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white shadow-lg">Confirm</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
