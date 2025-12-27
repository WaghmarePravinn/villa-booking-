
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
    if (!dateStr || dateStr.trim() === '') return null;
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch (e) {
      return null;
    }
  };

  const handleDatesChange = useCallback((start: string, end: string) => {
    setSearchFilters(prev => ({
      ...prev,
      checkIn: start,
      checkOut: end
    }));
  }, []);

  return (
    <div className="space-y-24 pb-24 overflow-x-hidden">
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

        <div className="relative z-20 w-full max-w-6xl px-4 animate-scale stagger-3">
          <div className="bg-white/95 backdrop-blur-3xl p-3 rounded-[2.5rem] md:rounded-full shadow-[0_40px_100px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center gap-2 border border-white/40">
            
            <div 
              className="flex-[1.2] w-full px-8 py-4 border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-100/50 transition-colors rounded-t-3xl md:rounded-none relative"
              ref={locationRef}
            >
              <label className="block text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Destination</label>
              <input 
                type="text"
                placeholder="Where to go?"
                className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300"
                value={searchFilters.location}
                onFocus={() => {
                  setShowLocationSuggestions(true);
                  setShowPicker(false);
                }}
                onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
              />
              
              {showLocationSuggestions && (
                <div className="absolute top-full left-0 mt-6 w-full md:w-80 bg-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.2)] border border-gray-100 p-8 z-[110] animate-scale">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Popular Hotspots</p>
                  <div className="space-y-2">
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
                          <i className="fa-solid fa-location-dot text-amber-500/30 group-hover:text-amber-500"></i>
                          <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{loc.name}</span>
                        </div>
                        <i className="fa-solid fa-arrow-right text-[10px] text-amber-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"></i>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div 
              className={`flex-[1.8] w-full px-8 py-4 border-b md:border-b-0 md:border-r border-gray-100 relative group transition-all cursor-pointer ${showPicker ? 'bg-amber-50' : 'hover:bg-gray-100/50'}`}
              onClick={() => {
                setShowPicker(true);
                setShowLocationSuggestions(false);
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-calendar-days text-[10px]"></i>
                  Stay Duration
                </label>
                {stayDuration > 0 && <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">{stayDuration} Nights</span>}
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-sm font-bold ${searchFilters.checkIn ? 'text-slate-900' : 'text-slate-300'}`}>
                  {formatDateString(searchFilters.checkIn) || 'Check-in'}
                </div>
                <i className="fa-solid fa-arrow-right-long text-amber-400 text-[10px]"></i>
                <div className={`text-sm font-bold ${searchFilters.checkOut ? 'text-slate-900' : 'text-slate-300'}`}>
                  {formatDateString(searchFilters.checkOut) || 'Check-out'}
                </div>
              </div>
            </div>

            <div className="flex-1 w-full px-8 py-4 border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-100/50 transition-colors">
              <label className="block text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1 flex justify-between">
                Max Budget <span className="text-slate-900 font-black">₹{(searchFilters.maxPrice/1000).toFixed(0)}k</span>
              </label>
              <input 
                type="range"
                min="5000"
                max="200000"
                step="5000"
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-3"
                value={searchFilters.maxPrice}
                onChange={(e) => setSearchFilters({...searchFilters, maxPrice: Number(e.target.value)})}
              />
            </div>

            <div className="p-3 w-full md:w-auto">
              <button 
                onClick={handleSearch}
                className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] md:rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 w-full justify-center group shadow-2xl active:scale-95"
              >
                <i className="fa-solid fa-search group-hover:scale-110 transition-transform"></i>
                Find Sanctuary
              </button>
            </div>
          </div>
        </div>
      </section>

      {showPicker && (
        <div 
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 bg-slate-900/70 backdrop-blur-md animate-fade overflow-y-auto"
          onClick={() => setShowPicker(false)}
        >
          <div className="relative w-full max-w-4xl my-auto" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowPicker(false)}
              className="absolute -top-14 right-0 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full text-white flex items-center justify-center transition-all group z-[510]"
            >
              <i className="fa-solid fa-xmark text-xl group-hover:rotate-90 transition-transform"></i>
            </button>
            <DateRangePicker 
              startDate={searchFilters.checkIn || ''} 
              endDate={searchFilters.checkOut || ''} 
              onChange={handleDatesChange}
              onClose={() => setShowPicker(false)}
            />
          </div>
        </div>
      )}

      {/* Featured Hotspots */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:text-left">
          <span className="text-amber-600 font-black uppercase tracking-[0.4em] text-[9px] mb-4 block">Destination Hubs</span>
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900">Explore Hotspots</h2>
        </div>
        <div className="flex overflow-x-auto gap-8 pb-10 no-scrollbar scroll-smooth snap-x">
          {HOTSPOT_LOCATIONS.map((loc, idx) => (
            <div 
              key={loc.name}
              onClick={() => onExplore({ ...searchFilters, location: loc.name })}
              className="flex-shrink-0 w-72 md:w-80 h-96 md:h-[28rem] rounded-[3rem] overflow-hidden relative group cursor-pointer snap-start animate-reveal"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <img src={loc.image} alt={loc.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent group-hover:from-amber-900/60 transition-all duration-700"></div>
              <div className="absolute bottom-10 left-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-3xl font-bold text-white font-serif mb-2">{loc.name}</h3>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">{loc.count} Boutique Stays</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Villas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <span className="text-amber-600 font-black uppercase tracking-[0.4em] text-[9px] mb-4 block">Recommended Selection</span>
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-4">Trending Villas</h2>
            <p className="text-slate-500 text-lg font-light">Curated collections of our most desired retreats this season.</p>
          </div>
          <button 
            onClick={() => onExplore()}
            className="flex items-center gap-3 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:text-amber-600 group px-8 py-4 rounded-2xl hover:bg-amber-50 transition-all border border-gray-100"
          >
            Full Catalog <i className="fa-solid fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
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
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-amber-500/5 rounded-full -mr-40 -mt-40 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="animate-reveal">
              <h2 className="text-5xl md:text-7xl font-bold font-serif mb-10 leading-tight">Beyond Just <br/><span className="text-amber-500 italic">Lodging</span></h2>
              <p className="text-slate-400 text-xl leading-relaxed mb-12 max-w-xl font-light">
                {BRAND_NAME} is your comprehensive lifestyle partner. From personal chefs to custom event planning, our dedicated on-ground concierge ensures every request is fulfilled.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {SERVICES.map((service, idx) => (
                <div 
                  key={service.id} 
                  className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 hover:border-amber-500/50 transition-all group animate-reveal shadow-lg hover:shadow-amber-500/10"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-amber-500 transition-all duration-500">
                    <i className={`fa-solid ${service.icon} text-3xl text-amber-500 group-hover:text-white`}></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 font-serif">{service.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-light">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulseSlow {
          0%, 100% { transform: scale(1.02); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulseSlow 25s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default HomePage;
