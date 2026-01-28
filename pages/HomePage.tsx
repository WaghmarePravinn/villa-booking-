
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

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
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
      
      {/* Refactored Hero Section */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex flex-col justify-center items-center px-4 overflow-hidden -mt-24 lg:-mt-32">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1920" 
            className="w-full h-full object-cover brightness-[0.45] lg:brightness-[0.6] transition-transform duration-[10s] ease-out scale-110" 
            style={{ 
              transform: `scale(${1.1 + scrollY * 0.00005}) translateY(${scrollY * 0.05}px)` 
            }}
            alt="Luxury Villa Background" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/30 to-[var(--t-bg)]"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center pt-24 lg:pt-32">
          {/* Hero Header Typography */}
          <div className="text-center mb-12 lg:mb-20 animate-reveal">
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full shadow-2xl">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              <span className="text-white text-[10px] lg:text-[12px] font-black uppercase tracking-[0.5em]">Defining Indian Luxury</span>
            </div>
            <h1 className="text-5xl md:text-8xl lg:text-[10rem] font-bold font-serif mb-6 text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
              Legacy Stay <br className="hidden lg:block" />
              <span className="text-sky-300 italic">Redefined</span>.
            </h1>
            <p className="text-white/80 text-base md:text-2xl lg:text-3xl max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-xl px-4 lg:px-0 mt-8 opacity-90 italic">
              A handpicked collection of the subcontinent's most breathtaking private retreats.
            </p>
          </div>

          {/* Optimized Search Hub Grid */}
          <div className="w-full max-w-6xl animate-reveal [animation-delay:400ms] z-[100] px-2 sm:px-0">
            <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] lg:rounded-full p-3 lg:p-4 shadow-[0_50px_100px_rgba(0,0,0,0.25)] border border-slate-50 flex flex-col lg:grid lg:grid-cols-12 items-stretch lg:items-center">
              
              {/* Destination Column */}
              <div className="lg:col-span-5 px-6 lg:px-12 py-5 lg:py-8 relative group border-b lg:border-b-0 lg:border-r border-slate-100" ref={locationRef}>
                <label className="block text-[10px] lg:text-[11px] font-black text-sky-600 uppercase tracking-widest mb-2 text-left">Where to?</label>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 shadow-inner">
                    <i className="fa-solid fa-map-location-dot text-lg"></i>
                  </div>
                  <input 
                    placeholder="Search destinations..." 
                    className="flex-grow bg-transparent outline-none text-lg lg:text-3xl font-black text-slate-800 placeholder:text-slate-200"
                    value={searchFilters.location} 
                    onFocus={() => setShowLocationSuggestions(true)}
                    onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                  />
                </div>
                
                {/* Responsive Location Suggestions */}
                {showLocationSuggestions && (
                  <div className="absolute top-[calc(100%+1rem)] left-0 lg:left-8 right-0 lg:right-auto lg:w-[450px] bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border border-slate-100 p-8 z-[200] animate-popup">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium Hotspots</p>
                      <button onClick={() => setShowLocationSuggestions(false)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 transition-all active:scale-90"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {HOTSPOT_LOCATIONS.map((loc) => (
                        <button key={loc.name} onClick={() => { setSearchFilters({...searchFilters, location: loc.name}); setShowLocationSuggestions(false); }}
                          className="text-left p-5 rounded-[1.5rem] hover:bg-sky-50 group transition-all border border-transparent hover:border-sky-100 active:scale-95">
                          <p className="text-[14px] font-black text-slate-800 group-hover:text-sky-600 truncate">{loc.name}</p>
                          <p className="text-[9px] font-black text-slate-300 uppercase mt-1 tracking-widest">{loc.count} Exclusive Stays</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date Selection Column */}
              <div 
                className="lg:col-span-4 px-6 lg:px-12 py-5 lg:py-8 cursor-pointer text-left group hover:bg-slate-50/50 transition-colors border-b lg:border-b-0 lg:border-r border-slate-100 relative"
                onClick={() => setShowPicker(true)}
              >
                <label className="block text-[10px] lg:text-[11px] font-black text-sky-600 uppercase tracking-widest mb-2">Check Period</label>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 shadow-inner">
                    <i className="fa-solid fa-calendar-check text-lg"></i>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-lg lg:text-3xl font-black ${searchFilters.checkIn ? 'text-slate-900' : 'text-slate-200'}`}>
                      {searchFilters.checkIn ? formatDateLabel(searchFilters.checkIn) : 'Arrive'}
                    </span>
                    <span className="text-slate-200 text-xs font-black">/</span>
                    <span className={`text-lg lg:text-3xl font-black ${searchFilters.checkOut ? 'text-slate-900' : 'text-slate-200'}`}>
                      {searchFilters.checkOut ? formatDateLabel(searchFilters.checkOut) : 'Depart'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Final Search Button Column */}
              <div className="lg:col-span-3 p-2">
                <button 
                  onClick={handleSearch} 
                  className="w-full h-full py-6 lg:py-8 rounded-[1.5rem] lg:rounded-full font-black text-[12px] lg:text-[15px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 bg-sky-600 text-white shadow-2xl shadow-sky-600/30 hover:bg-slate-900 transition-all active:scale-95 group"
                >
                  Explore <i className="fa-solid fa-compass group-hover:rotate-45 transition-transform"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Date Picker Overlay */}
      {showPicker && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade"
          onClick={() => setShowPicker(false)}
        >
           <div 
             className="relative animate-scale flex flex-col items-center max-w-full" 
             onClick={e => e.stopPropagation()}
           >
              <button 
                onClick={() => setShowPicker(false)}
                className="absolute -top-6 -right-6 w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl z-[1010] active:scale-90 hover:bg-sky-600 transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>

              <DateRangePicker 
                startDate={searchFilters.checkIn || ''} 
                endDate={searchFilters.checkOut || ''} 
                onChange={(s, e) => {
                  setSearchFilters({...searchFilters, checkIn: s, checkOut: e});
                }} 
                onClose={() => setShowPicker(false)} 
              />
           </div>
        </div>
      )}

      {/* Seasonal Offer Section */}
      <section className="max-w-7xl mx-auto px-6 mt-32 lg:mt-48">
        <div className={`p-1.5 bg-gradient-to-tr ${offer.gradient} rounded-[3rem] lg:rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.12)] animate-reveal`}>
          <div className="bg-white rounded-[2.8rem] lg:rounded-[4.8rem] p-10 lg:p-24 flex flex-col lg:grid lg:grid-cols-12 items-center gap-12 lg:gap-24">
            <div className="lg:col-span-7 text-center lg:text-left space-y-8">
               <div className="flex items-center justify-center lg:justify-start gap-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-inner">
                    <i className={`fa-solid ${offer.icon} text-2xl`}></i>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">Seasonal Highlight</span>
               </div>
               <h2 className="text-4xl lg:text-8xl font-bold font-serif text-slate-900 leading-[1] tracking-tighter">
                 {offer.title}
               </h2>
               <p className="text-slate-500 font-medium text-lg lg:text-3xl italic opacity-70 leading-relaxed max-w-2xl">
                 "{offer.desc}"
               </p>
            </div>
            <div className="lg:col-span-5 flex flex-col items-center gap-6 bg-slate-50 p-10 lg:p-16 rounded-[3rem] w-full shadow-inner border border-slate-100">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Direct Reward Code</p>
               <div className="w-full text-center px-10 py-6 bg-white border-2 border-dashed border-sky-100 rounded-3xl text-3xl lg:text-6xl font-black tracking-[0.3em] text-slate-900 shadow-sm uppercase">
                  {offer.code}
               </div>
               <button onClick={() => onExplore()} className="w-full mt-4 py-6 bg-slate-900 text-white rounded-2xl text-[11px] lg:text-[13px] font-black uppercase tracking-[0.4em] hover:bg-sky-600 transition-all shadow-2xl active:scale-95">
                 Claim Reward
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Methodology Pillars */}
      <section className="max-w-[1440px] mx-auto px-6 py-24 lg:py-52">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-20">
          {[
            { l: "Architectural Gems", d: "Every sanctuary in our portfolio undergoes a rigorous 100-point audit for design and structural legacy.", i: "fa-gem" },
            { l: "Elite Orchestration", d: "Personal concierge teams available 24/7 to manage every breath of your sanctuary experience.", i: "fa-concierge-bell" },
            { l: "Direct Integrity", d: "Secured transactions and absolute owner transparency to ensure your total peace of mind.", i: "fa-shield-heart" }
          ].map((trust, i) => (
            <div key={i} className="text-center p-12 lg:p-20 rounded-[4rem] bg-white border border-slate-50 shadow-sm hover:shadow-2xl transition-all group hover:-translate-y-2 duration-500">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-sky-50 rounded-[2rem] flex items-center justify-center text-3xl lg:text-4xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all mx-auto mb-10 shadow-inner">
                 <i className={`fa-solid ${trust.i}`}></i>
              </div>
              <h3 className="text-2xl lg:text-4xl font-bold font-serif text-slate-900 mb-6">{trust.l}</h3>
              <p className="text-sm lg:text-xl text-slate-500 font-medium leading-relaxed px-2 lg:px-8 opacity-70 italic">"{trust.d}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Signature Listing Showcase */}
      <section className="max-w-7xl mx-auto px-6 pb-24 lg:pb-52">
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end mb-20 lg:mb-32 gap-12 text-center lg:text-left">
          <div className="max-w-3xl">
            <div className="flex items-center justify-center lg:justify-start gap-5 mb-6">
               <div className="w-14 h-[2px] bg-sky-500"></div>
               <span className="text-sky-600 font-black uppercase tracking-[0.6em] text-[10px] lg:text-[13px]">The Collection</span>
            </div>
            <h2 className="text-5xl lg:text-9xl font-bold font-serif text-slate-900 leading-[0.9] tracking-tighter">Iconic Escapes</h2>
            <p className="mt-10 text-slate-500 font-medium text-lg lg:text-3xl opacity-80 leading-relaxed italic max-w-2xl">Handpicking the most breathtaking private sanctuaries across India.</p>
          </div>
          <button onClick={() => onExplore()} className="w-full lg:w-auto group flex items-center justify-center gap-5 text-[12px] lg:text-[14px] font-black uppercase tracking-[0.5em] text-white bg-slate-900 px-12 lg:px-20 py-6 lg:py-8 rounded-2xl lg:rounded-full hover:bg-sky-600 transition-all shadow-2xl active:scale-95 shrink-0">
            Catalog <i className="fa-solid fa-arrow-right group-hover:translate-x-4 transition-transform"></i>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-20">
          {featuredVillas.map(v => (
            <div key={v.id} className="animate-reveal" style={{ animationDelay: `${villas.indexOf(v) * 200}ms` }}>
              <VillaCard villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
