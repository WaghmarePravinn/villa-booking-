
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Villa, VillaFilters } from '../types';
import VillaCard from '../components/VillaCard';
import DateRangePicker from '../components/DateRangePicker';
import { SERVICES, TESTIMONIALS, BRAND_NAME, HOTSPOT_LOCATIONS } from '../constants';

interface HomePageProps {
  villas: Villa[];
  onExplore: (filters?: VillaFilters) => void;
  onViewDetails: (id: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ villas, onExplore, onViewDetails }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const [searchFilters, setSearchFilters] = useState<VillaFilters>({
    location: '',
    minPrice: 0,
    maxPrice: 150000,
    bedrooms: 0,
    guests: 2,
    checkIn: '',
    checkOut: ''
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const featuredVillas = villas.filter(v => v.isFeatured).slice(0, 6);

  const filteredLocations = useMemo(() => {
    const query = searchFilters.location.toLowerCase().trim();
    if (!query) return HOTSPOT_LOCATIONS;
    return HOTSPOT_LOCATIONS.filter(loc => loc.name.toLowerCase().includes(query));
  }, [searchFilters.location]);

  const stayDuration = useMemo(() => {
    if (searchFilters.checkIn && searchFilters.checkOut) {
      const [y1, m1, d1] = searchFilters.checkIn.split('-').map(Number);
      const [y2, m2, d2] = searchFilters.checkOut.split('-').map(Number);
      const start = new Date(y1, m1 - 1, d1);
      const end = new Date(y2, m2 - 1, d2);
      const diff = end.getTime() - start.getTime();
      const nights = Math.round(diff / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 0;
    }
    return 0;
  }, [searchFilters.checkIn, searchFilters.checkOut]);

  const handleSearch = () => {
    onExplore(searchFilters);
  };

  const formatDateString = (dateStr: string | undefined) => {
    if (!dateStr) return 'Add dates';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-24 pb-24 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-[95vh] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 scale-110 animate-pulse-slow">
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" 
            alt="Hero background" 
            className="w-full h-full object-cover brightness-[0.35]"
          />
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mb-12">
          <h1 className="text-6xl md:text-9xl font-bold font-serif mb-6 drop-shadow-2xl animate-reveal uppercase tracking-tighter stagger-1">
            {BRAND_NAME}
          </h1>
          <p className="text-lg md:text-2xl mb-12 text-slate-200 max-w-2xl mx-auto font-light leading-relaxed animate-reveal stagger-2">
            Hand-picked luxury villas for your ultimate sanctuary. Managed with perfection, designed for you.
          </p>
        </div>

        {/* Enhanced High Selling Search Bar */}
        <div className="relative z-20 w-full max-w-6xl px-4 animate-scale stagger-3">
          <div className="bg-white/95 backdrop-blur-3xl p-3 rounded-[2rem] md:rounded-full shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center gap-2 border border-white/40">
            
            <div 
              className="flex-[1.2] w-full px-8 py-3 border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-100/50 transition-colors rounded-t-2xl md:rounded-none relative"
              ref={locationRef}
            >
              <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Location</label>
              <input 
                type="text"
                placeholder="Where are you going?"
                className="w-full bg-transparent outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400"
                value={searchFilters.location}
                onFocus={() => {
                  setShowLocationSuggestions(true);
                  setShowPicker(false);
                }}
                onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
              />
              
              {showLocationSuggestions && (
                <div className="absolute top-full left-0 mt-4 w-full md:w-80 bg-white rounded-[2rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] border border-gray-100 p-6 z-[110] animate-scale">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Popular Destinations</p>
                  <div className="space-y-1">
                    {filteredLocations.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => {
                          setSearchFilters({...searchFilters, location: loc.name});
                          setShowLocationSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-2xl hover:bg-amber-50 group flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <i className="fa-solid fa-location-dot text-amber-500/50 group-hover:text-amber-600"></i>
                          <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{loc.name}</span>
                        </div>
                        <span className="text-[9px] font-black text-amber-600/0 group-hover:text-amber-600/100 uppercase tracking-widest">Select</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div 
              className={`flex-[1.8] w-full px-8 py-3 border-b md:border-b-0 md:border-r border-gray-100 relative group transition-colors cursor-pointer ${showPicker ? 'bg-amber-50' : 'hover:bg-gray-100/50'}`}
              onClick={() => {
                setShowPicker(true);
                setShowLocationSuggestions(false);
              }}
            >
              <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 flex justify-between items-center pointer-events-none">
                Stay Period
                {stayDuration > 0 && <span className="text-white bg-amber-500 px-2.5 py-0.5 rounded-full text-[9px] font-black">{stayDuration} Nights</span>}
              </label>
              <div className="flex items-center gap-3 pointer-events-none">
                <div className={`text-sm font-semibold ${searchFilters.checkIn ? 'text-slate-900' : 'text-gray-400'}`}>
                  {formatDateString(searchFilters.checkIn)}
                </div>
                <i className="fa-solid fa-arrow-right-long text-amber-500/30 text-[10px]"></i>
                <div className={`text-sm font-semibold ${searchFilters.checkOut ? 'text-slate-900' : 'text-gray-400'}`}>
                  {formatDateString(searchFilters.checkOut)}
                </div>
              </div>
            </div>

            <div className="flex-1 w-full px-8 py-3 border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-100/50 transition-colors">
              <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 flex justify-between">
                Max Price <span className="text-slate-900 font-black">₹{searchFilters.maxPrice.toLocaleString()}</span>
              </label>
              <input 
                type="range"
                min="5000"
                max="200000"
                step="5000"
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
                value={searchFilters.maxPrice}
                onChange={(e) => setSearchFilters({...searchFilters, maxPrice: Number(e.target.value)})}
              />
            </div>

            <div className="flex-[0.8] w-full px-8 py-3 border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-100/50 transition-colors">
              <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Guests</label>
              <select 
                className="w-full bg-transparent outline-none text-sm font-semibold text-gray-900 appearance-none cursor-pointer"
                value={searchFilters.guests}
                onChange={(e) => setSearchFilters({...searchFilters, guests: Number(e.target.value)})}
              >
                {[...Array(20)].map((_, i) => (
                  <option key={i} value={i+1}>{i+1} Guests</option>
                ))}
              </select>
            </div>

            <div className="p-2 w-full md:w-auto">
              <button 
                onClick={handleSearch}
                className="bg-slate-900 text-white px-10 py-5 rounded-3xl md:rounded-full font-bold text-sm hover:bg-black transition-all flex items-center gap-3 w-full justify-center group shadow-xl active:scale-95"
              >
                <i className="fa-solid fa-search group-hover:scale-110 transition-transform"></i>
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FIXED DATE PICKER OVERLAY */}
      {showPicker && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowPicker(false)}
        >
          <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowPicker(false)}
              className="absolute -top-12 right-0 text-white hover:text-amber-400 transition-colors flex items-center gap-2 font-black uppercase text-xs tracking-widest"
            >
              Close <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            <DateRangePicker 
              startDate={searchFilters.checkIn || ''} 
              endDate={searchFilters.checkOut || ''} 
              onChange={(start, end) => setSearchFilters({...searchFilters, checkIn: start, checkOut: end})}
              onClose={() => setShowPicker(false)}
            />
          </div>
        </div>
      )}

      {/* Popular Destinations Quick Browse */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:text-left">
          <span className="text-amber-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Destination Explorer</span>
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900">Explore Hotspots</h2>
        </div>
        <div className="flex overflow-x-auto gap-6 pb-8 no-scrollbar scroll-smooth snap-x">
          {HOTSPOT_LOCATIONS.map((loc, idx) => (
            <div 
              key={loc.name}
              onClick={() => onExplore({ ...searchFilters, location: loc.name })}
              className="flex-shrink-0 w-64 md:w-72 h-80 md:h-96 rounded-[3rem] overflow-hidden relative group cursor-pointer snap-start animate-reveal"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <img src={loc.image} alt={loc.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-amber-900/80 transition-colors duration-500"></div>
              <div className="absolute bottom-10 left-10">
                <h3 className="text-2xl font-black text-white font-serif mb-1">{loc.name}</h3>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{loc.count} Exclusive Stays</p>
              </div>
              <div className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-500">
                <i className="fa-solid fa-arrow-right"></i>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <span className="text-amber-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Recommended Collection</span>
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-3">Trending Villas</h2>
            <p className="text-slate-500 text-lg">Curated collections of our highest-selling properties this season.</p>
          </div>
          <button 
            onClick={() => onExplore()}
            className="flex items-center gap-2 text-amber-600 font-bold hover:text-amber-700 group px-6 py-3 rounded-full hover:bg-amber-50 transition-all"
          >
            All Destinations <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {featuredVillas.map((villa, idx) => (
            <div 
              key={villa.id} 
              className="animate-reveal" 
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <VillaCard villa={villa} onViewDetails={onViewDetails} />
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-slate-900 py-32 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="animate-reveal stagger-1">
              <h2 className="text-4xl md:text-7xl font-bold font-serif mb-8 leading-tight">Beyond Simply <br/><span className="text-amber-500 italic">Accommodation</span></h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl font-light">
                {BRAND_NAME} is your full-service hospitality partner. We ensure every aspect of your holiday is managed by our dedicated on-ground teams.
              </p>
              <button 
                onClick={() => onExplore()}
                className="px-10 py-5 bg-white text-slate-900 font-bold rounded-2xl hover:bg-amber-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95"
              >
                Learn About Our Services
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SERVICES.map((service, idx) => (
                <div 
                  key={service.id} 
                  className="bg-slate-800/40 backdrop-blur-md p-10 rounded-[2.5rem] border border-slate-700/50 hover:border-amber-500 transition-all group animate-reveal"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-amber-500 transition-colors">
                    <i className={`fa-solid ${service.icon} text-3xl text-amber-500 group-hover:text-white`}></i>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-light">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-20 animate-reveal">
          <span className="text-amber-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Our Reputation</span>
          <h2 className="text-4xl md:text-5xl font-bold font-serif mt-4 text-slate-900">Trusted by Discernment</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div 
              key={t.id} 
              className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-2xl hover:-translate-y-4 transition-all duration-700 animate-reveal"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex text-amber-400 mb-8 text-[10px] gap-1">
                {[...Array(t.rating)].map((_, i) => (
                  <i key={i} className="fa-solid fa-star"></i>
                ))}
              </div>
              <p className="text-slate-600 italic mb-10 flex-grow leading-relaxed font-light text-lg">"{t.content}"</p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                  <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                  <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest">Verified Guest</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes pulseSlow {
          0%, 100% { transform: scale(1.05); }
          50% { transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulseSlow 20s ease-in-out infinite;
        }
        .animate-reveal {
          animation: revealUp 1s var(--ease-out-expo) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
