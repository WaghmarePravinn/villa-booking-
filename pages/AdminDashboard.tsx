
import React, { useState, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
import { Villa, Testimonial, Lead, AppTheme, SiteSettings } from '../types';
import { generateVillaFromPrompt } from '../services/geminiService';
import { uploadMedia } from '../services/villaService';
import { updateSettings } from '../services/settingsService';
import { subscribeToLeads, updateLeadStatus, deleteLead } from '../services/leadService';
import { subscribeToTestimonials, deleteTestimonial } from '../services/testimonialService';

interface AdminDashboardProps {
  villas: Villa[];
  settings: SiteSettings;
  onAddVilla: (villa: Villa) => Promise<void>;
  onUpdateVilla: (villa: Villa) => Promise<void>;
  onDeleteVilla: (id: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

type AdminTab = 'inventory' | 'inquiries' | 'reviews' | 'branding';

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
  const [newAmenity, setNewAmenity] = useState('');
  const [newService, setNewService] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ show: boolean, id: string | null, name: string | null }>({ show: false, id: null, name: null });
  const [managedReviews, setManagedReviews] = useState<Testimonial[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const unsubLeads = subscribeToLeads(setLeads);
    const unsubReviews = subscribeToTestimonials(setManagedReviews);
    return () => {
      unsubLeads();
      unsubReviews();
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

  const confirmDeleteVilla = (id: string, name: string) => {
    setShowDeleteConfirm({ show: true, id, name });
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
    setNewAmenity('');
    setNewService('');
    setNewVideoUrl('');
    setProgress({ active: false, message: '', percentage: 0, subMessage: '', error: null });
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
      alert(`Commit Failure: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    if (formData.amenities?.includes(newAmenity.trim())) return;
    setFormData(prev => ({ ...prev, amenities: [...(prev.amenities || []), newAmenity.trim()] }));
    setNewAmenity('');
  };

  const handleAddService = () => {
    if (!newService.trim()) return;
    if (formData.includedServices?.includes(newService.trim())) return;
    setFormData(prev => ({ ...prev, includedServices: [...(prev.includedServices || []), newService.trim()] }));
    setNewService('');
  };

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    if (formData.videoUrls?.includes(newVideoUrl.trim())) return;
    setFormData(prev => ({ ...prev, videoUrls: [...(prev.videoUrls || []), newVideoUrl.trim()] }));
    setNewVideoUrl('');
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

  const handleBulkZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    setProgress({ active: true, message: 'Processing Archive...', percentage: 5, error: null });
    
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const villaMap: Record<string, { name: string, location: string, bhk: number, photos: Blob[] }> = {};

      for (const [relativePath, zipEntry] of Object.entries(content.files)) {
        if ((zipEntry as any).dir) continue;
        const pathParts = relativePath.split('/');
        if (pathParts.length < 3) continue;

        const bhkFolder = pathParts[0]; 
        const infoFolder = pathParts[1]; 
        const fileName = pathParts[2];
        const bhkCount = parseInt(bhkFolder.match(/\d+/)?.[0] || '2');
        const [vName, vLoc] = infoFolder.includes('_') ? infoFolder.split('_') : [infoFolder, 'Unknown'];

        const key = `${bhkFolder}/${infoFolder}`;
        if (!villaMap[key]) villaMap[key] = { name: vName.trim(), location: vLoc.trim(), bhk: bhkCount, photos: [] };
        if (fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
          villaMap[key].photos.push(await (zipEntry as any).async('blob'));
        }
      }

      const villasToProcess = Object.keys(villaMap);
      const totalVillas = villasToProcess.length;
      
      for (let vIdx = 0; vIdx < totalVillas; vIdx++) {
        const key = villasToProcess[vIdx];
        const data = villaMap[key];
        const imageUrls: string[] = [];
        
        for (let pIdx = 0; pIdx < data.photos.length; pIdx++) {
          const photoBlob = data.photos[pIdx];
          const photoFile = new File([photoBlob], `bulk_${pIdx}.jpg`, { type: photoBlob.type });
          
          const url = await uploadMedia(photoFile, 'images', (percent) => {
            setProgress({
              active: true,
              percentage: percent,
              message: `Committing Villa ${vIdx + 1}/${totalVillas}: ${data.name}`,
              subMessage: `Asset ${pIdx + 1}/${data.photos.length} (${percent}%)`
            });
          });
          imageUrls.push(url);
        }

        await onAddVilla({
          ...formData,
          name: data.name,
          location: data.location,
          bedrooms: data.bhk,
          numRooms: data.bhk,
          capacity: data.bhk * 2,
          description: `Luxurious ${data.bhk}BHK retreat in ${data.location}.`,
          imageUrls: imageUrls
        } as Villa);
      }
      
      setProgress({ active: true, message: 'Migration Success', percentage: 100, subMessage: `${totalVillas} records committed to cloud.` });
      setShowSuccessModal({ show: true, type: 'Batch Import Complete' });
      setTimeout(() => setProgress(prev => ({ ...prev, active: false })), 3000);
    } catch (err: any) {
      setProgress({ active: true, message: 'Batch Commit Failed', percentage: 0, error: err.message });
    } finally {
      setIsSyncing(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  const handleThemeChange = async (theme: AppTheme) => {
    setIsSyncing(true);
    await updateSettings({ activeTheme: theme });
    setIsSyncing(false);
    setShowSuccessModal({ show: true, type: 'Identity Updated' });
  };

  const handlePromoSave = async () => {
    setIsSyncing(true);
    await updateSettings({ promoText });
    setIsSyncing(false);
    setShowSuccessModal({ show: true, type: 'Broadcast Committed' });
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
              <p className="mt-4 text-[9px] text-sky-600 font-black uppercase tracking-widest text-center">
                Copy the SQL above and run it in Supabase
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal.show && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-sky-100/60 backdrop-blur-xl animate-fade">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl animate-scale">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-check-double text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold font-serif text-slate-900 mb-2">{showSuccessModal.type}</h3>
            <p className="text-slate-400 text-xs font-medium mb-8">Changes were pushed to the production environment instantly.</p>
            <button onClick={() => setShowSuccessModal({ show: false, type: null })} className="w-full bg-sky-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Dismiss</button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm.show && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-sky-100/70 backdrop-blur-xl animate-fade">
          <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl animate-scale">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <i className="fa-solid fa-triangle-exclamation text-5xl"></i>
            </div>
            <h3 className="text-2xl font-bold font-serif text-slate-900 mb-2">Confirm Removal</h3>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed">This action will permanently delete <span className="font-bold text-slate-900">{showDeleteConfirm.name}</span> from the cloud registry.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm({ show: false, id: null, name: null })} className="flex-1 bg-sky-50 text-sky-700 font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-sky-100 transition-all" disabled={isSyncing}>Abort</button>
              <button onClick={async () => {
                if (showDeleteConfirm.id) {
                  try {
                    setIsSyncing(true);
                    await onDeleteVilla(showDeleteConfirm.id);
                    setShowDeleteConfirm({ show: false, id: null, name: null });
                    setShowSuccessModal({ show: true, type: 'Record Purged' });
                  } catch (err: any) {
                    alert(`Purge Failed: ${err.message}`);
                  } finally {
                    setIsSyncing(false);
                  }
                }
              }} className="flex-1 bg-red-600 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all" disabled={isSyncing}>Commit</button>
            </div>
          </div>
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
             <span className="text-sky-400 text-[9px] font-black uppercase tracking-widest">Production Cloud Interface</span>
           </div>
        </div>
        <div className="bg-sky-100 p-1.5 rounded-2xl flex gap-1">
          {['inventory', 'inquiries', 'reviews', 'branding'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as AdminTab)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-sky-900 shadow-md scale-105' : 'text-sky-400 hover:text-sky-600'}`}>
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
                <div>
                  <h2 className="text-2xl font-bold font-serif text-sky-900">{isEditing ? 'Modify Record' : 'Create Record'}</h2>
                  <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest mt-1">Status: {isSyncing ? 'Committing...' : 'Idle'}</p>
                </div>
                <div className="flex gap-2">
                  {isEditing && (
                    <button onClick={resetForm} className="p-3 bg-sky-50 text-sky-400 rounded-xl hover:text-sky-900 transition-all">
                      <i className="fa-solid fa-rotate-left"></i>
                    </button>
                  )}
                  <div className="flex flex-col items-center">
                    <button type="button" onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })} className={`w-12 h-6 rounded-full transition-all relative ${formData.isFeatured ? 'bg-sky-500' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isFeatured ? 'left-7' : 'left-1'}`}></div>
                    </button>
                    <span className="text-[7px] font-black uppercase mt-1">Featured</span>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <div className="mb-10 bg-sky-50/50 p-6 rounded-[2.5rem] relative overflow-hidden group border border-sky-100">
                  <h4 className="text-[10px] font-black text-sky-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-sky-600"></i>
                    AI Record Generator
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. 5BHK Pool Villa in Anjuna..."
                      className="flex-grow bg-white border border-sky-100 rounded-xl px-4 py-3 text-sky-900 text-xs placeholder:text-sky-300 focus:ring-1 focus:ring-sky-500 transition-all outline-none"
                      value={magicPrompt}
                      onChange={(e) => setMagicPrompt(e.target.value)}
                    />
                    <button 
                      onClick={handleMagicFill}
                      disabled={isAiLoading}
                      className="px-5 bg-sky-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-700 transition-all disabled:opacity-50"
                    >
                      {isAiLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Draft'}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <i className="fa-solid fa-tag text-[10px] text-sky-500"></i>
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Metadata</label>
                  </div>
                  <input type="text" required placeholder="Villa Name" className="w-full px-5 py-4 rounded-2xl bg-sky-50 border border-sky-100 font-bold text-sm focus:ring-2 focus:ring-sky-500 transition-all outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <input type="text" required placeholder="Location (City, State)" className="w-full px-5 py-4 rounded-2xl bg-sky-50 border border-sky-100 font-bold text-sm focus:ring-2 focus:ring-sky-500 transition-all outline-none" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest px-1">Price (₹)</label>
                    <input type="number" required className="w-full px-4 py-3 rounded-xl bg-sky-50 border border-sky-100 font-bold text-xs" value={formData.pricePerNight} onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest px-1">Bedrooms</label>
                    <input type="number" required className="w-full px-4 py-3 rounded-xl bg-sky-50 border border-sky-100 font-bold text-xs" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value), numRooms: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest px-1">Bathrooms</label>
                    <input type="number" required className="w-full px-4 py-3 rounded-xl bg-sky-50 border border-sky-100 font-bold text-xs" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest px-1">Capacity</label>
                    <input type="number" required className="w-full px-4 py-3 rounded-xl bg-sky-50 border border-sky-100 font-bold text-xs" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Image Catalog</label>
                    <button type="button" onClick={() => imageInputRef.current?.click()} className="text-[9px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                      <i className="fa-solid fa-cloud-arrow-up"></i> Upload
                    </button>
                    <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleManualImageUpload} />
                  </div>
                  <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
                    {formData.imageUrls?.map((url, i) => (
                      <div key={i} className="relative w-24 h-24 shrink-0 group">
                        <img src={url} className="w-full h-full object-cover rounded-xl shadow-md border border-sky-100" alt="" />
                        <button onClick={() => setFormData({ ...formData, imageUrls: formData.imageUrls?.filter((_, idx) => idx !== i) })} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest px-1">Video Walkthroughs</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Direct MP4 URL..." className="flex-grow px-4 py-3 rounded-xl bg-sky-50 border border-sky-100 text-xs" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVideo())} />
                    <button type="button" onClick={handleAddVideo} className="px-4 bg-sky-600 text-white rounded-xl font-black text-[10px] uppercase">Add</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest px-1">Property Amenities</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Pool, Gym..." className="flex-grow px-4 py-3 rounded-xl bg-sky-50 border border-sky-100 text-xs font-bold" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())} />
                      <button type="button" onClick={handleAddAmenity} className="px-4 bg-sky-100 text-sky-700 rounded-xl font-black text-[10px] uppercase">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.amenities?.map((a, i) => (
                        <span key={i} className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-lg text-[10px] font-bold flex items-center gap-2">
                          {a}
                          <button onClick={() => setFormData({ ...formData, amenities: formData.amenities?.filter((_, idx) => idx !== i) })} className="hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest px-1">Included Services</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Chef, Butler..." className="flex-grow px-4 py-3 rounded-xl bg-sky-50 border border-sky-100 text-xs font-bold" value={newService} onChange={(e) => setNewService(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())} />
                      <button type="button" onClick={handleAddService} className="px-4 bg-sky-100 text-sky-700 rounded-xl font-black text-[10px] uppercase">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.includedServices?.map((s, i) => (
                        <span key={i} className="px-3 py-1.5 bg-sky-200 text-sky-900 rounded-lg text-[10px] font-bold flex items-center gap-2">
                          {s}
                          <button onClick={() => setFormData({ ...formData, includedServices: formData.includedServices?.filter((_, idx) => idx !== i) })} className="hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 pt-10 bg-white border-t border-sky-50">
                  <button type="submit" disabled={isSyncing} className="w-full bg-sky-600 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                    {isSyncing ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : 'Commit Environmental Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="flex-grow h-full">
            <div className="bg-white rounded-[3.5rem] border border-sky-100 shadow-sm p-8 h-full flex flex-col">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div className="relative flex-grow mr-6">
                  <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-sky-300"></i>
                  <input type="text" placeholder="Search operational registry..." className="w-full pl-14 pr-6 py-5 bg-sky-50 rounded-[2rem] border-none font-bold text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => zipInputRef.current?.click()} className="px-6 py-5 bg-sky-100 text-sky-700 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-sky-200 transition-all flex items-center gap-3 shadow-sm border border-sky-200">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  Batch Commit
                </button>
                <input ref={zipInputRef} type="file" accept=".zip" className="hidden" onChange={handleBulkZipUpload} />
              </div>

              <div className="flex-grow overflow-y-auto no-scrollbar scroll-smooth">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                  {filteredVillas.map(v => (
                    <div key={v.id} className="bg-white rounded-[2.5rem] p-6 border border-sky-50 flex gap-6 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 hover:border-sky-200">
                       <img src={v.imageUrls?.[0]} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-md shrink-0 border border-sky-50" alt="" />
                       <div className="flex-grow min-w-0 text-left">
                          <h3 className="font-bold text-sky-900 text-base font-serif truncate">{v.name}</h3>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest truncate">{v.location}</p>
                            <span className="text-[9px] font-black text-sky-600 font-sans">₹{v.pricePerNight.toLocaleString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(v)} className="flex-1 py-2 bg-sky-50 text-sky-900 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-sky-600 hover:text-white transition-all">Modify</button>
                            <button onClick={() => confirmDeleteVilla(v.id, v.name)} className="px-3 py-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-[8px]"></i></button>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="bg-white p-12 rounded-[3.5rem] border border-sky-100 shadow-sm animate-reveal overflow-y-auto h-[calc(100vh-280px)] no-scrollbar">
           <h2 className="text-4xl font-bold font-serif mb-12 text-sky-900">Production Branding Access</h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-xl font-bold font-serif text-sky-800">Global Broadcast Message</h3>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Active Marquee Content</label>
                  <textarea value={promoText} onChange={(e) => setPromoText(e.target.value)} className="w-full p-6 bg-sky-50 rounded-3xl border border-sky-100 font-bold text-sm focus:ring-2 focus:ring-sky-500 outline-none" rows={3} />
                  <button onClick={handlePromoSave} className="px-8 py-4 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-700 transition-all">Commit Broadcast</button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
