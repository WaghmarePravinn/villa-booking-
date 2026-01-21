
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Villa, VillaFilters, SiteSettings, Testimonial, AppTheme } from '../types';
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
  const [scrollY, setScrollY] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  const locationRef = useRef<HTMLDivElement>(null);

  const [searchFilters, setSearchFilters] = useState<VillaFilters>({
    location: '', minPrice: 0, maxPrice: 150000, bedrooms: 0, guests: 2, checkIn: '', checkOut: ''
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const offer = useMemo(() => {
    const theme = settings.activeTheme;
    switch(theme) {
      case AppTheme.REPUBLIC_DAY:
      case AppTheme.INDEPENDENCE_DAY:
        return {
          title: "Freedom Sale: Flat 26% OFF",
          code: "NY25",
          desc: "Celebrate the spirit of the nation in a sanctuary of luxury.",
          gradient: "from-orange-500 via-white to-emerald-500",
          icon: "fa-flag"
        };
      case AppTheme.HOLI:
        return {
          title: "Holi Hai! Exclusive Getaway",
          code: "HOLI25",
          desc: "Splash into luxury this festival of colors with vibrant retreat options.",
          gradient: "from-pink-500 via-yellow-400 to-sky-400",
          icon: "fa-palette"
        };
      case AppTheme.DIWALI:
        return {
          title: "Diwali Delight: Light Up",
          code: "DEEP25",
          desc: "Celebrate the festival of lights in a hand-curated golden retreat.",
          gradient: "from-amber-400 via-amber-600 to-indigo-950",
          icon: "fa-om"
        };
      default:
        return {
          title: "Exclusive Seasonal Escapes",
          code: "PEAK25",
          desc: "Discover handpicked private retreats curated for discerning global travelers.",
          gradient: "from-sky-600 to-sky-400",
          icon: "fa-crown"
        };
    }
  }, [settings.activeTheme]);

  return (
    <div className="bg-transparent pb-16 sm:pb-32">
      
      {/* Immersive Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[80vh] flex flex-col items-center justify-center px-4 overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1920" 
            className="w-full h-full object-cover brightness-[0.55] sm:brightness-[0.7] transition-transform duration-[10s] ease-linear scale-110" 
            style={{ transform: `scale(${1.1 + scrollY * 0.0001}) translateY(${scrollY * 0.08}px)` }}
            alt="Villa Hero" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/10 to-[var(--t-bg)]"></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl mb-12 sm:mb-24 px-4 animate-reveal">
          <div className="inline-flex items-center gap-2.5 mb-6 px-5 py-2.5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-white text-[8px] sm:text-[11px] font-black uppercase tracking-[0.4em]">Curated Elite Stays</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-9xl font-bold font-serif mb-6 text-white leading-[1] tracking-tighter drop-shadow-2xl">
            Legacy Stays <br className="hidden sm:block" />
            <span className="text-sky-300 italic">Redefined</span>.
          </h1>
          <p className="text-white/90 text-sm sm:text-2xl max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-xl px-2 opacity-95">
            Discover a handpicked collection of India's most breathtaking private retreats.
          </p>
        </div>

        {/* Dynamic Search Hub */}
        <div className="relative w-full max-w-6xl px-4 animate-reveal [animation-delay:300ms] z-[100]">
          <div className="bg-white rounded-[2rem] sm:rounded-full p-2 sm:p-3 shadow-[0_40px_120px_rgba(0,0,0,0.2)] border border-slate-50">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
              
              {/* Destination Selector */}
              <div className="flex-1 px-6 sm:px-12 py-5 sm:py-7 relative group border-b lg:border-b-0 lg:border-r border-slate-50" ref={locationRef}>
                <label className="block text-[8px] sm:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1.5 text-left">Where to?</label>
                <div className="flex items-center gap-4">
                  <i className="fa-solid fa-map-pin text-sky-400 text-lg"></i>
                  <input 
                    placeholder="Enter destination..." 
                    className="w-full bg-transparent outline-none text-base sm:text-2xl font-bold text-slate-800 placeholder:text-slate-200"
                    value={searchFilters.location} 
                    onFocus={() => setShowLocationSuggestions(true)}
                    onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                  />
                </div>
                
                {showLocationSuggestions && (
                  <div className="absolute top-[calc(100%+0.8rem)] left-0 lg:left-8 right-0 lg:right-auto lg:w-[400px] bg-white rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.15)] border border-slate-100 p-6 z-[200] animate-popup">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Hotspots</p>
                      <button onClick={() => setShowLocationSuggestions(false)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 hover:text-red-500 transition-all"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {HOTSPOT_LOCATIONS.map((loc) => (
                        <button key={loc.name} onClick={() => { setSearchFilters({...searchFilters, location: loc.name}); setShowLocationSuggestions(false); }}
                          className="text-left p-4 rounded-2xl hover:bg-sky-50 group transition-all border border-transparent hover:border-sky-100 active:scale-95">
                          <p className="text-[12px] font-bold text-slate-700 group-hover:text-sky-600 truncate">{loc.name}</p>
                          <p className="text-[8px] font-black text-slate-300 uppercase mt-1">{loc.count} Properties</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date Selection Trigger */}
              <div 
                className="flex-1 px-6 sm:px-12 py-5 sm:py-7 cursor-pointer text-left group hover:bg-slate-50/50 transition-colors border-b lg:border-b-0 lg:border-r border-slate-50 relative"
                onClick={() => setShowPicker(true)}
              >
                <label className="block text-[8px] sm:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1.5">Stay Period</label>
                <div className="flex items-center gap-4">
                  <i className="fa-solid fa-calendar-day text-sky-400 text-lg"></i>
                  <div className="flex items-center gap-3">
                    <span className={`text-base sm:text-2xl font-bold ${searchFilters.checkIn ? 'text-slate-900' : 'text-slate-200'}`}>
                      {searchFilters.checkIn ? searchFilters.checkIn.split('-').reverse().slice(0, 2).join('/') : 'Arrive'}
                    </span>
                    <i className="fa-solid fa-arrow-right-long text-[10px] text-slate-200"></i>
                    <span className={`text-base sm:text-2xl font-bold ${searchFilters.checkOut ? 'text-slate-900' : 'text-slate-200'}`}>
                      {searchFilters.checkOut ? searchFilters.checkOut.split('-').reverse().slice(0, 2).join('/') : 'Depart'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Trigger */}
              <div className="p-3 w-full lg:w-auto">
                <button 
                  onClick={handleSearch} 
                  className="w-full lg:w-auto px-10 lg:px-20 py-5 sm:py-7 rounded-[1.5rem] sm:rounded-full font-black text-[11px] sm:text-[14px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 bg-sky-600 text-white shadow-2xl shadow-sky-600/20 hover:bg-sky-700 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Explore Catalog <i className="fa-solid fa-compass"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UNIFIED FLOATING DATE PICKER OVERLAY - Always visible in viewport */}
      {showPicker && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade"
          onClick={() => setShowPicker(false)}
        >
           <div 
             className="relative animate-scale flex flex-col items-center max-w-full" 
             onClick={e => e.stopPropagation()}
           >
              <button 
                onClick={() => setShowPicker(false)}
                className="absolute -top-3 -right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl z-[1010] active:scale-90 hover:bg-sky-600 transition-colors"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>

              <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_60px_150px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden">
                <DateRangePicker 
                  startDate={searchFilters.checkIn || ''} 
                  endDate={searchFilters.checkOut || ''} 
                  onChange={(s, e) => {
                    setSearchFilters({...searchFilters, checkIn: s, checkOut: e});
                    if (s && e) {
                      // Optional: auto-close after a small delay or keep open until confirmed
                    }
                  }} 
                  onClose={() => setShowPicker(false)} 
                />
              </div>
           </div>
        </div>
      )}

      {/* Featured Offer Card */}
      <section className="max-w-6xl mx-auto px-4 mt-20 sm:mt-40">
        <div className={`p-1 bg-gradient-to-tr ${offer.gradient} rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl animate-reveal`}>
          <div className="bg-white rounded-[2.4rem] sm:rounded-[3.9rem] p-8 sm:p-20 flex flex-col lg:flex-row items-center justify-between gap-10 sm:gap-16">
            <div className="text-center lg:text-left space-y-5 max-w-2xl">
               <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-inner">
                    <i className={`fa-solid ${offer.icon} text-xl`}></i>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Seasonal Highlight</span>
               </div>
               <h2 className="text-3xl sm:text-6xl font-bold font-serif text-slate-900 leading-tight">
                 {offer.title}
               </h2>
               <p className="text-slate-500 font-medium text-base sm:text-2xl italic opacity-80 leading-relaxed">
                 "{offer.desc}"
               </p>
            </div>
            <div className="flex flex-col items-center gap-5 bg-slate-50 p-8 sm:p-12 rounded-[2.5rem] w-full lg:min-w-[300px] lg:w-auto shadow-inner">
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Exclusive Voucher</p>
               <div className="w-full text-center px-8 py-5 bg-white border-2 border-dashed border-slate-100 rounded-2xl text-2xl sm:text-4xl font-black tracking-[0.2em] text-slate-900 shadow-sm">
                  {offer.code}
               </div>
               <button onClick={() => onExplore()} className="w-full mt-4 px-10 py-5 bg-slate-900 text-white rounded-2xl text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] hover:bg-sky-600 transition-all shadow-2xl active:scale-95">
                 Unlock Reward
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:py-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-16">
          {[
            { l: "Architectural Gems", d: "Every villa in our portfolio undergoes a rigorous 100-point audit for design and structural integrity.", i: "fa-gem" },
            { l: "Elite Concierge", d: "Personal stay orcestrators available 24/7 to manage every detail of your sanctuary experience.", i: "fa-concierge-bell" },
            { l: "Legacy Guarantee", d: "Secured bookings and direct villa-owner transparency to ensure your total peace of mind.", i: "fa-shield-heart" }
          ].map((trust, i) => (
            <div key={i} className="text-center p-10 sm:p-14 rounded-[3rem] bg-white border border-slate-50 shadow-sm hover:shadow-2xl transition-all group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-50 rounded-3xl flex items-center justify-center text-2xl sm:text-3xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all mx-auto mb-10 shadow-inner">
                 <i className={`fa-solid ${trust.i}`}></i>
              </div>
              <h3 className="text-xl sm:text-3xl font-bold font-serif text-slate-900 mb-5">{trust.l}</h3>
              <p className="text-sm sm:text-lg text-slate-500 font-medium leading-relaxed px-2 sm:px-4 opacity-70">{trust.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Listing Collection */}
      <section className="max-w-7xl mx-auto px-4 pb-20 sm:pb-40">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 sm:mb-28 gap-10 sm:gap-12 text-center md:text-left">
          <div className="max-w-2xl">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-5">
               <div className="w-10 h-[2px] bg-sky-500"></div>
               <span className="text-sky-600 font-black uppercase tracking-[0.6em] text-[10px] sm:text-[12px]">Signature Series</span>
            </div>
            <h2 className="text-4xl sm:text-8xl font-bold font-serif text-slate-900 leading-[1.05] tracking-tighter">Iconic Escapes</h2>
            <p className="mt-6 sm:mt-10 text-slate-500 font-medium text-base sm:text-2xl opacity-80 leading-relaxed">Handpicking the most breathtaking private sanctuaries for the discerning global traveler.</p>
          </div>
          <button onClick={() => onExplore()} className="w-full sm:w-auto group flex items-center justify-center gap-4 text-[11px] sm:text-[13px] font-black uppercase tracking-[0.5em] text-white bg-slate-900 px-10 sm:px-14 py-5 sm:py-6 rounded-2xl sm:rounded-full hover:bg-sky-600 transition-all shadow-2xl active:scale-95">
            Full Catalog <i className="fa-solid fa-arrow-right group-hover:translate-x-3 transition-transform"></i>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-20">
          {featuredVillas.map(v => (
            <div key={v.id} className="animate-reveal" style={{ animationDelay: `${villas.indexOf(v) * 150}ms` }}>
              <VillaCard villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
