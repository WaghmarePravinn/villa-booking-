
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
  const [scrollY, setScrollY] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  const locationRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

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
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
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
    <div className="bg-[#fcfdfe] pb-24">
      
      {/* Hero Section - Better scaling for small devices */}
      <section className="relative min-h-[85vh] sm:min-h-[80vh] flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1920" 
            className="w-full h-full object-cover brightness-[0.5] sm:brightness-[0.7] transition-transform duration-[10s] ease-linear scale-110" 
            style={{ transform: `scale(${1.1 + scrollY * 0.0001}) translateY(${scrollY * 0.1}px)` }}
            alt="Hero Background" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/20 to-[#fcfdfe]"></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl mb-12 sm:mb-20 px-4 animate-reveal">
          <div className="inline-flex items-center gap-3 mb-6 px-5 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em]">Elite Sanctuary Collection</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold font-serif mb-6 text-white leading-[1] tracking-tighter drop-shadow-2xl">
            Legacy Stays <br className="hidden sm:block" />
            <span className="text-sky-300 italic">Redefined</span>.
          </h1>
          <p className="text-white/80 text-sm sm:text-xl max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md px-4">
            Hand-picked private retreats curated for the discerning traveler. Find your next masterpiece of comfort.
          </p>
        </div>

        {/* Improved Search Hub - Mobile Stack vs Desktop Row */}
        <div className="relative z-[100] w-full max-w-6xl px-4 animate-reveal [animation-delay:300ms]">
          <div className="bg-white rounded-[2rem] sm:rounded-full p-2 sm:p-3 shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-50">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
              
              {/* Destination - Flexible Width */}
              <div className="flex-1 px-6 sm:px-10 py-5 sm:py-6 relative group border-b lg:border-b-0 lg:border-r border-slate-100" ref={locationRef}>
                <label className="block text-[8px] sm:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1.5 text-left">Destination</label>
                <div className="flex items-center gap-4">
                  <i className="fa-solid fa-map-pin text-sky-400 text-lg"></i>
                  <input 
                    placeholder="Where to?" 
                    className="w-full bg-transparent outline-none text-base sm:text-xl font-bold text-slate-800 placeholder:text-slate-200"
                    value={searchFilters.location} 
                    onFocus={() => setShowLocationSuggestions(true)}
                    onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                  />
                </div>
                
                {showLocationSuggestions && (
                  <div className="absolute top-[calc(100%+1rem)] left-0 lg:left-8 right-0 lg:right-auto lg:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[200] animate-popup">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Popular Hotspots</p>
                      <button onClick={() => setShowLocationSuggestions(false)} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {HOTSPOT_LOCATIONS.map((loc) => (
                        <button key={loc.name} onClick={() => { setSearchFilters({...searchFilters, location: loc.name}); setShowLocationSuggestions(false); }}
                          className="text-left p-3 rounded-2xl hover:bg-sky-50 group transition-all border border-transparent hover:border-sky-100">
                          <p className="text-[11px] font-bold text-slate-700 group-hover:text-sky-600">{loc.name}</p>
                          <p className="text-[8px] font-black text-slate-400 opacity-60 uppercase">{loc.count} Properties</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date Picker - Unified Popover */}
              <div className="flex-1 px-6 sm:px-10 py-5 sm:py-6 cursor-pointer text-left group hover:bg-slate-50/50 transition-colors border-b lg:border-b-0 lg:border-r border-slate-100 relative"
                ref={datePickerRef} onClick={() => setShowPicker(!showPicker)}>
                <label className="block text-[8px] sm:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1.5">Stay Period</label>
                <div className="flex items-center gap-4">
                  <i className="fa-solid fa-calendar-alt text-sky-400 text-lg"></i>
                  <div className="flex items-center gap-3">
                    <span className={`text-base sm:text-lg font-bold ${searchFilters.checkIn ? 'text-slate-900' : 'text-slate-300'}`}>
                      {searchFilters.checkIn ? searchFilters.checkIn.split('-').reverse().slice(0, 2).join('/') : 'Arrival'}
                    </span>
                    <i className="fa-solid fa-arrow-right-long text-[10px] text-slate-200"></i>
                    <span className={`text-base sm:text-lg font-bold ${searchFilters.checkOut ? 'text-slate-900' : 'text-slate-300'}`}>
                      {searchFilters.checkOut ? searchFilters.checkOut.split('-').reverse().slice(0, 2).join('/') : 'Departure'}
                    </span>
                  </div>
                </div>

                {showPicker && (
                  <div className="absolute top-[calc(100%+1rem)] left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 z-[300] w-[95vw] lg:w-auto animate-scale" onClick={e => e.stopPropagation()}>
                    <DateRangePicker 
                      startDate={searchFilters.checkIn || ''} 
                      endDate={searchFilters.checkOut || ''} 
                      onChange={(s, e) => setSearchFilters({...searchFilters, checkIn: s, checkOut: e})} 
                      onClose={() => setShowPicker(false)} 
                    />
                  </div>
                )}
              </div>

              {/* Search Trigger */}
              <div className="p-2 sm:p-3 w-full lg:w-auto">
                <button 
                  onClick={handleSearch} 
                  className="w-full lg:w-auto px-10 sm:px-16 py-5 sm:py-6 rounded-2xl sm:rounded-full font-black text-[11px] sm:text-[13px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 bg-sky-600 text-white shadow-2xl shadow-sky-600/20 hover:bg-sky-700 hover:scale-105 active:scale-95 transition-all"
                >
                  Find My Sanctuary <i className="fa-solid fa-compass animate-spin-slow"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Grid - Elegant Icons and Typography */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:py-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {[
            { l: "Vetted Collection", d: "A strict 100-point audit for every featured architectural masterpiece.", i: "fa-gem" },
            { l: "Elite Concierge", d: "Personal stay orchestrators available 24/7 for your specific needs.", i: "fa-concierge-bell" },
            { l: "Legacy Guarantee", d: "Peace of mind through secure bookings and transparent stay policies.", i: "fa-shield-heart" }
          ].map((trust, i) => (
            <div key={i} className="text-center p-10 rounded-[3rem] bg-white border border-slate-50 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-sky-50 rounded-[2rem] flex items-center justify-center text-2xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all mx-auto mb-8 shadow-inner">
                 <i className={`fa-solid ${trust.i}`}></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mb-4">{trust.l}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">{trust.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Selection - Grid that scales from 1 to 3 columns */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 sm:mb-24 gap-8">
          <div className="max-w-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-[2px] bg-sky-500"></div>
               <span className="text-sky-600 font-black uppercase tracking-[0.5em] text-[9px] sm:text-[11px]">The Gold List</span>
            </div>
            <h2 className="text-4xl sm:text-7xl font-bold font-serif text-slate-900 leading-[1] tracking-tighter">Signature Stays</h2>
            <p className="mt-6 text-slate-500 font-medium text-base sm:text-xl">Discover architectural marvels handpicked for those who appreciate the finer things.</p>
          </div>
          <button onClick={() => onExplore()} className="w-full sm:w-auto group flex items-center justify-center gap-4 text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-white bg-slate-900 px-10 py-5 rounded-2xl sm:rounded-full hover:bg-sky-600 transition-all shadow-2xl active:scale-95">
            View All Catalog <i className="fa-solid fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-16">
          {featuredVillas.map(v => (
            <div key={v.id} className="animate-reveal" style={{ animationDelay: `${villas.indexOf(v) * 100}ms` }}>
              <VillaCard villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
