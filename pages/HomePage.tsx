
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

  const featuredVillas = villas.filter(v => v.isFeatured).slice(0, 6);

  const handleSearch = () => {
    onExplore(searchFilters);
  };

  return (
    <div className="space-y-12 sm:space-y-24 pb-20 sm:pb-32 relative bg-[#fcfdfe] overflow-visible" onMouseMove={handleMouseMove}>
      
      {/* Live Notification */}
      {liveBooking && (
        <div className="fixed bottom-28 sm:bottom-10 left-4 sm:left-10 z-[1000] animate-reveal">
          <div className="bg-white/95 backdrop-blur-2xl border border-slate-100 p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] soft-shadow flex items-center gap-3 sm:gap-5 border-l-4 border-l-emerald-500">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner shrink-0">
              <i className="fa-solid fa-circle-check text-xs sm:text-base"></i>
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] sm:text-xs font-black text-slate-900 leading-none truncate">{liveBooking.name} recently stayed</p>
              <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 truncate">Sanctuary: {liveBooking.location}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Optimized for high visibility of Search Hub */}
      <section className="relative min-h-[75vh] sm:min-h-[85vh] flex flex-col items-center justify-center px-4 overflow-visible pt-12 sm:pt-20">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div 
            className="w-full h-full transition-transform duration-1000 ease-out opacity-20 sm:opacity-10"
            style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.05)` }}
          >
            <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-gradient-to-b from-sky-50/40 via-transparent to-sky-50/40"></div>
          </div>
        </div>

        <div className="relative z-10 text-center max-w-6xl mb-8 sm:mb-10 animate-fade">
          <div className="mb-4 sm:mb-6 flex items-center justify-center gap-4 sm:gap-6">
             <div className="h-[1px] w-6 sm:w-12 bg-slate-200"></div>
             <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-slate-400 text-center">{settings.promoText}</span>
             <div className="h-[1px] w-6 sm:w-12 bg-slate-200"></div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[9rem] font-bold font-serif mb-4 sm:mb-6 drop-shadow-2xl uppercase tracking-tighter text-theme-shimmer leading-[1.1] sm:leading-[0.85] flex flex-col items-center">
            {BRAND_NAME.split(' ')[0]} 
            <span className="text-sm sm:text-2xl md:text-3xl lg:text-4xl tracking-[0.2em] sm:tracking-[0.3em] font-light italic text-slate-300 normal-case mt-1 sm:mt-2">PRIVATE SANCTUARIES</span>
          </h1>
          
          <p className="text-xs sm:text-lg md:text-xl mb-6 sm:mb-10 text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Experience the pinnacle of Indian luxury. Hand-picked retreats curated for the discerning traveler.
          </p>
        </div>

        {/* Re-designed Search Hub - Elevated and styled based on requested aesthetics */}
        <div className="relative z-[100] w-full max-w-6xl animate-reveal [animation-delay:200ms] overflow-visible">
          <div className="bg-white rounded-full sm:rounded-full soft-shadow flex flex-col md:flex-row items-stretch md:items-center p-2 sm:p-2 border border-slate-50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
            
            {/* DESTINATION SECTION */}
            <div className="flex-1 px-8 py-4 sm:py-6 relative group" ref={locationRef}>
              <label className="block text-[8px] sm:text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1 sm:mb-2 text-left">Destination</label>
              <div className="flex items-center gap-3">
                 <i className="fa-solid fa-location-dot text-sky-200 text-sm"></i>
                 <input 
                  type="text" 
                  autoComplete="off"
                  placeholder="Where to?" 
                  className="w-full bg-transparent outline-none text-sm sm:text-lg font-black text-slate-700 placeholder:text-sky-100"
                  value={searchFilters.location} 
                  onFocus={() => setShowLocationSuggestions(true)}
                  onChange={(e) => {
                    setSearchFilters({...searchFilters, location: e.target.value});
                    setShowLocationSuggestions(true);
                  }}
                />
              </div>
              
              {/* Suggestion Dropdown - High Visibility */}
              {showLocationSuggestions && (
                <div className="absolute top-[calc(100%+1.5rem)] left-0 w-full md:w-[480px] bg-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] border border-slate-100 p-6 sm:p-8 z-[200] animate-popup overflow-visible">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Trending Areas</p>
                    <button onClick={() => setShowLocationSuggestions(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                       <i className="fa-solid fa-circle-xmark text-lg"></i>
                    </button>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto no-scrollbar space-y-1">
                    {dynamicLocations.filter(loc => loc.name.toLowerCase().includes(searchFilters.location.toLowerCase())).length > 0 ? (
                      dynamicLocations.filter(loc => loc.name.toLowerCase().includes(searchFilters.location.toLowerCase())).map((loc) => (
                        <button key={loc.name} onClick={() => { setSearchFilters({...searchFilters, location: loc.name}); setShowLocationSuggestions(false); }}
                          className="w-full text-left px-5 py-4 rounded-2xl hover:bg-sky-50/50 group flex items-center justify-between transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                              <i className="fa-solid fa-location-arrow text-sm"></i>
                            </div>
                            <span className="text-sm sm:text-base font-black text-slate-600 group-hover:text-sky-600">{loc.name}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-300 group-hover:text-sky-400">{loc.count} Stays</span>
                        </button>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-300">
                        <p className="text-[10px] font-black uppercase tracking-widest">No matching sanctuaries</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* VERTICAL DIVIDER */}
            <div className="hidden md:block w-[1px] h-12 bg-sky-50"></div>
            
            {/* BOOKING WINDOWS SECTION */}
            <div className="flex-1 px-8 py-4 sm:py-6 cursor-pointer text-left group hover:bg-slate-50/30 transition-colors rounded-3xl"
              onClick={() => setShowPicker(true)}>
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                 <i className="fa-solid fa-calendar-days text-sky-600 text-[10px]"></i>
                 <label className="block text-[8px] sm:text-[9px] font-black text-sky-600 uppercase tracking-widest">Booking Windows</label>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <span className={`text-sm sm:text-lg font-black ${searchFilters.checkIn ? 'text-slate-700' : 'text-sky-200'}`}>
                  {searchFilters.checkIn ? searchFilters.checkIn.split('-').reverse().slice(0, 2).join('/') : 'Arrival'}
                </span>
                <div className="w-8 sm:w-12 h-[1px] bg-sky-100"></div>
                <span className={`text-sm sm:text-lg font-black ${searchFilters.checkOut ? 'text-slate-700' : 'text-sky-200'}`}>
                  {searchFilters.checkOut ? searchFilters.checkOut.split('-').reverse().slice(0, 2).join('/') : 'Departure'}
                </span>
              </div>
            </div>

            {/* VERTICAL DIVIDER */}
            <div className="hidden md:block w-[1px] h-12 bg-sky-50"></div>

            {/* EXPLORE BUTTON SECTION */}
            <div className="p-2 w-full md:w-auto">
              <button 
                onClick={handleSearch} 
                className="w-full md:w-auto px-10 sm:px-14 py-5 sm:py-6 rounded-full font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl transition-all active:scale-95 border-none"
                style={{ background: '#FF9B42', color: 'white' }}
              >
                EXPLORE SANCTUM <i className="fa-solid fa-arrow-right-long text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {[
            { l: "Elite Sanctums", v: "500+", i: "fa-hotel" },
            { l: "Heritage Cities", v: "24+", i: "fa-map-location-dot" },
            { l: "Legacies Crafted", v: "12k+", i: "fa-users-viewfinder" },
            { l: "Concierge Score", v: "100%", i: "fa-crown" }
          ].map((stat, i) => (
            <div key={i} className="group bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-slate-50 hover:bg-slate-900 transition-all duration-700 text-center soft-shadow">
              <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-4 sm:mb-6 rounded-xl bg-slate-50 group-hover:bg-white/10 flex items-center justify-center text-lg text-sky-600 group-hover:text-white transition-all">
                 <i className={`fa-solid ${stat.i}`}></i>
              </div>
              <p className="text-xl sm:text-4xl font-bold font-serif text-slate-900 group-hover:text-white mb-1">{stat.v}</p>
              <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-500">{stat.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 sm:mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-10">
          <div className="max-w-2xl text-left">
            <span className="text-sky-600 font-black uppercase tracking-[0.4em] text-[9px] sm:text-[11px] mb-2 block">The Collection</span>
            <h2 className="text-3xl sm:text-6xl md:text-7xl font-bold font-serif text-slate-900 leading-[1.1] sm:leading-[0.9]">Signature Stays</h2>
          </div>
          <button onClick={() => onExplore()} className="group flex items-center gap-3 text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-900 border border-slate-200 px-6 py-3 sm:py-6 rounded-xl sm:rounded-[2rem] bg-white soft-shadow hover:bg-slate-900 hover:text-white transition-all w-full sm:w-auto justify-center">
            VIEW ALL <i className="fa-solid fa-chevron-right group-hover:translate-x-2 transition-transform"></i>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-12">
          {featuredVillas.map(v => (
            <VillaCard key={v.id} villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-32 bg-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10 sm:mb-20 relative z-10 text-center sm:text-left">
           <span className="text-sky-500 font-black uppercase tracking-[0.6em] text-[9px] sm:text-[11px] mb-4 block">Guest Chronicles</span>
           <h2 className="text-3xl sm:text-6xl font-bold font-serif text-white leading-tight">Voices of the Sanctuary</h2>
        </div>
        <div className="flex animate-[marquee_60s_linear_infinite] whitespace-nowrap gap-6 sm:gap-12 py-4 hover:[animation-play-state:paused]">
           {(testimonials.length > 0 ? [...testimonials, ...testimonials] : []).map((t, i) => (
             <div key={i} className="inline-block w-[260px] sm:w-[420px] bg-white/5 backdrop-blur-3xl border border-white/10 p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] group hover:bg-white transition-all duration-700 whitespace-normal text-left">
                <p className="text-slate-300 group-hover:text-slate-700 leading-relaxed font-medium mb-6 sm:mb-12 text-sm sm:text-xl italic">"{t.content}"</p>
                <div className="flex items-center gap-4 border-t border-white/10 group-hover:border-slate-100 pt-6">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-white group-hover:text-slate-900 text-sm sm:text-base truncate">{t.name}</h4>
                    <p className="text-[8px] sm:text-[10px] text-sky-400 font-black uppercase tracking-widest mt-1 truncate">{t.category}</p>
                  </div>
                </div>
             </div>
           ))}
        </div>
      </section>

      {showPicker && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-reveal" onClick={() => setShowPicker(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl">
            <DateRangePicker startDate={searchFilters.checkIn} endDate={searchFilters.checkOut} onChange={(s, e) => setSearchFilters({...searchFilters, checkIn: s, checkOut: e})} onClose={() => setShowPicker(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
