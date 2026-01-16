
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

  const dynamicLocations = useMemo(() => {
    const locMap = new Map<string, number>();
    HOTSPOT_LOCATIONS.forEach(loc => locMap.set(loc.name, loc.count));
    villas.forEach(v => {
      const city = v.location.split(',')[0].trim();
      locMap.set(city, (locMap.get(city) || 0) + 1);
    });
    return Array.from(locMap.keys()).sort();
  }, [villas]);

  const filteredVillas = useMemo(() => {
    let res = villas.filter(v => {
      const matchLoc = filters.location === '' || v.location.toLowerCase().includes(filters.location.toLowerCase()) || v.name.toLowerCase().includes(filters.location.toLowerCase());
      const matchPrice = v.pricePerNight >= (filters.minPrice || 0) && v.pricePerNight <= (filters.maxPrice || 150000);
      const matchBed = filters.bedrooms === 0 || v.bedrooms >= filters.bedrooms;
      const matchGuest = filters.guests === 0 || v.capacity >= (filters.guests || 0);
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
    <div className="bg-[#fcfdfe] min-h-screen pb-20 sm:pb-32">
      <header className="bg-white border-b border-slate-100 py-8 sm:py-12 mb-10 sm:mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-10">
          <div className="text-left">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-6 sm:w-8 h-[1px] bg-sky-400"></div>
               <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Collection Registry</span>
            </div>
            <h1 className="text-3xl sm:text-7xl font-bold font-serif text-slate-900 leading-tight">
              {filters.location ? `${filters.location} Stays` : 'Handpicked Catalog'}
            </h1>
            <p className="text-slate-400 mt-2 sm:mt-6 font-medium text-sm sm:text-lg">Displaying {filteredVillas.length} architectural masterpieces.</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)} 
              className="lg:hidden flex-grow px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-sliders"></i> Filters
            </button>
            <select 
              className="bg-slate-50 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-600 px-4 sm:px-6 py-3 rounded-xl outline-none cursor-pointer flex-grow md:flex-grow-0"
              value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="popularity">Popular Choice</option>
              <option value="price-low">Economic to High</option>
              <option value="price-high">High to Economic</option>
              <option value="rating">Top Rated Only</option>
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 sm:gap-16">
          
          {/* Filters Sidebar */}
          <aside className={`${showMobileFilters ? 'block' : 'hidden'} lg:block lg:col-span-3 space-y-12`}>
            <div className="bg-white p-8 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-slate-50 soft-shadow sticky top-36">
              <div className="flex items-center justify-between mb-8 sm:mb-10">
                <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.3em]">Refinement</h3>
                <button onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})} 
                  className="text-[9px] font-black text-sky-600 uppercase tracking-widest hover:underline">Reset All</button>
              </div>

              <div className="space-y-8 sm:space-y-10 text-left">
                <div className="space-y-3">
                  <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Region Focus</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    value={filters.location} 
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  >
                    <option value="">All Locations</option>
                    {dynamicLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3" onClick={() => setShowDatePicker(true)}>
                  <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Stay Period</label>
                  <div className="w-full px-5 py-4 bg-slate-50 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors">
                    <span className="text-xs font-bold text-slate-700 truncate">{filters.checkIn ? `${filters.checkIn.slice(5)} ...` : 'Pick Dates'}</span>
                    <i className="fa-solid fa-calendar-days text-sky-400 text-[10px]"></i>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Max Nightly</label>
                    <span className="text-[10px] font-black text-slate-900">₹{filters.maxPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="5000" max="150000" step="5000" className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})} />
                </div>

                <div className="space-y-3">
                  <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Suite Count</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 2, 4, 6].map(n => (
                      <button key={n} onClick={() => setFilters({...filters, bedrooms: n})}
                        className={`py-2 text-[8px] font-black rounded-xl transition-all ${filters.bedrooms === n ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                        {n === 0 ? 'ALL' : `${n}+`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">
            {filteredVillas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12">
                {filteredVillas.map((v, i) => (
                  <div key={v.id} className="animate-reveal" style={{ animationDelay: `${(i % 6) * 100}ms` }}>
                    <VillaCard villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 sm:py-40 bg-white rounded-3xl sm:rounded-[4rem] border border-slate-50 soft-shadow">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 sm:mb-10 text-slate-200">
                  <i className="fa-solid fa-hotel text-2xl sm:text-4xl"></i>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-4 font-serif">Registry Empty</h3>
                <p className="text-slate-400 max-w-sm mx-auto font-medium text-sm sm:text-base">Try relaxing your filters to discover more hidden sanctuaries.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {showDatePicker && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-slate-900/10 backdrop-blur-md animate-reveal" onClick={() => setShowDatePicker(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl">
            <DateRangePicker startDate={filters.checkIn || ''} endDate={filters.checkOut || ''} onChange={(s, e) => setFilters({...filters, checkIn: s, checkOut: e})} onClose={() => setShowDatePicker(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VillaListingPage;
