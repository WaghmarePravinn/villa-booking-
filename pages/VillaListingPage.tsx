
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Villa, VillaFilters, SiteSettings } from '../types';
import VillaCard from '../components/VillaCard';
import DateRangePicker from '../components/DateRangePicker';
import { HOTSPOT_LOCATIONS } from '../constants';

interface VillaListingPageProps {
  villas: Villa[];
  settings: SiteSettings;
  onViewDetails: (id: string) => void;
  initialFilters?: VillaFilters;
}

type SortOption = 'price-low' | 'price-high' | 'rating' | 'popularity';

const VillaListingPage: React.FC<VillaListingPageProps> = ({ villas, settings, onViewDetails, initialFilters }) => {
  const [filters, setFilters] = useState<VillaFilters>(initialFilters || {
    location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''
  });

  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (initialFilters) setFilters(initialFilters); }, [initialFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dynamicLocations = useMemo(() => {
    const locSet = new Set<string>();
    HOTSPOT_LOCATIONS.forEach(loc => locSet.add(loc.name));
    villas.forEach(v => {
      const city = v.location.split(',')[0].trim();
      if (city) locSet.add(city);
    });
    return Array.from(locSet).sort();
  }, [villas]);

  const filteredVillas = useMemo(() => {
    let res = villas.filter(v => {
      const matchLoc = !filters.location || v.location.toLowerCase().includes(filters.location.toLowerCase()) || v.name.toLowerCase().includes(filters.location.toLowerCase());
      const matchPrice = v.pricePerNight >= (filters.minPrice || 0) && v.pricePerNight <= (filters.maxPrice || 150000);
      const matchBed = filters.bedrooms === 0 || v.bedrooms >= filters.bedrooms;
      const matchGuest = !filters.guests || v.capacity >= filters.guests;
      return matchLoc && matchPrice && matchBed && matchGuest;
    });
    
    return res.sort((a, b) => {
      if (sortBy === 'price-low') return a.pricePerNight - b.pricePerNight;
      if (sortBy === 'price-high') return b.pricePerNight - a.pricePerNight;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.ratingCount - a.ratingCount;
    });
  }, [villas, filters, sortBy]);

  return (
    <div className="bg-[#fcfdfe] min-h-screen pb-24 lg:pb-32">
      {/* Catalog Header - Refined for Mobile Height */}
      <header className="bg-white border-b border-slate-100 pt-8 pb-8 sm:pt-20 sm:pb-16 mb-8 sm:mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center md:items-end gap-6 sm:gap-10 text-center md:text-left">
          <div className="max-w-2xl">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2 sm:mb-4">
               <div className="w-8 sm:w-10 h-[1.5px] sm:h-[2px] bg-sky-400"></div>
               <span className="text-[8px] sm:text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Registry</span>
            </div>
            <h1 className="text-3xl sm:text-7xl font-bold font-serif text-slate-900 leading-tight tracking-tighter">
              {filters.location ? `${filters.location} Stays` : 'Elite Catalog'}
            </h1>
            <p className="text-slate-400 mt-3 sm:mt-6 font-medium text-xs sm:text-xl opacity-80">Discovery of {filteredVillas.length} architectural masterpieces.</p>
          </div>
          
          {/* Controls Bar */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowMobileFilters(true)} 
              className="lg:hidden flex-grow px-5 py-3.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
            >
              <i className="fa-solid fa-sliders text-sky-400"></i> Filters
            </button>
            <div className="relative flex-none">
              <i className="fa-solid fa-arrow-down-wide-short absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
              <select 
                className="bg-slate-50 text-[9px] sm:text-[12px] font-black uppercase tracking-widest text-slate-600 pl-10 sm:pl-12 pr-8 sm:pr-10 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl border border-slate-100 outline-none cursor-pointer appearance-none hover:bg-white transition-all shadow-sm"
                value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="popularity">Popular</option>
                <option value="price-low">Price ↑</option>
                <option value="price-high">Price ↓</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 sm:gap-16">
          
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-50 shadow-sm sticky top-36 space-y-12 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 text-[12px] uppercase tracking-widest">Filters</h3>
                <button onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})} 
                  className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline transition-all">Reset</button>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</label>
                  <div className="relative">
                    <i className="fa-solid fa-map-marker-alt absolute left-5 top-1/2 -translate-y-1/2 text-sky-400 text-sm"></i>
                    <select 
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none border border-slate-100 focus:bg-white appearance-none transition-all"
                      value={filters.location} 
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                    >
                      <option value="">All Destinations</option>
                      {dynamicLocations.map(loc => (loc && <option key={loc} value={loc}>{loc}</option>))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Budget</label>
                    <span className="text-sm font-black text-slate-900">₹{filters.maxPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="5000" max="150000" step="5000" className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})} />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bedrooms</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 2, 4, 6].map(n => (
                      <button key={n} onClick={() => setFilters({...filters, bedrooms: n})}
                        className={`py-3.5 text-[10px] font-black rounded-xl transition-all border ${filters.bedrooms === n ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                        {n === 0 ? 'Any' : `${n}+ BHK`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Villa Grid */}
          <main className="lg:col-span-9 animate-reveal">
            {filteredVillas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-14">
                {filteredVillas.map((v) => (
                  <VillaCard key={v.id} villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 sm:py-32 bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-50 shadow-sm">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-50 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-8 sm:mb-10 text-slate-200 shadow-inner">
                  <i className="fa-solid fa-bed-pulse text-2xl sm:text-4xl"></i>
                </div>
                <h3 className="text-xl sm:text-3xl font-bold text-slate-900 mb-3 font-serif">Empty Sanctuary</h3>
                <p className="text-slate-400 max-w-sm mx-auto font-medium text-xs sm:text-lg leading-relaxed px-6 opacity-70">No sanctuaries match your refined criteria. Try a broader selection.</p>
                <button 
                  onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})} 
                  className="mt-10 px-10 py-4 bg-sky-50 text-sky-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-100 transition-all active:scale-95"
                >
                  Reset Registry
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-xl animate-fade" onClick={() => setShowMobileFilters(false)}>
           <div className="absolute right-0 top-0 bottom-0 w-[85%] bg-white rounded-l-[2rem] shadow-2xl p-8 animate-slide-left overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-12">
                 <h2 className="text-2xl font-bold font-serif text-slate-900">Refine catalog</h2>
                 <button onClick={() => setShowMobileFilters(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 active:bg-slate-200">
                    <i className="fa-solid fa-xmark"></i>
                 </button>
              </div>

              <div className="space-y-10 text-left">
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                  <select 
                    className="w-full p-4 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100 outline-none"
                    value={filters.location} 
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  >
                    <option value="">All Regions</option>
                    {dynamicLocations.map(loc => (loc && <option key={loc} value={loc}>{loc}</option>))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price Limit</label>
                    <span className="text-base font-black text-slate-900">₹{filters.maxPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="5000" max="150000" step="5000" className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none accent-sky-600"
                    value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})} />
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bedrooms</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 2, 4, 6].map(n => (
                      <button key={n} onClick={() => setFilters({...filters, bedrooms: n})}
                        className={`py-4 text-[9px] font-black rounded-xl transition-all border ${filters.bedrooms === n ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        {n === 0 ? 'Any BHK' : `${n}+ BHK`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowMobileFilters(false)} 
                className="w-full py-5 bg-sky-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] mt-16 shadow-2xl active:scale-95 transition-all"
              >
                Show Stays
              </button>
           </div>
        </div>
      )}

      <style>{`
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-left {
          animation: slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default VillaListingPage;
