
import React, { useState, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [promoText, setPromoText] = useState(settings.promoText);

  const [progress, setProgress] = useState<ProgressState>({
    active: false,
    message: '',
    percentage: 0,
    subMessage: '',
    error: null
  });
  
  const [showSuccessModal, setShowSuccessModal] = useState<{ show: boolean, type: string | null }>({ show: false, type: null });
  const [managedReviews, setManagedReviews] = useState<Testimonial[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [managedServices, setManagedServices] = useState<Service[]>([]);
  
  // Service Form State
  const [serviceFormData, setServiceFormData] = useState<Partial<Service>>({ title: '', description: '', icon: 'fa-concierge-bell' });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const unsubLeads = subscribeToLeads(setLeads);
    const unsubReviews = subscribeToTestimonials(setManagedReviews);
    const unsubServices = subscribeToServices(setManagedServices);
    return () => {
      unsubLeads();
      unsubReviews();
      unsubServices();
    };
  }, []);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return;
    
    setIsSyncing(true);
    try {
      if (isEditing) {
        await onUpdateVilla(formData as Villa);
        setShowSuccessModal({ show: true, type: 'Property Synced' });
      } else {
        await onAddVilla(formData as Villa);
        setShowSuccessModal({ show: true, type: 'Property Published' });
      }
      resetForm();
    } catch (err: any) {
      setProgress({ active: true, message: 'Sync Error', percentage: 0, error: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormData.title) return;
    setIsSyncing(true);
    try {
      if (editingServiceId) {
        await updateService(editingServiceId, serviceFormData);
      } else {
        await createService(serviceFormData as Omit<Service, 'id'>);
      }
      setServiceFormData({ title: '', description: '', icon: 'fa-concierge-bell' });
      setEditingServiceId(null);
    } catch (err: any) {
      alert(err.message);
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
      setProgress({ active: true, message: 'Assets Committed', percentage: 100, subMessage: 'Gallery updated successfully.' });
      setTimeout(() => setProgress(prev => ({ ...prev, active: false })), 2000);
    } catch (err: any) {
      setProgress({ active: true, message: 'Upload Interrupted', percentage: 0, error: err.message });
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

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'booked': return 'bg-emerald-500';
      case 'contacted': return 'bg-sky-500';
      case 'lost': return 'bg-red-400';
      default: return 'bg-amber-500';
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade overflow-hidden h-full">
      {/* GLOBAL COMMIT PROGRESS */}
      {progress.active && (
        <div className={`fixed top-32 right-8 z-[2000] ${progress.error ? 'w-[450px]' : 'w-80'} bg-sky-100 text-sky-900 p-8 rounded-[2rem] shadow-2xl animate-reveal border border-sky-200 max-h-[80vh] overflow-y-auto`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 ${progress.error ? 'bg-red-500' : 'bg-sky-500'} rounded-full flex items-center justify-center ${!progress.error && 'animate-spin'}`}>
                <i className={`fa-solid ${progress.error ? 'fa-triangle-exclamation' : 'fa-cloud-arrow-up'} text-white`}></i>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${progress.error ? 'text-red-600' : 'text-sky-600'}`}>
                  {progress.error ? 'Security Interrupted' : 'Instant Sync'}
                </p>
                <h4 className="text-sm font-bold truncate">{progress.message}</h4>
              </div>
            </div>
            {progress.error && (
              <button onClick={() => setProgress(prev => ({ ...prev, active: false }))} className="text-sky-400 hover:text-sky-900">
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
          {!progress.error && (
            <div className="w-full h-1 bg-sky-200 rounded-full overflow-hidden mb-3">
               <div className="h-full bg-sky-600 transition-all duration-300" style={{ width: `${progress.percentage}%` }}></div>
            </div>
          )}
          <p className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">{progress.subMessage}</p>
          {progress.error && (
            <div className="mt-6 pt-6 border-t border-sky-200">
              <pre className="text-[11px] font-medium leading-relaxed bg-white/60 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap select-all font-mono">
                {progress.error}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 shrink-0">
        <div>
           <h1 className="text-4xl font-bold font-serif text-sky-900">Admin Control Center</h1>
           <div className="flex items-center gap-3 mt-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Instant Sync: Operational
             </div>
           </div>
        </div>
        <div className="bg-sky-100 p-1.5 rounded-2xl flex gap-1 overflow-x-auto max-w-full">
          {['inventory', 'inquiries', 'services', 'reviews', 'branding'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as AdminTab)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-sky-900 shadow-md scale-105' : 'text-sky-400 hover:text-sky-600'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="flex flex-col lg:flex-row gap-12 h-auto lg:h-[calc(100vh-280px)] overflow-hidden">
          <div className="lg:w-[600px] shrink-0 h-full">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-sky-100 h-full overflow-y-auto no-scrollbar scroll-smooth">
              <div className="flex justify-between items-start mb-8 sticky top-0 bg-white pb-4 z-10 border-b border-sky-50">
                <h2 className="text-2xl font-bold font-serif text-sky-900">{isEditing ? 'Modify Record' : 'Create Record'}</h2>
                <div className="flex gap-2">
                  {isEditing && (
                    <button onClick={resetForm} className="p-3 bg-sky-50 text-sky-400 rounded-xl hover:text-sky-900">
                      <i className="fa-solid fa-rotate-left"></i>
                    </button>
                  )}
                  <button type="button" onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })} className={`w-12 h-6 rounded-full transition-all relative ${formData.isFeatured ? 'bg-sky-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isFeatured ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>

              {!isEditing && (
                <div className="mb-10 bg-sky-50/50 p-6 rounded-[2.5rem] border border-sky-100">
                  <h4 className="text-[10px] font-black text-sky-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-sky-600"></i>
                    AI Quick Draft
                  </h4>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. 3BHK Lonavala Villa..." className="flex-grow bg-white border border-sky-100 rounded-xl px-4 py-3 text-xs outline-none" value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} />
                    <button onClick={handleMagicFill} disabled={isAiLoading} className="px-5 bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase">
                      {isAiLoading ? '...' : 'Draft'}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                <input type="text" required placeholder="Villa Name" className="w-full px-5 py-4 rounded-2xl bg-sky-50 border border-sky-100 font-bold text-sm outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <input type="text" required placeholder="Location" className="w-full px-5 py-4 rounded-2xl bg-sky-50 border border-sky-100 font-bold text-sm outline-none" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Price" className="w-full px-5 py-4 rounded-2xl bg-sky-50 border border-sky-100 text-sm" value={formData.pricePerNight} onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })} />
                  <input type="number" placeholder="BHK" className="w-full px-5 py-4 rounded-2xl bg-sky-50 border border-sky-100 text-sm" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value), numRooms: Number(e.target.value) })} />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-sky-400">Gallery</label>
                    <button type="button" onClick={() => imageInputRef.current?.click()} className="text-[10px] font-black text-sky-600 uppercase underline">Upload</button>
                    <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleManualImageUpload} />
                  </div>
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {formData.imageUrls?.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 shrink-0">
                        <img src={url} className="w-full h-full object-cover rounded-xl" />
                        <button onClick={() => setFormData({ ...formData, imageUrls: formData.imageUrls?.filter((_, idx) => idx !== i) })} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 rounded-full text-[10px]"><i className="fa-solid fa-xmark"></i></button>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={isSyncing} className="w-full bg-sky-600 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">
                  {isSyncing ? 'Syncing...' : 'Commit Changes'}
                </button>
              </form>
            </div>
          </div>

          <div className="flex-grow h-full overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVillas.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-[2.5rem] border border-sky-100 flex gap-6 group hover:shadow-xl transition-all">
                  <img src={v.imageUrls?.[0]} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-sky-900 truncate">{v.name}</h3>
                    <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest truncate">{v.location}</p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleEdit(v)} className="flex-1 py-2 bg-sky-50 text-sky-900 rounded-xl text-[8px] font-black uppercase">Modify</button>
                      <button onClick={() => onDeleteVilla(v.id)} className="px-3 py-2 bg-red-50 text-red-500 rounded-xl"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div className="bg-white p-12 rounded-[3.5rem] border border-sky-100 shadow-sm animate-reveal h-[calc(100vh-280px)] overflow-y-auto no-scrollbar">
          <h2 className="text-3xl font-bold font-serif text-sky-900 mb-12">Guest Inquiry Registry</h2>
          <div className="space-y-4">
            {leads.map(lead => (
              <div key={lead.id} className="bg-sky-50/50 p-8 rounded-[2.5rem] border border-sky-100 flex justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                   <div className={`w-3 h-3 rounded-full ${getStatusColor(lead.status)} shadow-lg shadow-sky-200`}></div>
                   <div>
                     <h3 className="text-xl font-bold text-sky-900">{lead.villaName}</h3>
                     <p className="text-[10px] font-black uppercase text-sky-400 tracking-widest mt-1">
                       {lead.customerName || 'Anonymous Guest'} • {new Date(lead.timestamp).toLocaleDateString()}
                     </p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                  <select 
                    value={lead.status}
                    onChange={(e) => handleUpdateLead(lead.id, e.target.value as any)}
                    className="bg-white border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-sky-900 shadow-sm outline-none"
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

      {activeTab === 'services' && (
        <div className="flex flex-col lg:flex-row gap-12 h-[calc(100vh-280px)] overflow-hidden">
           <div className="lg:w-[400px] shrink-0 bg-white p-10 rounded-[3rem] shadow-xl border border-sky-100 overflow-y-auto">
              <h2 className="text-2xl font-bold font-serif text-sky-900 mb-8">{editingServiceId ? 'Edit Service' : 'Add New Service'}</h2>
              <form onSubmit={handleServiceSubmit} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-2">Service Title</label>
                    <input required type="text" className="w-full p-4 bg-sky-50 rounded-2xl outline-none font-bold text-sm" value={serviceFormData.title} onChange={e => setServiceFormData({...serviceFormData, title: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-2">Icon Class (FA)</label>
                    <div className="flex gap-3">
                       <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                          <i className={`fa-solid ${serviceFormData.icon}`}></i>
                       </div>
                       <input required type="text" className="flex-grow p-4 bg-sky-50 rounded-2xl outline-none font-bold text-sm" value={serviceFormData.icon} onChange={e => setServiceFormData({...serviceFormData, icon: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-2">Description</label>
                    <textarea className="w-full p-4 bg-sky-50 rounded-2xl outline-none font-medium text-sm" rows={4} value={serviceFormData.description} onChange={e => setServiceFormData({...serviceFormData, description: e.target.value})} />
                 </div>
                 <button type="submit" disabled={isSyncing} className="w-full bg-sky-900 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">
                   {editingServiceId ? 'Update Service' : 'Publish Service'}
                 </button>
                 {editingServiceId && (
                   <button type="button" onClick={() => { setEditingServiceId(null); setServiceFormData({ title: '', description: '', icon: 'fa-concierge-bell' }); }} className="w-full text-[10px] font-black text-sky-400 uppercase tracking-widest">Cancel</button>
                 )}
              </form>
           </div>
           <div className="flex-grow overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {managedServices.map(service => (
                   <div key={service.id} className="bg-white p-8 rounded-[3rem] border border-sky-100 flex gap-6 hover:shadow-xl transition-all">
                      <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 text-2xl shrink-0">
                         <i className={`fa-solid ${service.icon}`}></i>
                      </div>
                      <div className="flex-grow min-w-0">
                         <h4 className="font-bold text-sky-900 truncate">{service.title}</h4>
                         <p className="text-xs text-sky-400 line-clamp-2 mt-1">{service.description}</p>
                         <div className="flex gap-4 mt-4">
                            <button onClick={() => { setEditingServiceId(service.id); setServiceFormData(service); }} className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Edit</button>
                            <button onClick={() => deleteService(service.id)} className="text-[10px] font-black text-red-400 uppercase tracking-widest">Delete</button>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white p-12 rounded-[3.5rem] border border-sky-100 shadow-sm animate-reveal overflow-y-auto h-[calc(100vh-280px)] no-scrollbar">
           <h2 className="text-3xl font-bold font-serif text-sky-900 mb-12">Public Memoirs Control</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {managedReviews.map(review => (
               <div key={review.id} className="bg-sky-50/30 p-8 rounded-[2.5rem] border border-sky-50 relative group">
                  <div className="flex items-center gap-4 mb-6">
                    <img src={review.avatar} className="w-12 h-12 rounded-xl" />
                    <div>
                      <h4 className="font-bold text-sky-900">{review.name}</h4>
                      <div className="flex text-orange-400 text-[8px] gap-0.5">
                        {[...Array(review.rating)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-sky-700 leading-relaxed font-medium mb-8">"{review.content}"</p>
                  <button onClick={() => deleteTestimonial(review.id)} className="absolute top-6 right-6 w-8 h-8 bg-red-50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all">
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="bg-white p-12 rounded-[3.5rem] border border-sky-100 shadow-sm animate-reveal overflow-y-auto h-[calc(100vh-280px)] no-scrollbar">
           <h2 className="text-4xl font-bold font-serif mb-12 text-sky-900">Identity Control</h2>
           <div className="max-w-xl space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Marquee Broadcast</label>
                <textarea value={promoText} onChange={(e) => setPromoText(e.target.value)} className="w-full p-6 bg-sky-50 rounded-3xl border border-sky-100 font-bold text-sm outline-none" rows={3} />
                <button onClick={async () => { await updateSettings({ promoText }); alert('Broadcast Pushed!'); }} className="px-8 py-4 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg">Commit Broadcast</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
