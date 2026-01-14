
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
    location: '',
    minPrice: 0,
    maxPrice: 150000,
    bedrooms: 0,
    guests: 0,
    checkIn: '',
    checkOut: ''
  });

  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  const locationSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationSearchRef.current && !locationSearchRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLocations = useMemo(() => {
    const query = filters.location.toLowerCase().trim();
    if (!query) return HOTSPOT_LOCATIONS;
    return HOTSPOT_LOCATIONS.filter(loc => loc.name.toLowerCase().includes(query));
  }, [filters.location]);

  const filteredAndSortedVillas = useMemo(() => {
    let result = villas.filter(villa => {
      const matchLocation = filters.location === '' || 
        villa.location.toLowerCase().includes(filters.location.toLowerCase()) ||
        villa.name.toLowerCase().includes(filters.location.toLowerCase());
      
      const matchPrice = villa.pricePerNight >= (filters.minPrice || 0) && 
        villa.pricePerNight <= (filters.maxPrice || 150000);
      
      const matchBedrooms = filters.bedrooms === 0 || villa.bedrooms >= filters.bedrooms;
      const matchGuests = !filters.guests || filters.guests === 0 || villa.capacity >= filters.guests;
      
      return matchLocation && matchPrice && matchBedrooms && matchGuests;
    });

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case 'price-high':
        result.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity':
      default:
        result.sort((a, b) => b.ratingCount - a.ratingCount);
        break;
    }

    return result;
  }, [villas, filters, sortBy]);

  const stayDuration = useMemo(() => {
    if (filters.checkIn && filters.checkOut) {
      const [y1, m1, d1] = filters.checkIn.split('-').map(Number);
      const [y2, m2, d2] = filters.checkOut.split('-').map(Number);
      const start = new Date(y1, m1 - 1, d1);
      const end = new Date(y2, m2 - 1, d2);
      const diff = end.getTime() - start.getTime();
      const nights = Math.round(diff / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 0;
    }
    return 0;
  }, [filters.checkIn, filters.checkOut]);

  const clearFilters = () => {
    setFilters({
      location: '',
      minPrice: 0,
      maxPrice: 150000,
      bedrooms: 0,
      guests: 0,
      checkIn: '',
      checkOut: ''
    });
    setSortBy('popularity');
  };

  const formatDateString = (dateStr: string | undefined) => {
    if (!dateStr) return 'Add date';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <nav className="flex mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <button onClick={() => window.location.reload()} className="hover:text-amber-600 cursor-pointer">Home</button>
                <span className="mx-2">/</span>
                <span className="text-slate-900">Villa Collection</span>
              </nav>
              <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-900">
                {filters.location ? `Stays in ${filters.location}` : 'All Luxury Stays'}
              </h1>
              <p className="text-slate-500 mt-1">
                {filteredAndSortedVillas.length} exclusive properties found
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 pr-10 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="popularity">Sort by Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none"></i>
              </div>
              
              <button 
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className={`md:hidden p-2.5 border border-gray-200 rounded-xl ${isFilterVisible ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
              >
                <i className="fa-solid fa-sliders"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          <aside className={`lg:w-80 space-y-8 transition-all ${isFilterVisible ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-8 sticky top-24">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Refine Search</h3>
                <button 
                  onClick={clearFilters}
                  className="text-xs font-bold text-amber-600 hover:underline"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-3 relative" ref={locationSearchRef}>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</label>
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                  <input 
                    type="text"
                    placeholder="Where to?"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 text-sm font-bold text-slate-700 placeholder:text-gray-300"
                    value={filters.location}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  />
                </div>
                
                {showLocationSuggestions && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-fade-in-up">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-2">Popular Hotspots</p>
                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                      {filteredLocations.map(loc => (
                        <button
                          key={loc.name}
                          onClick={() => {
                            setFilters({...filters, location: loc.name});
                            setShowLocationSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-all"
                        >
                          <i className="fa-solid fa-location-dot text-amber-500/40"></i>
                          {loc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                  Stay Period
                  {stayDuration > 0 && <span className="text-amber-600 font-black">{stayDuration} Nights</span>}
                </label>
                <div 
                  className={`w-full px-4 py-3 rounded-2xl cursor-pointer flex justify-between items-center group transition-colors ${showDatePicker ? 'bg-amber-50' : 'bg-gray-50 hover:bg-amber-50'}`}
                  onClick={() => setShowDatePicker(true)}
                >
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Check-in - Check-out</span>
                    <span className="text-xs font-bold text-slate-700">
                      {filters.checkIn ? `${formatDateString(filters.checkIn)} - ${formatDateString(filters.checkOut)}` : 'Select dates'}
                    </span>
                  </div>
                  <i className="fa-solid fa-calendar-days text-amber-500 text-sm opacity-50 group-hover:opacity-100"></i>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget per night</label>
                  <span className="text-xs font-black text-slate-900">₹{filters.maxPrice.toLocaleString()}</span>
                </div>
                <input 
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Suites Required</label>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setFilters({...filters, bedrooms: num})}
                      className={`py-2 text-[10px] font-black rounded-xl transition-all ${filters.bedrooms === num ? 'bg-slate-900 text-white shadow-md' : 'bg-gray-50 text-slate-400 hover:bg-gray-100'}`}
                    >
                      {num === 0 ? 'Any' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Group Size</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none appearance-none cursor-pointer"
                    value={filters.guests}
                    onChange={(e) => setFilters({...filters, guests: Number(e.target.value)})}
                  >
                    <option value={0}>Any occupancy</option>
                    {[2, 4, 6, 8, 10, 12, 15, 20].map(n => (
                      <option key={n} value={n}>{n}+ Guests</option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-grow">
            {filteredAndSortedVillas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredAndSortedVillas.map((villa, idx) => (
                  <div 
                    key={villa.id} 
                    className="animate-fade-in-up" 
                    style={{ 
                      animationDelay: `${(idx % 6) * 100}ms`, 
                      opacity: 0, 
                      animationFillMode: 'forwards' 
                    }}
                  >
                    <VillaCard 
                      villa={villa} 
                      whatsappNumber={settings.whatsappNumber}
                      onViewDetails={onViewDetails}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-2 font-serif">Search Returned Zero</h3>
                <p className="text-slate-500 max-w-sm mx-auto px-6 font-medium">Try relaxing your budget or choosing a different location.</p>
                <button 
                  onClick={clearFilters}
                  className="mt-8 px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all text-xs uppercase tracking-widest"
                >
                  Reset Parameters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* FIXED DATE PICKER OVERLAY */}
      {showDatePicker && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setShowDatePicker(false)}
        >
          <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
             <button 
              onClick={() => setShowDatePicker(false)}
              className="absolute -top-12 right-0 text-white hover:text-amber-400 transition-colors flex items-center gap-2 font-black uppercase text-xs tracking-widest"
            >
              Close <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            <DateRangePicker 
              startDate={filters.checkIn || ''} 
              endDate={filters.checkOut || ''} 
              onChange={(start, end) => setFilters({...filters, checkIn: start, checkOut: end})}
              onClose={() => setShowDatePicker(false)}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default VillaListingPage;
