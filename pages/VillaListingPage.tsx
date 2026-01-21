
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => { if (initialFilters) setFilters(initialFilters); }, [initialFilters]);

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
      {/* Search Header - Streamlined for smaller screens */}
      <header className="bg-white border-b border-slate-100 pt-10 pb-10 sm:pt-20 sm:pb-16 mb-8 sm:mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center md:items-end gap-6 sm:gap-10 text-center md:text-left">
          <div className="max-w-2xl">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3 sm:mb-4">
               <div className="w-8 sm:w-10 h-[2px] bg-sky-400"></div>
               <span className="text-[10px] sm:text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Stays Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-7xl font-bold font-serif text-slate-900 leading-tight tracking-tighter">
              {filters.location ? `${filters.location} Collection` : 'Elite Portfolio'}
            </h1>
            <p className="text-slate-400 mt-3 sm:mt-6 font-medium text-sm sm:text-xl opacity-80 leading-relaxed">
              Discovering {filteredVillas.length} architectural masterpieces handpicked for your escape.
            </p>
          </div>
          
          {/* Controls - Mobile friendly triggers */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowMobileFilters(true)} 
              className="lg:hidden flex-grow px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
            >
              <i className="fa-solid fa-sliders text-sky-400"></i> Filters
            </button>
            <div className="relative flex-none">
              <i className="fa-solid fa-arrow-down-wide-short absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
              <select 
                className="bg-slate-50 text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-slate-600 pl-12 pr-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl border border-slate-100 outline-none cursor-pointer appearance-none hover:bg-white transition-all shadow-sm"
                value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="popularity">Sort: Best</option>
                <option value="price-low">Price: Low</option>
                <option value="price-high">Price: High</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 sm:gap-16">
          
          {/* Desktop Filtering Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-50 shadow-sm sticky top-40 space-y-12 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 text-[12px] uppercase tracking-widest">Filters</h3>
                <button onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})} 
                  className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline transition-all">Clear All</button>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</label>
                  <div className="relative">
                    <i className="fa-solid fa-map-pin absolute left-5 top-1/2 -translate-y-1/2 text-sky-400 text-sm"></i>
                    <select 
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none border border-slate-100 focus:bg-white appearance-none transition-all shadow-inner"
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Size</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 2, 4, 6].map(n => (
                      <button key={n} onClick={() => setFilters({...filters, bedrooms: n})}
                        className={`py-4 text-[10px] font-black rounded-xl transition-all border ${filters.bedrooms === n ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                        {n === 0 ? 'Any' : `${n}+ BHK`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Catalog Grid */}
          <main className="lg:col-span-9 animate-reveal">
            {filteredVillas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-14">
                {filteredVillas.map((v) => (
                  <VillaCard key={v.id} villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 sm:py-32 bg-white rounded-[2.5rem] sm:rounded-[3rem] border border-slate-50 shadow-sm px-6">
                <div className="w-20 h-20 sm:w-28 sm:h-28 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-slate-200 shadow-inner">
                  <i className="fa-solid fa-house-circle-exclamation text-3xl sm:text-4xl"></i>
                </div>
                <h3 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4 font-serif">No Stays Found</h3>
                <p className="text-slate-400 max-w-sm mx-auto font-medium text-sm sm:text-lg leading-relaxed opacity-70">We couldn't find any sanctuaries matching your specific filters. Try expanding your search criteria.</p>
                <button 
                  onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})} 
                  className="mt-12 px-10 py-5 bg-sky-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-sky-600/20 active:scale-95 transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xl animate-fade" onClick={() => setShowMobileFilters(false)}>
           <div className="absolute right-0 top-0 bottom-0 w-[88%] bg-white rounded-l-[2.5rem] shadow-2xl p-8 sm:p-12 animate-slide-left overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-16">
                 <div>
                    <h2 className="text-2xl font-bold font-serif text-slate-900">Refine catalog</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Adjust your parameters</p>
                 </div>
                 <button onClick={() => setShowMobileFilters(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:bg-slate-200">
                    <i className="fa-solid fa-xmark text-lg"></i>
                 </button>
              </div>

              <div className="space-y-12 text-left">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location</label>
                  <div className="relative">
                    <i className="fa-solid fa-map-location-dot absolute left-5 top-1/2 -translate-y-1/2 text-sky-400"></i>
                    <select 
                      className="w-full p-5 pl-12 bg-slate-50 rounded-2xl text-sm font-bold border border-slate-100 outline-none appearance-none shadow-inner"
                      value={filters.location} 
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                    >
                      <option value="">All Regions</option>
                      {dynamicLocations.map(loc => (loc && <option key={loc} value={loc}>{loc}</option>))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nightly Budget</label>
                    <span className="text-lg font-black text-slate-900">₹{filters.maxPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="5000" max="150000" step="5000" className="w-full h-2 bg-slate-100 rounded-lg appearance-none accent-sky-600"
                    value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})} />
                  <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                    <span>Min: ₹5k</span>
                    <span>Max: ₹1.5L</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bedrooms</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[0, 2, 4, 6].map(n => (
                      <button key={n} onClick={() => setFilters({...filters, bedrooms: n})}
                        className={`py-5 text-[10px] font-black rounded-2xl transition-all border ${filters.bedrooms === n ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        {n === 0 ? 'Any BHK' : `${n}+ BHK`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-20 pt-10 border-t border-slate-50">
                <button 
                  onClick={() => setShowMobileFilters(false)} 
                  className="w-full py-6 bg-sky-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-sky-600/20 active:scale-95 transition-all"
                >
                  Show Results
                </button>
                <button 
                   onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})}
                   className="w-full mt-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
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
