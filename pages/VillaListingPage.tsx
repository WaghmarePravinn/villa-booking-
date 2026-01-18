
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
    <div className="bg-[#fcfdfe] min-h-screen pb-32">
      {/* Catalog Header - Clean & Focused */}
      <header className="bg-white border-b border-slate-100 pt-12 pb-10 sm:pt-20 sm:pb-16 mb-12 sm:mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div className="text-left max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-[2px] bg-sky-400"></div>
               <span className="text-[10px] sm:text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">Inventory Registry</span>
            </div>
            <h1 className="text-4xl sm:text-7xl font-bold font-serif text-slate-900 leading-[1] tracking-tighter">
              {filters.location ? `${filters.location} Stays` : 'Elite Catalog'}
            </h1>
            <p className="text-slate-400 mt-6 font-medium text-base sm:text-xl leading-relaxed">Experience {filteredVillas.length} architectural masterpieces handpicked for excellence.</p>
          </div>
          
          {/* Controls Bar */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => setShowMobileFilters(true)} 
              className="lg:hidden flex-grow px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl"
            >
              <i className="fa-solid fa-sliders text-sky-400"></i> Refine
            </button>
            <div className="relative flex-none">
              <i className="fa-solid fa-arrow-down-wide-short absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <select 
                className="bg-slate-50 text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-slate-600 pl-12 pr-10 py-4 sm:py-5 rounded-2xl border border-slate-100 outline-none cursor-pointer appearance-none hover:bg-white transition-all shadow-sm"
                value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="popularity">Popularity</option>
                <option value="price-low">Price: Low - High</option>
                <option value="price-high">Price: High - Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 sm:gap-16">
          
          {/* Desktop Filter Sidebar - Sticky and Refined */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-50 shadow-sm sticky top-36 space-y-12 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 text-[12px] uppercase tracking-widest">Filters</h3>
                <button onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})} 
                  className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline transition-all">Clear</button>
              </div>

              <div className="space-y-10">
                {/* Location Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Location</label>
                  <div className="relative">
                    <i className="fa-solid fa-map-marker-alt absolute left-5 top-1/2 -translate-y-1/2 text-sky-400 text-sm"></i>
                    <select 
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none border border-slate-100 focus:bg-white focus:ring-4 focus:ring-sky-500/5 cursor-pointer appearance-none transition-all"
                      value={filters.location} 
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                    >
                      <option value="">All Destinations</option>
                      {dynamicLocations.map(loc => (loc && <option key={loc} value={loc}>{loc}</option>))}
                    </select>
                  </div>
                </div>

                {/* Price Range Slider */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Budget</label>
                    <span className="text-sm font-black text-slate-900">₹{filters.maxPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="5000" max="150000" step="5000" className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})} />
                </div>

                {/* BHK Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bedrooms</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 2, 4, 6].map(n => (
                      <button key={n} onClick={() => setFilters({...filters, bedrooms: n})}
                        className={`py-3.5 text-[10px] font-black rounded-xl transition-all border ${filters.bedrooms === n ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                        {n === 0 ? 'Any BHK' : `${n}+ BHK`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Villa Grid - High Performance & Better spacing */}
          <main className="lg:col-span-9 animate-reveal">
            {filteredVillas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-14">
                {filteredVillas.map((v) => (
                  <VillaCard key={v.id} villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-50 shadow-sm">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-slate-200 shadow-inner">
                  <i className="fa-solid fa-bed-pulse text-4xl"></i>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4 font-serif">No Stays Found</h3>
                <p className="text-slate-400 max-w-sm mx-auto font-medium text-lg leading-relaxed px-6">We couldn't find any sanctuaries matching your criteria. Try loosening your filters.</p>
                <button 
                  onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})} 
                  className="mt-12 px-12 py-5 bg-sky-50 text-sky-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-sky-100 transition-all active:scale-95"
                >
                  Clear All Selection
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-xl animate-fade" onClick={() => setShowMobileFilters(false)}>
           <div className="absolute right-0 top-0 bottom-0 w-[85%] bg-white rounded-l-[3rem] shadow-2xl p-10 animate-slide-left overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-16">
                 <h2 className="text-3xl font-bold font-serif text-slate-900">Refine Stay</h2>
                 <button onClick={() => setShowMobileFilters(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <i className="fa-solid fa-xmark text-lg"></i>
                 </button>
              </div>

              <div className="space-y-12 text-left">
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</label>
                  <select 
                    className="w-full p-6 bg-slate-50 rounded-2xl text-sm font-bold border border-slate-100"
                    value={filters.location} 
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  >
                    <option value="">All Regions</option>
                    {dynamicLocations.map(loc => (loc && <option key={loc} value={loc}>{loc}</option>))}
                  </select>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Price</label>
                    <span className="text-lg font-black text-slate-900">₹{filters.maxPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="5000" max="150000" step="5000" className="w-full h-2 bg-slate-100 rounded-lg appearance-none accent-sky-600"
                    value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})} />
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bedrooms</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[0, 2, 4, 6].map(n => (
                      <button key={n} onClick={() => setFilters({...filters, bedrooms: n})}
                        className={`py-5 text-[11px] font-black rounded-2xl transition-all border ${filters.bedrooms === n ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        {n === 0 ? 'Any BHK' : `${n}+ BHK`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowMobileFilters(false)} 
                className="w-full py-6 bg-sky-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] mt-20 shadow-2xl shadow-sky-600/20 active:scale-95 transition-all"
              >
                Apply Selection
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
