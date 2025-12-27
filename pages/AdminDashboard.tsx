
import React, { useState, useMemo, useEffect } from 'react';
import { Villa, Testimonial, Lead } from '../types';
import { generateVillaDescription } from '../services/geminiService';
import { seedDatabase } from '../services/villaService';
import { subscribeToLeads, updateLeadStatus, deleteLead } from '../services/leadService';
import { TESTIMONIALS as INITIAL_TESTIMONIALS, BRAND_NAME, WHATSAPP_NUMBER } from '../constants';

interface AdminDashboardProps {
  villas: Villa[];
  onAddVilla: (villa: Villa) => Promise<void>;
  onUpdateVilla: (villa: Villa) => Promise<void>;
  onDeleteVilla: (id: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

type AdminTab = 'inventory' | 'inquiries' | 'reviews' | 'analytics' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ villas, onAddVilla, onUpdateVilla, onDeleteVilla, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [isEditing, setIsEditing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Testimonials state (Can also be moved to Firestore easily)
  const [managedReviews, setManagedReviews] = useState<Testimonial[]>(() => {
    const saved = localStorage.getItem('peak_stay_managed_reviews');
    return saved ? JSON.parse(saved) : INITIAL_TESTIMONIALS;
  });

  // Real-time Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  
  useEffect(() => {
    const unsubscribe = subscribeToLeads((updatedLeads) => {
      setLeads(updatedLeads);
    });
    return () => unsubscribe();
  }, []);

  const [newAmenity, setNewAmenity] = useState('');
  const [newService, setNewService] = useState('');
  
  const [formData, setFormData] = useState<Partial<Villa>>({
    name: '',
    location: '',
    pricePerNight: 0,
    bedrooms: 0,
    bathrooms: 0,
    capacity: 0,
    numRooms: 1,
    description: '',
    longDescription: '',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1200',
    amenities: ['Wi-Fi', 'AC'],
    includedServices: ['Housekeeping'],
    isFeatured: false,
    rating: 5,
    ratingCount: 1,
    mealsAvailable: true,
    petFriendly: true,
    refundPolicy: 'Full refund if cancelled 48 hours before check-in.'
  });

  useEffect(() => {
    localStorage.setItem('peak_stay_managed_reviews', JSON.stringify(managedReviews));
  }, [managedReviews]);

  const stats = useMemo(() => {
    return {
      total: villas.length,
      avgPrice: villas.length ? Math.round(villas.reduce((acc, v) => acc + v.pricePerNight, 0) / villas.length) : 0,
      featured: villas.filter(v => v.isFeatured).length,
      capacity: villas.reduce((acc, v) => acc + v.capacity, 0),
      totalLeads: leads.length,
      conversionRate: leads.length > 0 ? `${((leads.filter(l => l.status === 'booked').length / leads.length) * 100).toFixed(1)}%` : '0%'
    };
  }, [villas, leads]);

  const filteredVillas = useMemo(() => {
    return villas.filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [villas, searchTerm]);

  const handleSuggestDescription = async () => {
    if (!formData.name || !formData.location) {
      alert("Please provide a name and location first.");
      return;
    }
    setIsAILoading(true);
    const combinedFeatures = [...(formData.amenities || []), ...(formData.includedServices || [])];
    const description = await generateVillaDescription(
      formData.name || '', 
      formData.location || '', 
      combinedFeatures
    );
    setFormData(prev => ({ 
      ...prev, 
      description, 
      longDescription: description + " This bespoke residence combines ultimate privacy with the highest standards of hospitality." 
    }));
    setIsAILoading(false);
  };

  const handleRestoreDemo = async () => {
    if (window.confirm("Restore factory defaults in Cloud? Current inventory will be replaced.")) {
      setIsSeeding(true);
      await seedDatabase();
      setIsSeeding(false);
    }
  };

  const addItem = (field: 'includedServices' | 'amenities', value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[] || []), value.trim()]
      }));
      setter('');
    }
  };

  const removeItem = (field: 'includedServices' | 'amenities', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      if (isEditing) {
        await onUpdateVilla(formData as Villa);
      } else {
        await onAddVilla(formData as Villa);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Submission failed. Check your Firebase permissions.");
    } finally {
      setIsSyncing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', location: '', pricePerNight: 0, bedrooms: 0, bathrooms: 0, capacity: 0,
      numRooms: 1, description: '', longDescription: '', 
      imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1200', 
      amenities: ['Wi-Fi', 'AC'], includedServices: ['Housekeeping'], isFeatured: false,
      rating: 5, ratingCount: 1, mealsAvailable: true, petFriendly: true,
      refundPolicy: 'Full refund if cancelled 48 hours before check-in.'
    });
    setIsEditing(false);
  };

  const handleEdit = (villa: Villa) => {
    setFormData(villa);
    setIsEditing(true);
    setActiveTab('inventory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLeadStatus = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const statuses: Lead['status'][] = ['new', 'contacted', 'booked', 'lost'];
    const nextIdx = (statuses.indexOf(lead.status) + 1) % statuses.length;
    await updateLeadStatus(id, statuses[nextIdx]);
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("Delete this lead from cloud?")) {
      await deleteLead(id);
    }
  };

  const handleQuickFeaturedToggle = async (villa: Villa) => {
    await onUpdateVilla({ ...villa, isFeatured: !villa.isFeatured });
  };

  const handleAddReview = () => {
    const name = prompt("Guest Name:");
    if (!name) return;
    const content = prompt("Review Content:");
    if (!content) return;
    const rating = parseInt(prompt("Rating (1-5):") || "5");
    
    const newReview: Testimonial = {
      id: `rev_${Date.now()}`,
      name,
      content,
      rating: isNaN(rating) ? 5 : Math.max(1, Math.min(5, rating)),
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`
    };
    
    setManagedReviews([newReview, ...managedReviews]);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade flex flex-col gap-12">
      
      {/* Dynamic Sub-Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-200 pb-8">
        <div className="flex flex-col">
           <h1 className="text-4xl font-black font-serif text-slate-900 tracking-tight">Admin Console</h1>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-1">Cloud Integrated Ecosystem</p>
        </div>
        <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
          {[
            { id: 'inventory', label: 'Inventory', icon: 'fa-hotel' },
            { id: 'inquiries', label: 'Leads', icon: 'fa-users-viewfinder' },
            { id: 'reviews', label: 'Reviews', icon: 'fa-star' },
            { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
            { id: 'settings', label: 'System', icon: 'fa-gear' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Property Editor Form */}
          <div className="lg:w-[500px] shrink-0">
            <div className="bg-white p-10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.06)] border border-gray-100 sticky top-28">
              <div className="flex items-center justify-between mb-8">
                 <div>
                   <h2 className="text-3xl font-bold font-serif text-slate-900">
                    {isEditing ? 'Modify Villa' : 'Add New Villa'}
                  </h2>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Resource Publication Form</p>
                 </div>
                {isSyncing && <i className="fa-solid fa-spinner fa-spin text-amber-500 text-xl"></i>}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 max-h-[65vh] overflow-y-auto no-scrollbar pr-2">
                
                {/* Section: Identity */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 border-b border-amber-50 pb-2">1. Identity & Location</h3>
                  <input type="text" required placeholder="Villa Name" className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 text-sm font-bold" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <input type="text" required placeholder="Location" className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 text-sm font-bold" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 border-b border-amber-50 pb-2">2. Visuals</h3>
                  <input type="url" required placeholder="Image URL" className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 text-xs font-bold font-mono" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 border-b border-amber-50 pb-2">3. Logistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" required placeholder="Price" className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-sm font-bold" value={formData.pricePerNight} onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })} />
                    <input type="number" required placeholder="Guests" className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-sm font-bold" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                  <button type="submit" disabled={isSyncing} className="flex-grow bg-slate-900 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-50">
                    {isEditing ? 'Cloud Sync Update' : 'Publish to Cloud'}
                  </button>
                  {isEditing && (
                    <button type="button" onClick={resetForm} className="px-6 border border-gray-200 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Discard</button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List Display */}
          <div className="flex-grow">
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 min-h-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                  <h2 className="text-4xl font-bold font-serif text-slate-900">Cloud Inventory</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database Active</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative group">
                    <i className="fa-solid fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input type="text" placeholder="Filter..." className="pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-bold text-slate-700 w-full md:w-64 focus:ring-2 focus:ring-amber-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={handleRestoreDemo} disabled={isSeeding} className="px-6 py-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center gap-3">
                    {isSeeding ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-down"></i>}
                    Sync Factory Defaults
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVillas.map(villa => (
                  <div key={villa.id} className="bg-gray-50 rounded-[2.5rem] border border-gray-100 p-6 flex flex-col group hover:bg-white hover:shadow-2xl transition-all duration-700">
                    <div className="relative h-48 rounded-[2rem] overflow-hidden mb-6 shadow-md">
                      <img src={villa.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                      <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleEdit(villa)} className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-xl">
                          <i className="fa-solid fa-pen-to-square text-sm"></i>
                        </button>
                        <button onClick={() => onDeleteVilla(villa.id)} className="w-10 h-10 rounded-xl bg-white text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-xl">
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </div>

                    <div className="flex-grow">
                      <h3 className="font-bold text-slate-900 text-xl font-serif mb-1 group-hover:text-amber-600 transition-colors">{villa.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <i className="fa-solid fa-location-arrow text-amber-500"></i> {villa.location}
                      </p>
                      
                      <div className="flex justify-between items-center py-4 border-t border-gray-100">
                        <div className="text-xl font-black text-slate-900">₹{villa.pricePerNight.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leads Tab */}
      {activeTab === 'inquiries' && (
        <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-xl animate-scale">
           <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold font-serif text-slate-900">Live Inquiries</h2>
                <p className="text-slate-400 text-sm mt-2">All leads are synced across admin instances globally.</p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                 Cloud Sync Active
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-gray-100">
                       <th className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Property</th>
                       <th className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Date/Time</th>
                       <th className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Details</th>
                       <th className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Status</th>
                       <th className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {leads.map(lead => (
                       <tr key={lead.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors group">
                          <td className="py-8 px-4 font-bold text-slate-900 text-sm">{lead.villaName}</td>
                          <td className="py-8 px-4 text-xs text-slate-500 font-medium">{lead.timestamp}</td>
                          <td className="py-8 px-4">
                             <div className="flex flex-col gap-1">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ${lead.source === 'WhatsApp' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                   {lead.source}
                                </span>
                             </div>
                          </td>
                          <td className="py-8 px-4">
                             <button 
                                onClick={() => handleToggleLeadStatus(lead.id)}
                                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                   lead.status === 'new' ? 'bg-amber-500 text-white border-amber-400' :
                                   lead.status === 'contacted' ? 'bg-blue-500 text-white border-blue-400' :
                                   lead.status === 'booked' ? 'bg-emerald-500 text-white border-emerald-400' :
                                   'bg-slate-300 text-slate-600 border-slate-200'
                                }`}
                             >
                                {lead.status}
                             </button>
                          </td>
                          <td className="py-8 px-4">
                             <div className="flex gap-2">
                                <button 
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"
                                >
                                   <i className="fa-solid fa-trash-can text-sm"></i>
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
