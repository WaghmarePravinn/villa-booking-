
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Villa, VillaFilters, SiteSettings, Testimonial } from '../types';
import VillaCard from '../components/VillaCard';
import DateRangePicker from '../components/DateRangePicker';
import { BRAND_NAME, HOTSPOT_LOCATIONS } from '../constants';
import { subscribeToTestimonials } from '../services/testimonialService';

interface HomePageProps {
  villas: Villa[];
  settings: SiteSettings;
  onExplore: (filters?: VillaFilters) => void;
  onViewDetails: (id: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ villas, settings, onExplore, onViewDetails }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [liveBooking, setLiveBooking] = useState<{name: string, location: string} | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  const locationRef = useRef<HTMLDivElement>(null);

  const [searchFilters, setSearchFilters] = useState<VillaFilters>({
    location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 2, checkIn: '', checkOut: ''
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dynamicLocations = useMemo(() => {
    const locMap = new Map<string, number>();
    HOTSPOT_LOCATIONS.forEach(loc => locMap.set(loc.name, loc.count));
    villas.forEach(v => {
      const city = v.location.split(',')[0].trim();
      if (city) {
        const currentCount = locMap.get(city) || 0;
        locMap.set(city, currentCount + 1);
      }
    });
    return Array.from(locMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [villas]);

  useEffect(() => {
    const unsub = subscribeToTestimonials(setTestimonials);
    return () => unsub();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    setMousePos({ x: (clientX - window.innerWidth / 2) / 100, y: (clientY - window.innerHeight / 2) / 100 });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (villas.length === 0) return;
      const names = ["Kabir", "Sneha", "Rohan", "Anjali", "Priya", "Vikram"];
      const locs = dynamicLocations.length > 0 ? dynamicLocations.map(l => l.name) : ["Lonavala", "Goa"];
      setLiveBooking({ 
        name: names[Math.floor(Math.random() * names.length)], 
        location: locs[Math.floor(Math.random() * locs.length)] 
      });
      setTimeout(() => setLiveBooking(null), 5000);
    }, 15000);
    return () => clearInterval(interval);
  }, [dynamicLocations, villas]);

  const featuredVillas = villas.filter(v => v.isFeatured).slice(0, 3);

  const handleSearch = () => {
    onExplore(searchFilters);
  };

  return (
    <div className="space-y-6 sm:space-y-12 pb-20 sm:pb-32 relative bg-[#fcfdfe] overflow-visible" onMouseMove={handleMouseMove}>
      
      {/* Hero Section - Improved Mobile Proportions */}
      <section className="relative min-h-[50vh] sm:min-h-[80vh] flex flex-col items-center justify-center px-4 overflow-visible pt-10 sm:pt-16">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div 
            className="w-full h-full transition-transform duration-1000 ease-out"
            style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)` }}
          >
            <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="Luxury Villa" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/30 to-transparent"></div>
          </div>
        </div>

        <div className="relative z-10 text-center max-w-6xl mb-6 sm:mb-12 animate-fade">
          <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-bold font-serif mb-4 sm:mb-8 drop-shadow-2xl text-white tracking-tighter leading-[1.15] sm:leading-[0.9] px-2">
            Experience the Height of <br className="hidden sm:block" />
            <span className="text-sky-400 italic">Luxury & Comfort</span>.
          </h1>
          
          <p className="text-[11px] sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-medium leading-relaxed mb-8 sm:mb-12 px-6">
            Hand-picked private retreats curated for the discerning traveler. Your journey to an unforgettable sanctuary begins here.
          </p>
        </div>

        {/* Search Widget - Optimized for Mobile touch */}
        <div className="relative z-[100] w-full max-w-5xl animate-reveal [animation-delay:200ms] overflow-visible">
          <div className="bg-white rounded-[1.5rem] sm:rounded-full soft-shadow flex flex-col md:flex-row items-stretch md:items-center p-2 sm:p-2.5 border border-slate-50 shadow-2xl">
            
            {/* DESTINATION */}
            <div className="flex-1 px-4 sm:px-8 py-3 sm:py-5 relative group" ref={locationRef}>
              <label className="block text-[8px] sm:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1 text-left">Destination</label>
              <div className="flex items-center gap-3">
                 <i className="fa-solid fa-location-dot text-sky-200 text-sm"></i>
                 <input 
                  type="text" 
                  autoComplete="off"
                  placeholder="Where to?" 
                  className="w-full bg-transparent outline-none text-[12px] sm:text-xl font-black text-slate-700 placeholder:text-slate-200"
                  value={searchFilters.location} 
                  onFocus={() => setShowLocationSuggestions(true)}
                  onChange={(e) => {
                    setSearchFilters({...searchFilters, location: e.target.value});
                    setShowLocationSuggestions(true);
                  }}
                />
              </div>
              
              {/* Suggestion Dropdown - Fixed positioning for mobile */}
              {showLocationSuggestions && (
                <div className="absolute top-[calc(100%+1rem)] left-0 right-0 md:w-[450px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-[200] animate-popup">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Stays</p>
                    <button onClick={() => setShowLocationSuggestions(false)} className="text-slate-300">
                       <i className="fa-solid fa-circle-xmark text-lg"></i>
                    </button>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto no-scrollbar space-y-1">
                    {dynamicLocations.filter(loc => loc.name.toLowerCase().includes(searchFilters.location.toLowerCase())).map((loc) => (
                      <button key={loc.name} onClick={() => { setSearchFilters({...searchFilters, location: loc.name}); setShowLocationSuggestions(false); }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-sky-50 group flex items-center justify-between transition-all">
                        <span className="text-xs sm:text-base font-black text-slate-600 group-hover:text-sky-600">{loc.name}</span>
                        <span className="text-[8px] font-black text-slate-300 group-hover:text-sky-400">{loc.count} Stays</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:block w-[1px] h-10 bg-slate-100"></div>
            
            {/* DATES */}
            <div className="flex-1 px-4 sm:px-8 py-3 sm:py-5 cursor-pointer text-left group hover:bg-slate-50/50 transition-colors rounded-xl md:rounded-3xl"
              onClick={() => setShowPicker(true)}>
              <label className="block text-[8px] sm:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">Dates</label>
              <div className="flex items-center gap-4">
                <i className="fa-solid fa-calendar-day text-sky-200 text-sm"></i>
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] sm:text-lg font-black ${searchFilters.checkIn ? 'text-slate-800' : 'text-slate-200'}`}>
                    {searchFilters.checkIn ? searchFilters.checkIn.split('-').reverse().slice(0, 2).join('/') : 'Arr'}
                  </span>
                  <div className="w-4 h-[1px] bg-slate-200"></div>
                  <span className={`text-[12px] sm:text-lg font-black ${searchFilters.checkOut ? 'text-slate-800' : 'text-slate-200'}`}>
                    {searchFilters.checkOut ? searchFilters.checkOut.split('-').reverse().slice(0, 2).join('/') : 'Dep'}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:block w-[1px] h-10 bg-slate-100"></div>

            {/* SEARCH BUTTON */}
            <div className="p-1 sm:p-1.5 w-full md:w-auto">
              <button 
                onClick={handleSearch} 
                className="w-full md:w-auto px-10 sm:px-14 py-4 sm:py-5 rounded-xl sm:rounded-full font-black text-[10px] sm:text-[12px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 bg-sky-600 text-white shadow-xl active:scale-95 transition-all border-none"
              >
                FIND <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Stats Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
          {[
            { l: "Verified Listings", d: "Hand-verified luxury standards.", i: "fa-certificate" },
            { l: "24/7 Support", d: "Concierge desk for every need.", i: "fa-headset" },
            { l: "Secure Booking", d: "Protected transactions always.", i: "fa-shield-halved" }
          ].map((trust, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all text-center group">
              <div className="w-12 h-12 mx-auto mb-6 rounded-2xl bg-sky-50 flex items-center justify-center text-xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-inner">
                 <i className={`fa-solid ${trust.i}`}></i>
              </div>
              <h3 className="text-lg font-bold font-serif text-slate-900 mb-2">{trust.l}</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed opacity-80">{trust.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Destinations */}
      <section id="destinations" className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-16">
        <div className="mb-10 sm:mb-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-12 text-left">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-[2px] bg-sky-500"></div>
               <span className="text-sky-600 font-black uppercase tracking-[0.5em] text-[9px] sm:text-[11px]">Legacy Collection</span>
            </div>
            <h2 className="text-3xl sm:text-7xl font-bold font-serif text-slate-900 leading-[1] tracking-tighter">Popular Stays</h2>
          </div>
          <button onClick={() => onExplore()} className="flex items-center gap-4 text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-slate-900 border border-slate-200 px-8 py-4 rounded-xl sm:rounded-[3rem] bg-white soft-shadow hover:bg-slate-900 hover:text-white transition-all w-full sm:w-auto justify-center">
            VIEW ALL <i className="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-14">
          {featuredVillas.map(v => (
            <VillaCard key={v.id} villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
          ))}
        </div>
      </section>

      {showPicker && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-8 bg-slate-900/40 backdrop-blur-xl animate-reveal" onClick={() => setShowPicker(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl">
            <DateRangePicker startDate={searchFilters.checkIn || ''} endDate={searchFilters.checkOut || ''} onChange={(s, e) => setSearchFilters({...searchFilters, checkIn: s, checkOut: e})} onClose={() => setShowPicker(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
