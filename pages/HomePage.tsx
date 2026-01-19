
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
    // Lock scroll when picker is active
    if (showPicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
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

  const getSeasonalOffer = () => {
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
          title: "Holi Hai! Weekend Getaway",
          code: "HOLI25",
          desc: "Splash into luxury this festival of colors. Book now for vibrant memories.",
          gradient: "from-pink-500 via-yellow-400 to-sky-400",
          icon: "fa-palette"
        };
      case AppTheme.DIWALI:
        return {
          title: "Diwali Delight: Light Up Your Vacation",
          code: "DEEP25",
          desc: "Celebrate the festival of lights in a golden private retreat.",
          gradient: "from-amber-400 via-amber-600 to-indigo-950",
          icon: "fa-om"
        };
      default:
        return {
          title: "Exclusive Seasonal Escapes",
          code: "PEAK25",
          desc: "Handpicked private retreats curated for the discerning traveler.",
          gradient: "from-sky-600 to-sky-400",
          icon: "fa-crown"
        };
    }
  };

  const offer = getSeasonalOffer();

  return (
    <div className="bg-transparent pb-12 sm:pb-24">
      
      {/* Hero Section */}
      <section className="relative min-h-[75vh] sm:min-h-[80vh] flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1920" 
            className="w-full h-full object-cover brightness-[0.5] sm:brightness-[0.7] transition-transform duration-[10s] ease-linear scale-110" 
            style={{ transform: `scale(${1.1 + scrollY * 0.0001}) translateY(${scrollY * 0.1}px)` }}
            alt="Hero Background" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/20 to-[var(--t-bg)]"></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl mb-8 sm:mb-20 px-2 animate-reveal">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 px-4 sm:px-5 py-1.5 sm:py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-white text-[7px] sm:text-[10px] font-black uppercase tracking-[0.4em]">Elite Sanctuary Collection</span>
          </div>
          <h1 className="text-3xl sm:text-6xl md:text-8xl font-bold font-serif mb-4 sm:mb-6 text-white leading-[1.1] tracking-tighter drop-shadow-2xl px-2">
            Legacy Stays <br className="hidden sm:block" />
            <span className="text-sky-300 italic">Redefined</span>.
          </h1>
          <p className="text-white/80 text-xs sm:text-xl max-w-xl mx-auto font-medium leading-relaxed drop-shadow-md px-4 opacity-90">
            {offer.desc}
          </p>
        </div>

        {/* Search Hub */}
        <div className="relative z-[100] w-full max-w-6xl px-4 animate-reveal [animation-delay:300ms]">
          <div className="bg-white rounded-[1.5rem] sm:rounded-full p-1.5 sm:p-3 shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-50">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
              
              {/* Destination */}
              <div className="flex-1 px-5 sm:px-10 py-4 sm:py-6 relative group border-b lg:border-b-0 lg:border-r border-slate-50" ref={locationRef}>
                <label className="block text-[7px] sm:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1 text-left">Destination</label>
                <div className="flex items-center gap-3 sm:gap-4">
                  <i className="fa-solid fa-map-pin text-sky-400 text-sm sm:text-lg"></i>
                  <input 
                    placeholder="Where to?" 
                    className="w-full bg-transparent outline-none text-sm sm:text-xl font-bold text-slate-800 placeholder:text-slate-200"
                    value={searchFilters.location} 
                    onFocus={() => setShowLocationSuggestions(true)}
                    onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                  />
                </div>
                
                {showLocationSuggestions && (
                  <div className="absolute top-[calc(100%+0.5rem)] left-0 lg:left-8 right-0 lg:right-auto lg:w-96 bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 p-4 sm:p-6 z-[200] animate-popup">
                    <div className="flex justify-between items-center mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-slate-50">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Popular Hotspots</p>
                      <button onClick={() => setShowLocationSuggestions(false)} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {HOTSPOT_LOCATIONS.map((loc) => (
                        <button key={loc.name} onClick={() => { setSearchFilters({...searchFilters, location: loc.name}); setShowLocationSuggestions(false); }}
                          className="text-left p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-sky-50 group transition-all border border-transparent hover:border-sky-100">
                          <p className="text-[9px] sm:text-[11px] font-bold text-slate-700 group-hover:text-sky-600 truncate">{loc.name}</p>
                          <p className="text-[7px] font-black text-slate-400 opacity-60 uppercase">{loc.count} Stays</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date Selection Trigger */}
              <div 
                className="flex-1 px-5 sm:px-10 py-4 sm:py-6 cursor-pointer text-left group hover:bg-slate-50/50 transition-colors border-b lg:border-b-0 lg:border-r border-slate-50"
                onClick={() => setShowPicker(true)}
              >
                <label className="block text-[7px] sm:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">Stay Period</label>
                <div className="flex items-center gap-3 sm:gap-4">
                  <i className="fa-solid fa-calendar-alt text-sky-400 text-sm sm:text-lg"></i>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`text-sm sm:text-lg font-bold ${searchFilters.checkIn ? 'text-slate-900' : 'text-slate-200'}`}>
                      {searchFilters.checkIn ? searchFilters.checkIn.split('-').reverse().slice(0, 2).join('/') : 'Arr.'}
                    </span>
                    <i className="fa-solid fa-arrow-right-long text-[8px] text-slate-200"></i>
                    <span className={`text-sm sm:text-lg font-bold ${searchFilters.checkOut ? 'text-slate-900' : 'text-slate-200'}`}>
                      {searchFilters.checkOut ? searchFilters.checkOut.split('-').reverse().slice(0, 2).join('/') : 'Dep.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Search Trigger */}
              <div className="p-1.5 sm:p-3 w-full lg:w-auto">
                <button 
                  onClick={handleSearch} 
                  className="w-full lg:w-auto px-8 lg:px-16 py-4 sm:py-6 rounded-xl sm:rounded-full font-black text-[10px] sm:text-[13px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 sm:gap-4 bg-sky-600 text-white shadow-2xl shadow-sky-600/20 hover:bg-sky-700 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Search Stays <i className="fa-solid fa-compass"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIEWPORT-CENTRIC DATE PICKER OVERLAY */}
      {showPicker && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-3xl animate-fade overflow-hidden" onClick={() => setShowPicker(false)}>
           <div className="relative animate-scale flex flex-col items-center max-w-full w-fit h-fit" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setShowPicker(false)}
                className="absolute -top-16 right-0 sm:-right-16 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all z-[1010] shadow-2xl"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
              <DateRangePicker 
                startDate={searchFilters.checkIn || ''} 
                endDate={searchFilters.checkOut || ''} 
                onChange={(s, e) => setSearchFilters({...searchFilters, checkIn: s, checkOut: e})} 
                onClose={() => setShowPicker(false)} 
              />
           </div>
        </div>
      )}

      {/* Seasonal Highlight Offer Section */}
      <section className="max-w-5xl mx-auto px-4 mt-16 sm:mt-32">
        <div className={`p-0.5 sm:p-1 bg-gradient-to-tr ${offer.gradient} rounded-[2rem] sm:rounded-[3rem] shadow-2xl animate-reveal`}>
          <div className="bg-white rounded-[1.9rem] sm:rounded-[2.8rem] p-6 sm:p-16 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-10">
            <div className="text-center md:text-left space-y-3 sm:space-y-4 max-w-xl">
               <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-900 shadow-inner">
                    <i className={`fa-solid ${offer.icon} text-lg sm:text-xl`}></i>
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Limited Offer</span>
               </div>
               <h2 className="text-2xl sm:text-5xl font-bold font-serif text-slate-900 leading-tight">
                 {offer.title}
               </h2>
               <p className="text-slate-500 font-medium text-xs sm:text-lg italic opacity-80">
                 "{offer.desc}"
               </p>
            </div>
            <div className="flex flex-col items-center gap-3 sm:gap-4 bg-slate-50 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] w-full md:min-w-[240px] md:w-auto shadow-inner">
               <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Coupon Code</p>
               <div className="w-full text-center px-6 py-3 sm:py-4 bg-white border-2 border-dashed border-slate-100 rounded-xl sm:rounded-2xl text-xl sm:text-2xl font-black tracking-[0.2em] text-slate-900">
                  {offer.code}
               </div>
               <button onClick={() => onExplore()} className="w-full mt-2 px-8 py-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all shadow-xl active:scale-95">
                 Redeem Now
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12">
          {[
            { l: "Vetted Collection", d: "A strict 100-point audit for every featured architectural masterpiece.", i: "fa-gem" },
            { l: "Elite Concierge", d: "Personal stay orchestrators available 24/7 for your specific needs.", i: "fa-concierge-bell" },
            { l: "Legacy Guarantee", d: "Peace of mind through secure bookings and transparent stays.", i: "fa-shield-heart" }
          ].map((trust, i) => (
            <div key={i} className="text-center p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-[var(--t-card-bg)] border border-[var(--glass-border)] shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-sky-50 rounded-2xl flex items-center justify-center text-xl sm:text-2xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all mx-auto mb-6 sm:mb-8 shadow-inner">
                 <i className={`fa-solid ${trust.i}`}></i>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold font-serif text-[var(--t-text)] mb-3 sm:mb-4">{trust.l}</h3>
              <p className="text-[11px] sm:text-sm text-slate-500 font-medium leading-relaxed px-2 sm:px-4 opacity-70">{trust.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Selection */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:pb-32">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 sm:mb-24 gap-6 sm:gap-8 text-center md:text-left">
          <div className="max-w-2xl">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3 sm:mb-4">
               <div className="w-8 sm:w-10 h-[2px] bg-sky-500"></div>
               <span className="text-sky-600 font-black uppercase tracking-[0.5em] text-[8px] sm:text-[11px]">Signature Series</span>
            </div>
            <h2 className="text-3xl sm:text-7xl font-bold font-serif text-[var(--t-text)] leading-[1.1] tracking-tighter">Iconic Stays</h2>
            <p className="mt-4 sm:mt-6 text-slate-500 font-medium text-sm sm:text-xl opacity-80">Handpicked masterpieces for the discerning global traveler.</p>
          </div>
          <button onClick={() => onExplore()} className="w-full sm:w-auto group flex items-center justify-center gap-3 sm:gap-4 text-[9px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-white bg-slate-900 px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-full hover:bg-sky-600 transition-all shadow-2xl active:scale-95">
            View Catalog <i className="fa-solid fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-16">
          {featuredVillas.map(v => (
            <div key={v.id} className="animate-reveal" style={{ animationDelay: `${villas.indexOf(v) * 100}ms` }}>
              <VillaCard villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
