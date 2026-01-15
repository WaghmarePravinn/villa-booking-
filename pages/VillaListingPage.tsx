
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
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (initialFilters) setFilters(initialFilters); }, [initialFilters]);

  const filteredVillas = useMemo(() => {
    let res = villas.filter(v => {
      const matchLoc = filters.location === '' || v.location.toLowerCase().includes(filters.location.toLowerCase()) || v.name.toLowerCase().includes(filters.location.toLowerCase());
      const matchPrice = v.pricePerNight >= (filters.minPrice || 0) && v.pricePerNight <= (filters.maxPrice || 150000);
      const matchBed = filters.bedrooms === 0 || v.bedrooms >= filters.bedrooms;
      const matchGuest = filters.guests === 0 || v.capacity >= filters.guests;
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
      <header className="bg-white border-b border-slate-100 py-12 mb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-end gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-[1px] bg-sky-400"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Collection Registry</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-serif text-slate-900 leading-none">
              {filters.location ? `${filters.location} Stays` : 'Curated Catalog'}
            </h1>
            <p className="text-slate-400 mt-6 font-medium text-lg">Displaying {filteredVillas.length} architectural masterpieces across India.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
            <select 
              className="bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-600 px-6 py-3 outline-none cursor-pointer"
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

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-16">
          
          <aside className="lg:col-span-3 space-y-12">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-50 soft-shadow sticky top-36">
              <div className="flex items-center justify-between mb-10">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.3em]">Refinement</h3>
                <button onClick={() => setFilters({location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 0, checkIn: '', checkOut: ''})} 
                  className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:underline">Reset</button>
              </div>

              <div className="space-y-10">
                <div className="space-y-4" ref={locationSearchRef}>
                  <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Region Focus</label>
                  <input type="text" placeholder="Explore city..." className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
                    value={filters.location} onFocus={() => setShowLocationSuggestions(true)} onChange={(e) => setFilters({...filters, location: e.target.value})} />
                </div>

                <div className="space-y-4" onClick={() => setShowDatePicker(true)}>
                  <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Availability</label>
                  <div className="w-full px-6 py-4 bg-slate-50 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors">
                    <span className="text-xs font-bold text-slate-700">{filters.checkIn ? `${filters.checkIn} ...` : 'Select Stay Period'}</span>
                    <i className="fa-solid fa-calendar-days text-sky-400 text-xs"></i>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Nightly Ceiling</label>
                    <span className="text-xs font-black text-slate-900">₹{filters.maxPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="5000" max="150000" step="5000" className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})} />
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Suite Count</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 2, 4, 6].map(n => (
                      <button key={n} onClick={() => setFilters({...filters, bedrooms: n})}
                        className={`py-3 text-[10px] font-black rounded-xl transition-all ${filters.bedrooms === n ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {filteredVillas.map((v, i) => (
                  <div key={v.id} className="animate-reveal" style={{ animationDelay: `${(i % 6) * 100}ms` }}>
                    <VillaCard villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-white rounded-[4rem] border border-slate-50 soft-shadow">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10 text-slate-200">
                  <i className="fa-solid fa-hotel text-4xl"></i>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4 font-serif">Sanctuary Not Found</h3>
                <p className="text-slate-400 max-w-sm mx-auto font-medium">Try relaxing your refinement filters to discover more possibilities.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {showDatePicker && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-md animate-reveal" onClick={() => setShowDatePicker(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl">
            <DateRangePicker startDate={filters.checkIn || ''} endDate={filters.checkOut || ''} onChange={(s, e) => setFilters({...filters, checkIn: s, checkOut: e})} onClose={() => setShowDatePicker(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VillaListingPage;
