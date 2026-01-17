
import React, { useState, useMemo, useEffect } from 'react';
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

  useEffect(() => { if (initialFilters) setFilters(initialFilters); }, [initialFilters]);

  useEffect(() => {
    if (showDatePicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showDatePicker]);

  // Sync locations from live data
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
    <div className="bg-[#fcfdfe] min-h-screen pb-24">
      <header className="bg-white border-b border-slate-100 py-8 sm:py-16 mb-8 sm:mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-10">
          <div className="text-left max-w-xl">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-6 sm:w-10 h-[2px] bg-sky-400"></div>
               <span className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">The Registry</span>
            </div>
            <h1 className="text-3xl sm:text-6xl font-bold font-serif text-slate-900 leading-tight">
              {filters.location ? `${filters.location} Catalog` : 'Explore the Collection'}
            </h1>
            <p className="text-slate-400 mt-3 sm:mt-6 font-medium text-sm sm:text-lg leading-relaxed">Discover {filteredVillas.length} architectural masterpieces handpicked for your legacy stay.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)} 
              className="lg:hidden flex-grow px-5 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg"
            >
              <i className="fa-solid fa-sliders"></i> Filters
            </button>
            <div className="relative flex-grow md:flex-grow-0">
              <i className="fa-solid fa-sort absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
              <select 
                className="w-full bg-slate-50 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-600 pl-10 pr-6 py-3.5 rounded-xl border border-slate-100 outline-none cursor-pointer appearance-none"
                value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="popularity">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
          
          {/* Filters Sidebar */}
          <aside className={`${showMobileFilters ? 'fixed inset-0 z-[150] bg-white p-8' : 'hidden'} lg:block lg:col-span-3 lg:static`}>
            <div className="flex items-center justify-between lg:hidden mb-10">
              <h2 className="text-2xl font-bold font-serif">Refine Results</h2>
              <button onClick={() => setShowMobileFilters(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                 <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="bg-white lg:p-10 rounded-3xl lg:border lg:border-slate-50 lg:soft-shadow lg:sticky lg:top-36 space-y-10 text-left">
              <div className="hidden lg:flex items-center justify-between mb-2">
                <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-[0.3em]">Refinement</h3>
                <button onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})} 
                  className="text-[9px] font-black text-sky-600 uppercase tracking-widest hover:underline">Reset</button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Location</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none border border-slate-100 focus:ring-2 focus:ring-sky-500 cursor-pointer appearance-none"
                    value={filters.location} 
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  >
                    <option value="">All Destinations</option>
                    {dynamicLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3" onClick={() => setShowDatePicker(true)}>
                  <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Availability</label>
                  <div className="w-full px-5 py-4 bg-slate-50 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100">
                    <span className="text-xs font-bold text-slate-700 truncate">{filters.checkIn ? `${filters.checkIn.slice(5)} ...` : 'Pick Dates'}</span>
                    <i className="fa-solid fa-calendar-days text-sky-400"></i>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Budget Cap</label>
                    <span className="text-[11px] font-black text-slate-900">₹{filters.maxPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="5000" max="150000" step="5000" className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})} />
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Bedrooms</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 2, 4, 6].map(n => (
                      <button key={n} onClick={() => setFilters({...filters, bedrooms: n})}
                        className={`py-3 text-[10px] font-black rounded-xl transition-all ${filters.bedrooms === n ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'}`}>
                        {n === 0 ? 'ALL' : `${n}+`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {showMobileFilters && (
                <button 
                  onClick={() => setShowMobileFilters(false)} 
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest mt-10"
                >
                  Apply Filters
                </button>
              )}
            </div>
          </aside>

          <main className="lg:col-span-9 animate-fade">
            {filteredVillas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
                {filteredVillas.map((v, i) => (
                  <div key={v.id} className="h-full">
                    <VillaCard villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 sm:py-40 bg-white rounded-3xl sm:rounded-[4rem] border border-slate-50 soft-shadow">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 sm:mb-10 text-slate-200 shadow-inner">
                  <i className="fa-solid fa-hotel text-2xl sm:text-4xl"></i>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-4 font-serif">No Results</h3>
                <p className="text-slate-400 max-w-xs mx-auto font-medium text-sm sm:text-base">Try adjusting your destination or budget to find your sanctuary.</p>
                <button 
                  onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})} 
                  className="mt-10 px-8 py-4 bg-sky-50 text-sky-600 rounded-xl font-black text-[10px] uppercase tracking-widest"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* REFACTORED DATE PICKER MODAL - STRICTLY CENTERED VIEWPORT OVERLAY */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[2500] bg-slate-900/40 backdrop-blur-xl animate-fade" onClick={() => setShowDatePicker(false)}>
          <div 
            onClick={e => e.stopPropagation()} 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex items-center justify-center p-4 z-[2501] animate-scale"
          >
            <DateRangePicker 
              startDate={filters.checkIn || ''} 
              endDate={filters.checkOut || ''} 
              onChange={(s, e) => setFilters({...filters, checkIn: s, checkOut: e})} 
              onClose={() => setShowDatePicker(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VillaListingPage;
