
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Villa, Testimonial, Lead, AppTheme, SiteSettings, Service } from '../types';
import { generateVillaFromPrompt } from '../services/geminiService';
import { uploadMedia } from '../services/villaService';
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
  const [isSyncingBroadcast, setIsSyncingBroadcast] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [promoText, setPromoText] = useState(settings.promoText);
  const [activeTheme, setActiveTheme] = useState(settings.activeTheme);

  const [progress, setProgress] = useState<ProgressState>({
    active: false,
    message: '',
    percentage: 0,
    subMessage: '',
    error: null
  });
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const unsubLeads = subscribeToLeads(setLeads);
    return () => unsubLeads();
  }, []);

  useEffect(() => {
    setPromoText(settings.promoText);
    setActiveTheme(settings.activeTheme);
  }, [settings]);

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

  const handleEdit = (villa: Villa) => {
    setFormData({ ...villa });
    setIsEditing(true);
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    setMagicPrompt('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return;
    
    setIsSyncing(true);
    setProgress({ active: true, message: 'Syncing Changes...', percentage: 50, error: null });
    
    try {
      if (isEditing) {
        await onUpdateVilla(formData as Villa);
      } else {
        await onAddVilla(formData as Villa);
      }
      setProgress({ active: true, message: 'Committed Successfully', percentage: 100, error: null, subMessage: 'Changes are now live.' });
      setTimeout(() => setProgress(prev => ({ ...prev, active: false })), 2000);
      resetForm();
    } catch (err: any) {
      setProgress({ 
        active: true, 
        message: 'Security Interrupted', 
        percentage: 0, 
        error: err.message,
        subMessage: 'Database permissions or project config blocked the request.' 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProgress({ active: true, message: `Preparing ${files.length} assets...`, percentage: 0, error: null });
    const uploadedUrls: string[] = [...(formData.imageUrls || [])];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadMedia(file, 'images', (percent) => {
          setProgress(prev => ({
            ...prev,
            percentage: percent,
            subMessage: `Committing asset ${i + 1}/${files.length}: ${percent}%`
          }));
        });
        uploadedUrls.push(url);
      }
      setFormData(prev => ({ ...prev, imageUrls: uploadedUrls }));
      setProgress({ active: true, message: 'Assets Buffered', percentage: 100, subMessage: 'Click "Commit Changes" to finalize.' });
      setTimeout(() => setProgress(prev => ({ ...prev, active: false })), 2500);
    } catch (err: any) {
      setProgress({ 
        active: true, 
        message: 'Upload Interrupted', 
        percentage: 0, 
        error: err.message,
        subMessage: 'Storage Bucket might be missing or private.' 
      });
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleUpdateLead = async (id: string, status: Lead['status']) => {
    try {
      await updateLeadStatus(id, status);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleThemeChange = async (theme: AppTheme) => {
    setActiveTheme(theme);
    let autoPromo = "";
    switch(theme) {
      case AppTheme.REPUBLIC_DAY: autoPromo = "REPUBLIC DAY SPECIAL: CELEBRATE WITH FLAT 26% OFF ON ALL STAYS"; break;
      case AppTheme.INDEPENDENCE_DAY: autoPromo = "FREEDOM SALE: SALUTING THE NATION WITH 25% SAVINGS"; break;
      case AppTheme.HOLI: autoPromo = "HOLI HUNGAMA: SPLASH INTO COLORFUL DISCOUNTS OF 20%"; break;
      case AppTheme.DIWALI: autoPromo = "DIWALI FESTIVAL OF LIGHTS: SHINE BRIGHT WITH 30% OFF PREMIUM VILLAS"; break;
      case AppTheme.SUMMER: autoPromo = "SUMMER ESCAPE: COOL DOWN WITH 15% OFF YOUR TROPICAL RETREAT"; break;
      case AppTheme.WINTER: autoPromo = "WINTER WONDERLAND: COZY FIRESIDE STAYS AT 20% OFF"; break;
      default: autoPromo = "PEAK STAY EXCLUSIVE: BOOK YOUR LEGACY SANCTUARY TODAY"; break;
    }
    setPromoText(autoPromo);
    try {
      await updateSettings({ activeTheme: theme, promoText: autoPromo });
    } catch (err) {
      console.error("Theme switch failed", err);
    }
  };

  const handleUpdateBroadcast = async () => {
    setIsSyncingBroadcast(true);
    try {
      await updateSettings({ promoText });
      alert('Broadcast Pushed Successfully!');
    } catch (err: any) {
      alert('Broadcast Update Failed: ' + (err.message || 'Check connection'));
    } finally {
      setIsSyncingBroadcast(false);
    }
  };

  const themeOptions = [
    { id: AppTheme.REPUBLIC_DAY, name: "Republic Day", color: "bg-orange-500", icon: "fa-flag" },
    { id: AppTheme.INDEPENDENCE_DAY, name: "Independence Day", color: "bg-blue-900", icon: "fa-sun" },
    { id: AppTheme.HOLI, name: "Holi Festival", color: "bg-pink-500", icon: "fa-palette" },
    { id: AppTheme.DIWALI, name: "Diwali Special", color: "bg-amber-600", icon: "fa-om" },
    { id: AppTheme.SUMMER, name: "Summer Break", color: "bg-sky-400", icon: "fa-umbrella-beach" },
    { id: AppTheme.WINTER, name: "Winter Retreat", color: "bg-slate-800", icon: "fa-snowflake" },
    { id: AppTheme.DEFAULT, name: "Standard", color: "bg-slate-900", icon: "fa-hotel" }
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade overflow-hidden h-full">
      {/* GLOBAL COMMIT PROGRESS / ERROR FEEDBACK */}
      {progress.active && (
        <div className={`fixed top-32 right-8 z-[2000] ${progress.error ? 'w-[450px]' : 'w-80'} bg-slate-100 text-slate-900 p-8 rounded-[2rem] shadow-2xl animate-reveal border border-slate-200 max-h-[80vh] overflow-y-auto`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 ${progress.error ? 'bg-red-500' : 'bg-slate-900'} rounded-full flex items-center justify-center ${!progress.error && 'animate-spin'}`}>
                <i className={`fa-solid ${progress.error ? 'fa-triangle-exclamation' : 'fa-cloud-arrow-up'} text-white`}></i>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${progress.error ? 'text-red-600' : 'text-slate-600'}`}>
                  {progress.message}
                </p>
                <h4 className="text-sm font-bold truncate">{progress.error ? 'Error Detected' : 'Cloud Sync'}</h4>
              </div>
            </div>
            {progress.error && (
              <button onClick={() => setProgress(prev => ({ ...prev, active: false }))} className="text-slate-400 hover:text-slate-900">
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
          {!progress.error && (
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mb-3">
               <div className="h-full bg-slate-900 transition-all duration-300" style={{ width: `${progress.percentage}%` }}></div>
            </div>
          )}
          {progress.error ? (
            <div className="bg-white p-4 rounded-xl border border-red-100 shadow-inner mt-4">
               <pre className="text-[10px] font-mono text-red-600 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                 {progress.error}
               </pre>
            </div>
          ) : (
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{progress.subMessage}</p>
          )}
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 shrink-0">
        <div>
           <h1 className="text-4xl font-bold font-serif text-slate-900">Admin Control Center</h1>
           <div className="flex items-center gap-3 mt-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Status: {isSyncing ? 'Committing...' : 'Real-time'}
             </div>
           </div>
        </div>
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 overflow-x-auto max-w-full shadow-inner">
          {['inventory', 'inquiries', 'branding'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as AdminTab)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="flex flex-col lg:flex-row gap-12 h-auto lg:h-[calc(100vh-280px)] overflow-hidden">
          <div className="lg:w-[600px] shrink-0 h-full">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 h-full overflow-y-auto no-scrollbar scroll-smooth">
              <div className="flex justify-between items-start mb-8 sticky top-0 bg-white pb-4 z-10 border-b border-slate-50">
                <h2 className="text-2xl font-bold font-serif text-slate-900">{isEditing ? 'Modify Record' : 'Create Record'}</h2>
                <div className="flex gap-2">
                  {isEditing && (
                    <button onClick={resetForm} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900">
                      <i className="fa-solid fa-rotate-left"></i>
                    </button>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div className="mb-10 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-slate-600"></i>
                    AI Quick Draft
                  </h4>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. 3BHK Lonavala..." className="flex-grow bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-slate-900" value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} />
                    <button onClick={handleMagicFill} disabled={isAiLoading} className="px-5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">
                      {isAiLoading ? '...' : 'Draft'}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                <input type="text" required placeholder="Villa Name" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <input type="text" required placeholder="Location" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Price" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm" value={formData.pricePerNight} onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })} />
                  <input type="number" placeholder="BHK" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value), numRooms: Number(e.target.value) })} />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gallery</label>
                    <button type="button" onClick={() => imageInputRef.current?.click()} className="text-[10px] font-black text-slate-600 uppercase underline">Upload</button>
                    <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleManualImageUpload} />
                  </div>
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {formData.imageUrls?.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 shrink-0">
                        <img src={url} className="w-full h-full object-cover rounded-xl" />
                        <button type="button" onClick={() => setFormData({ ...formData, imageUrls: formData.imageUrls?.filter((_, idx) => idx !== i) })} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 rounded-full text-[10px]"><i className="fa-solid fa-xmark"></i></button>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={isSyncing} className="w-full bg-slate-900 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-[0.98] transition-transform">
                  {isSyncing ? 'Syncing...' : 'Commit Changes'}
                </button>
              </form>
            </div>
          </div>

          <div className="flex-grow h-full overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVillas.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex gap-6 group hover:shadow-xl transition-all">
                  <img src={v.imageUrls?.[0]} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{v.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{v.location}</p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleEdit(v)} className="flex-1 py-2 bg-slate-50 text-slate-900 rounded-xl text-[8px] font-black uppercase hover:bg-slate-100">Modify</button>
                      <button onClick={() => onDeleteVilla(v.id)} className="px-3 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm animate-reveal h-[calc(100vh-280px)] overflow-y-auto no-scrollbar">
          <h2 className="text-3xl font-bold font-serif text-slate-900 mb-12">Guest Inquiry Registry</h2>
          <div className="space-y-4">
            {leads.map(lead => (
              <div key={lead.id} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 flex justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                   <div className={`w-3 h-3 rounded-full bg-amber-500 shadow-lg`}></div>
                   <div>
                     <h3 className="text-xl font-bold text-slate-900">{lead.villaName}</h3>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                       {lead.customerName || 'Anonymous Guest'} • {new Date(lead.timestamp).toLocaleDateString()}
                     </p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                  <select 
                    value={lead.status}
                    onChange={(e) => handleUpdateLead(lead.id, e.target.value as any)}
                    className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-sm outline-none"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="booked">Booked</option>
                    <option value="lost">Lost</option>
                  </select>
                  <button onClick={() => deleteLead(lead.id)} className="p-3 text-red-400 hover:text-red-600 transition-colors">
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm animate-reveal overflow-y-auto h-[calc(100vh-280px)] no-scrollbar">
           <h2 className="text-4xl font-bold font-serif mb-12 text-slate-900">Visual Identity Control</h2>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-12">
                 <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-6">Global Active Theme</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                       {themeOptions.map((opt) => (
                          <button 
                             key={opt.id}
                             onClick={() => handleThemeChange(opt.id)}
                             className={`p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col justify-between h-40 group ${activeTheme === opt.id ? 'border-slate-900 shadow-xl' : 'border-slate-50 hover:border-slate-200'}`}
                          >
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${opt.color} shadow-lg group-hover:scale-110 transition-transform`}>
                                <i className={`fa-solid ${opt.icon}`}></i>
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{opt.name}</h4>
                                <div className={`h-1 w-6 mt-2 rounded-full ${opt.color}`}></div>
                             </div>
                          </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-12 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
                 <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-6">Campaign Broadcast (Marquee)</label>
                    <textarea 
                       value={promoText} 
                       onChange={(e) => setPromoText(e.target.value)} 
                       placeholder="Enter offer text..."
                       className="w-full p-6 bg-white rounded-3xl border border-slate-200 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900" 
                       rows={4} 
                    />
                    <div className="flex justify-between items-center mt-6">
                       <p className="text-[10px] font-medium text-slate-400 italic">This text scrolls across the very top of the website.</p>
                       <button 
                          onClick={handleUpdateBroadcast}
                          disabled={isSyncingBroadcast}
                          className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                       >
                          {isSyncingBroadcast ? 'Syncing...' : 'Update Broadcast'}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
