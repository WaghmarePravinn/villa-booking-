
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

  // Dynamically compute locations from active villas to ensure syncing
  const dynamicLocations = useMemo(() => {
    const locMap = new Map<string, number>();
    
    // Start with core hotspots from constants
    HOTSPOT_LOCATIONS.forEach(loc => locMap.set(loc.name, loc.count));
    
    // Add/Update from live villas
    villas.forEach(v => {
      // Extract city (assuming "City, State" or just "City")
      const city = v.location.split(',')[0].trim();
      const currentCount = locMap.get(city) || 0;
      locMap.set(city, currentCount + 1);
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
      const names = ["Kabir", "Sneha", "Rohan", "Anjali", "Priya", "Vikram"];
      const locs = dynamicLocations.length > 0 ? dynamicLocations.map(l => l.name) : ["Lonavala", "Goa"];
      setLiveBooking({ 
        name: names[Math.floor(Math.random() * names.length)], 
        location: locs[Math.floor(Math.random() * locs.length)] 
      });
      setTimeout(() => setLiveBooking(null), 5000);
    }, 15000);
    return () => clearInterval(interval);
  }, [dynamicLocations]);

  const featuredVillas = villas.filter(v => v.isFeatured).slice(0, 6);

  const handleSearch = () => {
    onExplore(searchFilters);
  };

  return (
    <div className="space-y-16 sm:space-y-32 pb-16 sm:pb-32 overflow-x-hidden relative bg-[#fcfdfe]" onMouseMove={handleMouseMove}>
      
      {/* Live Notification */}
      {liveBooking && (
        <div className="fixed bottom-24 sm:bottom-10 left-4 sm:left-10 z-[1000] animate-reveal">
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-100 p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] soft-shadow flex items-center gap-3 sm:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div className="text-left">
              <p className="text-[10px] sm:text-xs font-black text-slate-900 leading-none">{liveBooking.name} recently stayed</p>
              <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 sm:mt-1.5">Sanctuary: {liveBooking.location}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[90vh] sm:h-[100vh] flex flex-col items-center justify-center overflow-hidden pt-12 sm:pt-0">
        <div 
          className="absolute inset-0 z-0 transition-transform duration-1000 ease-out pointer-events-none hidden sm:block"
          style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.05)` }}
        >
          <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover opacity-10" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-50/40 via-transparent to-sky-50/40"></div>
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-6xl mb-8 sm:mb-16">
          <div className="mb-6 sm:mb-10 flex items-center justify-center gap-4 sm:gap-6 animate-reveal">
             <div className="h-[1px] w-6 sm:w-12 bg-slate-200"></div>
             <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-slate-400 text-center">{settings.promoText}</span>
             <div className="h-[1px] w-6 sm:w-12 bg-slate-200"></div>
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[11rem] font-bold font-serif mb-4 sm:mb-10 drop-shadow-2xl animate-reveal uppercase tracking-tighter text-theme-shimmer leading-[1] sm:leading-[0.85] flex flex-col items-center">
            {BRAND_NAME.split(' ')[0]} 
            <span className="text-lg sm:text-2xl md:text-3xl lg:text-5xl tracking-[0.2em] sm:tracking-[0.3em] font-light italic text-slate-300 normal-case mt-2 sm:mt-4">PRIVATE SANCTUARIES</span>
          </h1>
          
          <p className="text-sm sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-16 text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed animate-reveal [animation-delay:200ms]">
            Experience the pinnacle of Indian luxury. Hand-picked retreats curated for the discerning traveler.
          </p>
        </div>

        {/* Search Hub */}
        <div className="relative z-20 w-full max-w-6xl px-4 sm:px-6 animate-reveal [animation-delay:400ms]">
          <div className="bg-white/95 backdrop-blur-3xl p-3 sm:p-5 rounded-3xl sm:rounded-[3.5rem] soft-shadow flex flex-col md:flex-row items-stretch md:items-center gap-2 sm:gap-4 border border-white">
            <div className="flex-[1.2] px-6 py-4 sm:py-6 border-b md:border-b-0 md:border-r border-slate-100 relative group" ref={locationRef}>
              <label className="block text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-3 text-left">Location</label>
              <div className="flex items-center gap-3">
                 <i className="fa-solid fa-location-dot text-sky-400"></i>
                 <input 
                  type="text" placeholder="Where to?" className="w-full bg-transparent outline-none text-sm sm:text-base font-bold text-slate-800 placeholder:text-slate-300"
                  value={searchFilters.location} onFocus={() => setShowLocationSuggestions(true)}
                  onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                />
              </div>
              {showLocationSuggestions && (
                <div className="absolute top-full left-0 mt-3 w-full md:w-96 bg-white rounded-2xl sm:rounded-[3rem] shadow-2xl border border-slate-100 p-4 sm:p-8 z-[110] animate-reveal">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Trending Hotspots</p>
                    <button onClick={() => setShowLocationSuggestions(false)} className="text-slate-300 hover:text-slate-900 sm:hidden">
                       <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1 sm:space-y-2">
                    {dynamicLocations.filter(loc => loc.name.toLowerCase().includes(searchFilters.location.toLowerCase())).map((loc) => (
                      <button key={loc.name} onClick={() => { setSearchFilters({...searchFilters, location: loc.name}); setShowLocationSuggestions(false); }}
                        className="w-full text-left px-3 py-3 sm:py-4 rounded-xl hover:bg-slate-50 group flex items-center justify-between transition-all">
                        <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-sky-600">{loc.name}</span>
                        <span className="text-[8px] sm:text-[10px] font-black text-slate-300">{loc.count} Stays</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-[1.8] px-6 py-4 sm:py-6 border-b md:border-b-0 md:border-r border-slate-100 cursor-pointer group hover:bg-slate-50/50 transition-all text-left"
              onClick={() => setShowPicker(true)}>
              <label className="block text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-3">Stay Window</label>
              <div className="flex items-center gap-4 sm:gap-8">
                <span className={`text-sm sm:text-base font-bold ${searchFilters.checkIn ? 'text-slate-800' : 'text-slate-300'}`}>{searchFilters.checkIn || 'Arrival'}</span>
                <div className="w-6 sm:w-10 h-[1px] bg-slate-200"></div>
                <span className={`text-sm sm:text-base font-bold ${searchFilters.checkOut ? 'text-slate-800' : 'text-slate-300'}`}>{searchFilters.checkOut || 'Departure'}</span>
              </div>
            </div>
            <div className="p-1 sm:p-2 w-full md:w-auto">
              <button onClick={handleSearch} className="premium-btn px-10 sm:px-16 py-4 sm:py-7 rounded-2xl sm:rounded-[2.5rem] font-black text-[10px] sm:text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 sm:gap-5 w-full justify-center group">
                EXPLORE <i className="fa-solid fa-arrow-right-long group-hover:translate-x-3 transition-transform"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-10">
          {[
            { l: "Elite Sanctums", v: "500+", i: "fa-hotel" },
            { l: "Heritage Cities", v: "24+", i: "fa-map-location-dot" },
            { l: "Legacies Crafted", v: "12k+", i: "fa-users-viewfinder" },
            { l: "Concierge Score", v: "100%", i: "fa-crown" }
          ].map((stat, i) => (
            <div key={i} className="group bg-white p-6 sm:p-12 rounded-2xl sm:rounded-[3.5rem] border border-slate-50 hover:bg-slate-900 transition-all duration-700 text-center soft-shadow">
              <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-8 rounded-xl bg-slate-50 group-hover:bg-white/10 flex items-center justify-center text-lg sm:text-xl text-sky-600 group-hover:text-white transition-all">
                 <i className={`fa-solid ${stat.i}`}></i>
              </div>
              <p className="text-2xl sm:text-5xl font-bold font-serif text-slate-900 group-hover:text-white mb-1 sm:mb-3">{stat.v}</p>
              <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-400 group-hover:text-slate-500">{stat.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 sm:mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-10">
          <div className="max-w-2xl text-left">
            <span className="text-sky-600 font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-[9px] sm:text-[11px] mb-3 sm:mb-6 block">Collection Registry</span>
            <h2 className="text-3xl sm:text-6xl md:text-8xl lg:text-9xl font-bold font-serif text-slate-900 leading-[1] sm:leading-[0.9]">Signature Stays</h2>
          </div>
          <button onClick={() => onExplore()} className="group flex items-center gap-4 text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-900 border border-slate-100 px-8 sm:px-14 py-4 sm:py-7 rounded-2xl sm:rounded-[2.5rem] bg-white soft-shadow hover:bg-slate-900 hover:text-white transition-all w-full sm:w-auto justify-center">
            ALL PROPERTIES <i className="fa-solid fa-chevron-right group-hover:translate-x-3 transition-transform"></i>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-16">
          {featuredVillas.map(v => (
            <VillaCard key={v.id} villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
          ))}
        </div>
      </section>

      {/* Marquee Testimonials */}
      <section className="py-20 sm:py-40 bg-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-24 relative z-10 text-center sm:text-left">
           <span className="text-sky-500 font-black uppercase tracking-[0.6em] text-[9px] sm:text-[11px] mb-4 sm:mb-8 block">Verified Chronicles</span>
           <h2 className="text-3xl sm:text-6xl md:text-8xl font-bold font-serif text-white leading-tight">Voices of the Sanctuary</h2>
        </div>
        <div className="flex animate-[marquee_60s_linear_infinite] whitespace-nowrap gap-6 sm:gap-12 py-6 sm:py-10 hover:[animation-play-state:paused]">
           {(testimonials.length > 0 ? [...testimonials, ...testimonials] : []).map((t, i) => (
             <div key={i} className="inline-block w-[280px] sm:w-[480px] bg-white/5 backdrop-blur-3xl border border-white/10 p-8 sm:p-16 rounded-[2rem] sm:rounded-[4.5rem] group hover:bg-white transition-all duration-1000 whitespace-normal text-left">
                <p className="text-slate-300 group-hover:text-slate-700 leading-relaxed sm:leading-loose font-medium mb-8 sm:mb-16 text-base sm:text-2xl italic">"{t.content}"</p>
                <div className="flex items-center gap-4 sm:gap-8 border-t border-white/10 group-hover:border-slate-100 pt-6 sm:pt-12">
                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-[2rem] overflow-hidden">
                    <img src={t.avatar} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-slate-900 text-sm sm:text-lg">{t.name}</h4>
                    <p className="text-[8px] sm:text-[10px] text-sky-400 font-black uppercase tracking-widest mt-1 sm:mt-1.5">{t.category}</p>
                  </div>
                </div>
             </div>
           ))}
        </div>
      </section>

      {showPicker && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-slate-900/20 backdrop-blur-md animate-reveal" onClick={() => setShowPicker(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl">
            <DateRangePicker startDate={searchFilters.checkIn} endDate={searchFilters.checkOut} onChange={(s, e) => setSearchFilters({...searchFilters, checkIn: s, checkOut: e})} onClose={() => setShowPicker(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
