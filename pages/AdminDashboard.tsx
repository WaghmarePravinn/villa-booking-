
import React, { useState } from 'react';
import { Villa } from '../types';
import { generateVillaDescription } from '../services/geminiService';
import { seedDatabase } from '../services/villaService';

interface AdminDashboardProps {
  villas: Villa[];
  onAddVilla: (villa: Villa) => Promise<void>;
  onUpdateVilla: (villa: Villa) => Promise<void>;
  onDeleteVilla: (id: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ villas, onAddVilla, onUpdateVilla, onDeleteVilla, onRefreshData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  
  const [newService, setNewService] = useState('');
  const [newAmenity, setNewAmenity] = useState('');
  
  const [formData, setFormData] = useState<Partial<Villa>>({
    name: '',
    location: '',
    pricePerNight: 0,
    bedrooms: 0,
    bathrooms: 0,
    capacity: 0,
    description: '',
    longDescription: '',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1200',
    amenities: ['Wi-Fi', 'AC', 'Private Pool'],
    includedServices: ['Housekeeping'],
    isFeatured: false,
    rating: 5,
    ratingCount: 1,
    numRooms: 1,
    mealsAvailable: true,
    petFriendly: true,
    refundPolicy: 'Full refund if cancelled 48 hours before check-in.'
  });

  const handleSuggestDescription = async () => {
    if (!formData.name || !formData.location) {
      alert("Please enter a name and location first!");
      return;
    }
    setIsAILoading(true);
    const description = await generateVillaDescription(
      formData.name || '', 
      formData.location || '', 
      [...(formData.amenities || []), ...(formData.includedServices || [])]
    );
    setFormData(prev => ({ 
      ...prev, 
      description, 
      longDescription: description + " Offering total privacy and unmatched style, this home is the crown jewel of " + formData.location + "." 
    }));
    setIsAILoading(false);
  };

  const handleRestoreDemo = async () => {
    if (window.confirm("This will delete all current villas and restore the original demo catalog. Continue?")) {
      setIsSeeding(true);
      await seedDatabase();
      await onRefreshData();
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
    } finally {
      setIsSyncing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', location: '', pricePerNight: 0, bedrooms: 0, bathrooms: 0, capacity: 0,
      description: '', longDescription: '', imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1200', 
      amenities: ['Wi-Fi', 'AC'], includedServices: ['Housekeeping'], isFeatured: false,
      rating: 5, ratingCount: 1, numRooms: 1, mealsAvailable: true, petFriendly: true,
      refundPolicy: 'Full refund if cancelled 48 hours before check-in.'
    });
    setIsEditing(false);
  };

  const handleEdit = (villa: Villa) => {
    setFormData(villa);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-2">Cloud Command</h1>
          <p className="text-slate-500 font-medium">Manage your global property portfolio in real-time.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleRestoreDemo}
            disabled={isSeeding}
            className="px-6 py-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 font-bold text-xs uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center gap-2"
          >
            {isSeeding ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-rotate"></i>}
            Restore Demo Catalog
          </button>
          
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <i className="fa-solid fa-house-chimney"></i>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inventory</p>
              <p className="text-lg font-black text-slate-900 leading-none">{villas.length} Stays</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Editor Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 sticky top-28 max-h-[80vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-bold font-serif text-slate-900">
                {isEditing ? 'Modify Property' : 'List New Property'}
              </h2>
              {isSyncing && (
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Property Identity</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Villa Serenity"
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div className="relative">
                  <i className="fa-solid fa-location-dot absolute left-5 top-1/2 -translate-y-1/2 text-amber-500/50 text-xs"></i>
                  <input 
                    type="text" 
                    required
                    placeholder="Location (City, State)"
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Guests</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Bedrooms</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Bathrooms</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="featured" className="text-xs font-black text-slate-900 uppercase">Signature Featured</label>
                  <input 
                    type="checkbox" 
                    id="featured"
                    className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500 border-none bg-white shadow-sm"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="pets" className="text-xs font-black text-slate-900 uppercase">Pet Friendly</label>
                  <input 
                    type="checkbox" 
                    id="pets"
                    className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500 border-none bg-white shadow-sm"
                    checked={formData.petFriendly}
                    onChange={(e) => setFormData({ ...formData, petFriendly: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="meals" className="text-xs font-black text-slate-900 uppercase">Meals Provided</label>
                  <input 
                    type="checkbox" 
                    id="meals"
                    className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500 border-none bg-white shadow-sm"
                    checked={formData.mealsAvailable}
                    onChange={(e) => setFormData({ ...formData, mealsAvailable: e.target.checked })}
                  />
                </div>
              </div>

              {/* Amenities Manager */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amenities Checklist</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-grow px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 text-sm font-bold text-slate-700"
                    placeholder="e.g. Wi-Fi"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('amenities', newAmenity, setNewAmenity))}
                  />
                  <button 
                    type="button"
                    onClick={() => addItem('amenities', newAmenity, setNewAmenity)}
                    className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors"
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.amenities || []).map((item, i) => (
                    <span key={i} className="flex items-center gap-2 bg-white text-slate-600 text-[10px] font-black px-3 py-2 rounded-xl border border-gray-100 uppercase tracking-wider">
                      {item}
                      <button type="button" onClick={() => removeItem('amenities', i)} className="text-red-400 hover:text-red-600">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Services Manager */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Included Privileges</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-grow px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 text-sm font-bold text-slate-700"
                    placeholder="e.g. Private Butler"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('includedServices', newService, setNewService))}
                  />
                  <button 
                    type="button"
                    onClick={() => addItem('includedServices', newService, setNewService)}
                    className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors"
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.includedServices || []).map((service, i) => (
                    <span key={i} className="flex items-center gap-2 bg-amber-50 text-amber-700 text-[10px] font-black px-3 py-2 rounded-xl border border-amber-100 uppercase tracking-wider">
                      {service}
                      <button type="button" onClick={() => removeItem('includedServices', i)} className="text-amber-400 hover:text-amber-600">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Luxury Narratives</label>
                  <button 
                    type="button"
                    onClick={handleSuggestDescription}
                    disabled={isAILoading}
                    className="text-[10px] font-black text-amber-600 hover:text-amber-700 disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest"
                  >
                    {isAILoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                    AI Generate
                  </button>
                </div>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium text-slate-600 leading-relaxed"
                  placeholder="Capture the property's soul..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  disabled={isSyncing}
                  className="flex-grow bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSyncing ? <i className="fa-solid fa-cloud-arrow-up animate-bounce"></i> : <i className="fa-solid fa-check"></i>}
                  {isEditing ? 'Sync Changes' : 'Publish Property'}
                </button>
                {isEditing && (
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="px-8 border border-gray-200 hover:bg-gray-50 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Inventory Management */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-serif text-slate-900">Live Inventory</h2>
            <div className="flex items-center gap-2 text-emerald-600">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-black uppercase tracking-widest">Global Sync Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {villas.map(villa => (
              <div key={villa.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col gap-6 group hover:shadow-[0_30px_60px_rgba(0,0,0,0.05)] transition-all animate-scale">
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <img src={villa.imageUrl} alt={villa.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {villa.isFeatured && (
                      <span className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-lg">Featured</span>
                    )}
                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">
                      ₹{villa.pricePerNight.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="font-bold text-slate-900 text-lg">{villa.name}</h3>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(villa)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pencil text-sm"></i>
                        </button>
                        <button 
                          onClick={() => onDeleteVilla(villa.id)}
                          className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all"
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                     </div>
                  </div>
                  <p className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1">
                    <i className="fa-solid fa-location-dot text-amber-500"></i> {villa.location}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 bg-slate-50 rounded-xl flex items-center gap-2">
                      <i className="fa-solid fa-bed text-[10px] text-slate-300"></i>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{villa.bedrooms} Br</span>
                    </div>
                    <div className="px-3 py-1.5 bg-slate-50 rounded-xl flex items-center gap-2">
                      <i className="fa-solid fa-users text-[10px] text-slate-300"></i>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{villa.capacity} Guests</span>
                    </div>
                    {villa.petFriendly && (
                      <div className="px-3 py-1.5 bg-emerald-50 rounded-xl flex items-center gap-2">
                        <i className="fa-solid fa-paw text-[10px] text-emerald-400"></i>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pets OK</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {villas.length === 0 && (
            <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <i className="fa-solid fa-cloud-arrow-down text-4xl text-slate-300 mb-6 block"></i>
               <h3 className="text-2xl font-bold font-serif text-slate-900 mb-2">Database Empty</h3>
               <p className="text-slate-500 max-w-sm mx-auto mb-8">No properties found in the current region. Restore the demo catalog to get started.</p>
               <button 
                onClick={handleRestoreDemo}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl"
               >
                 Restore Demo Database
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
