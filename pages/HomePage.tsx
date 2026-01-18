
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
  const [showExtendedFilters, setShowExtendedFilters] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  const locationRef = useRef<HTMLDivElement>(null);

  const [searchFilters, setSearchFilters] = useState<VillaFilters>({
    location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 2, checkIn: '', checkOut: ''
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 15, 
        y: (e.clientY / window.innerHeight - 0.5) * 15 
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (showPicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showPicker]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsub = subscribeToTestimonials(setTestimonials);
    return () => unsub();
  }, []);

  const featuredVillas = useMemo(() => villas.filter(v => v.isFeatured).slice(0, 3), [villas]);

  const handleSearch = () => {
    onExplore(searchFilters);
  };

  return (
    <div className="bg-[#fcfdfe] overflow-visible pb-24">
      
      {/* Immersive Hero Section - Adjusted for immediate 'selector' visibility */}
      <section className="relative min-h-[60vh] sm:min-h-[75vh] flex flex-col items-center justify-center px-4 overflow-visible pt-12 sm:pt-20">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div 
            className="w-full h-full transition-transform duration-1000 ease-out will-change-transform"
            style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(${1.1 + scrollY * 0.0003})` }}
          >
            <img 
              src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1920" 
              className="w-full h-full object-cover brightness-[0.65] sm:brightness-[0.8]" 
              alt="Luxury Destination" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900/40"></div>
          </div>
        </div>

        <div className="relative z-10 text-center max-w-6xl mb-8 sm:mb-12 px-4 animate-fade">
          <div className="inline-flex items-center gap-3 mb-4 px-4 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white text-[7px] sm:text-[9px] font-black uppercase tracking-[0.4em]">Elite Sanctuary Collection</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold font-serif mb-4 text-white leading-[1.1] sm:leading-[0.9] tracking-tighter drop-shadow-2xl">
            Experience the Height of <br className="hidden sm:block" />
            <span className="text-sky-300 italic">Luxury & Comfort</span>.
          </h1>
          <p className="text-white/70 text-[10px] sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md">
            Hand-picked private retreats curated for the discerning traveler.
          </p>
        </div>

        {/* PROMINENT SEARCH HUB - 'SELECTOR' HUB */}
        <div className="relative z-[100] w-full max-w-6xl px-4 animate-reveal [animation-delay:300ms]">
          <div className="bg-white rounded-[1.5rem] sm:rounded-full premium-shadow border border-slate-50 p-2 sm:p-3 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
              
              {/* DESTINATION */}
              <div className="flex-1 px-5 sm:px-8 py-3 sm:py-5 relative group border-b lg:border-b-0 lg:border-r border-slate-100" ref={locationRef}>
                <label className="block text-[7px] sm:text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1 text-left">Destination</label>
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-location-dot text-sky-200 text-base sm:text-lg"></i>
                  <input 
                    type="text" 
                    autoComplete="off"
                    placeholder="Where to?" 
                    className="w-full bg-transparent outline-none text-sm sm:text-lg font-black text-slate-700 placeholder:text-slate-200"
                    value={searchFilters.location} 
                    onFocus={() => setShowLocationSuggestions(true)}
                    onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                  />
                </div>
                
                {showLocationSuggestions && (
                  <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 lg:w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-[200] animate-popup">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Hotspots</p>
                      <button onClick={() => setShowLocationSuggestions(false)} className="text-slate-300 hover:text-sky-600"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
                      {HOTSPOT_LOCATIONS.map((loc) => (
                        <button key={loc.name} onClick={() => { setSearchFilters({...searchFilters, location: loc.name}); setShowLocationSuggestions(false); }}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-sky-50 group flex items-center justify-between transition-all">
                          <span className="text-xs font-black text-slate-600 group-hover:text-sky-600">{loc.name}</span>
                          <span className="text-[7px] font-black text-slate-300 group-hover:text-sky-400">{loc.count} Stays</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* DATES */}
              <div className="flex-1 px-5 sm:px-8 py-3 sm:py-5 cursor-pointer text-left group hover:bg-slate-50 transition-colors border-b lg:border-b-0 lg:border-r border-slate-100"
                onClick={() => setShowPicker(true)}>
                <label className="block text-[7px] sm:text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1">Stay Period</label>
                <div className="flex items-center gap-4">
                  <i className="fa-solid fa-calendar-day text-sky-200 text-base sm:text-lg"></i>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`text-xs sm:text-lg font-black ${searchFilters.checkIn ? 'text-slate-800' : 'text-slate-200'}`}>
                      {searchFilters.checkIn ? searchFilters.checkIn.split('-').reverse().slice(0, 2).join('/') : 'Arrival'}
                    </span>
                    <div className="w-4 h-[1px] bg-slate-200"></div>
                    <span className={`text-xs sm:text-lg font-black ${searchFilters.checkOut ? 'text-slate-800' : 'text-slate-200'}`}>
                      {searchFilters.checkOut ? searchFilters.checkOut.split('-').reverse().slice(0, 2).join('/') : 'Departure'}
                    </span>
                  </div>
                </div>
              </div>

              {/* MORE FILTERS TOGGLE */}
              <div className="flex-none px-5 py-3 lg:py-0 flex items-center justify-center">
                 <button 
                  onClick={() => setShowExtendedFilters(!showExtendedFilters)}
                  className={`w-10 h-10 rounded-full border border-slate-100 transition-all flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 ${showExtendedFilters ? 'bg-sky-50 text-sky-600 ring-2 ring-sky-100' : ''}`}
                 >
                   <i className="fa-solid fa-sliders text-xs"></i>
                 </button>
              </div>

              {/* SEARCH ACTION */}
              <div className="p-1.5 w-full lg:w-auto">
                <button 
                  onClick={handleSearch} 
                  className="w-full lg:w-auto px-8 lg:px-12 py-4 lg:py-5 rounded-xl lg:rounded-full font-black text-[10px] lg:text-[12px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 bg-sky-600 text-white shadow-xl hover:bg-sky-700 transition-all active:scale-95 border-none"
                >
                  DISCOVER <i className="fa-solid fa-magnifying-glass text-[9px]"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SYMBOLS */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
          {[
            { l: "Verified Listings", d: "Strict luxury verification audit for every sanctuary.", i: "fa-certificate" },
            { l: "24/7 Concierge", d: "Round-the-clock support for your elite needs.", i: "fa-headset" },
            { l: "Secure Booking", d: "Encrypted transactions and total data privacy.", i: "fa-shield-halved" }
          ].map((trust, i) => (
            <div key={i} className="bg-white p-6 sm:p-10 rounded-[2rem] border border-slate-50 hover-lift transition-all flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-inner mb-6">
                 <i className={`fa-solid ${trust.i}`}></i>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold font-serif text-slate-900 mb-3">{trust.l}</h3>
              <p className="text-[10px] sm:text-sm text-slate-500 font-medium leading-relaxed">{trust.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR STAYS */}
      <section id="destinations" className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 sm:mb-16 gap-6 text-left">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-[2px] bg-sky-500"></div>
               <span className="text-sky-600 font-black uppercase tracking-[0.6em] text-[8px] sm:text-[10px]">Signature Stays</span>
            </div>
            <h2 className="text-3xl sm:text-6xl font-bold font-serif text-slate-900 leading-[1] tracking-tighter">Popular Stays</h2>
            <p className="mt-4 text-slate-400 font-medium text-xs sm:text-lg">Discover handpicked architectural masterpieces for your next legacy stay.</p>
          </div>
          <button onClick={() => onExplore()} className="flex items-center gap-3 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-slate-900 border border-slate-200 px-8 py-4 rounded-xl sm:rounded-full bg-white shadow-sm hover:bg-slate-900 hover:text-white transition-all w-full sm:w-auto justify-center">
            VIEW CATALOG <i className="fa-solid fa-chevron-right text-[9px]"></i>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-12">
          {featuredVillas.map(v => (
            <VillaCard key={v.id} villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
          ))}
        </div>
      </section>

      {/* REFACTORED DATE PICKER MODAL - STRICTLY CENTERED VIEWPORT OVERLAY */}
      {showPicker && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-fade" onClick={() => setShowPicker(false)}>
          <div 
            onClick={e => e.stopPropagation()} 
            className="w-full max-w-4xl flex items-center justify-center"
          >
            <DateRangePicker 
              startDate={searchFilters.checkIn || ''} 
              endDate={searchFilters.checkOut || ''} 
              onChange={(s, e) => setSearchFilters({...searchFilters, checkIn: s, checkOut: e})} 
              onClose={() => setShowPicker(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
