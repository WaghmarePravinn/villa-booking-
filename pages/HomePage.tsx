
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Villa, VillaFilters, SiteSettings, AppTheme, Testimonial } from '../types';
import VillaCard from '../components/VillaCard';
import DateRangePicker from '../components/DateRangePicker';
import { SERVICES, BRAND_NAME, HOTSPOT_LOCATIONS } from '../constants';
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFestivePopup, setShowFestivePopup] = useState(false);
  const [liveBooking, setLiveBooking] = useState<{name: string, location: string} | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  const locationRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [searchFilters, setSearchFilters] = useState<VillaFilters>({
    location: '',
    minPrice: 0,
    maxPrice: 150000,
    bedrooms: 0,
    guests: 2,
    checkIn: '',
    checkOut: ''
  });

  // Parallax Effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setMousePos({
      x: (clientX - centerX) / 50,
      y: (clientY - centerY) / 50
    });
  };

  // Fetch testimonials
  useEffect(() => {
    const unsub = subscribeToTestimonials(setTestimonials);
    return () => unsub();
  }, []);

  // Live Booking Simulations
  useEffect(() => {
    const names = ["Arjun", "Priya", "Vikram", "Sneha", "Kabir", "Anjali"];
    const locations = ["Goa", "Lonavala", "Karjat", "Alibaug", "Nashik"];
    
    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const loc = locations[Math.floor(Math.random() * locations.length)];
      setLiveBooking({ name, location: loc });
      setTimeout(() => setLiveBooking(null), 5000);
    }, 15000);

    const popupTimer = setTimeout(() => {
      const hasSeen = localStorage.getItem('republic_day_popup_seen');
      if (!hasSeen) {
        setShowFestivePopup(true);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(popupTimer);
    };
  }, []);

  const closeFestivePopup = () => {
    setShowFestivePopup(false);
    localStorage.setItem('republic_day_popup_seen', 'true');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

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

  const handleSearch = () => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      onExplore(searchFilters);
    }, 1000);
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

  const getCategoryIcon = (category: Testimonial['category']) => {
    switch (category) {
      case 'Trip': return 'fa-suitcase-rolling';
      case 'Booking': return 'fa-calendar-check';
      case 'Food': return 'fa-utensils';
      case 'Service': return 'fa-concierge-bell';
      case 'Hospitality': return 'fa-heart';
      default: return 'fa-star';
    }
  };

  return (
    <div className="space-y-24 pb-24 overflow-x-hidden relative bg-[#f0f9ff]" onMouseMove={handleMouseMove}>
      
      {/* Live Booking Notification */}
      {liveBooking && (
        <div className="fixed bottom-8 left-8 z-[1000] animate-popup">
          <div className="bg-white/90 backdrop-blur-xl border border-sky-100 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <p className="text-xs font-black text-sky-900 leading-none">{liveBooking.name} from Delhi</p>
              <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mt-1">Just booked in {liveBooking.location}</p>
            </div>
          </div>
        </div>
      )}

      {/* Festive Republic Day Popup */}
      {showFestivePopup && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-sky-900/40 backdrop-blur-xl animate-fade">
          <div className="max-w-md w-full bg-white rounded-[3.5rem] p-12 text-center relative shadow-[0_50px_100px_rgba(0,0,0,0.3)] animate-popup">
            <button onClick={closeFestivePopup} className="absolute top-8 right-8 text-sky-200 hover:text-sky-900 transition-colors">
              <i className="fa-solid fa-xmark text-2xl"></i>
            </button>
            
            <div className="relative w-24 h-24 mx-auto mb-8">
               <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-20"></div>
               <div className="w-full h-full bg-orange-500 rounded-full flex items-center justify-center text-white text-4xl shadow-xl">
                 <i className="fa-solid fa-flag"></i>
               </div>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-orange-500 text-orange-600 animate-chakra">
                 <i className="fa-solid fa-dharmachakra text-xl"></i>
               </div>
            </div>

            <h2 className="text-3xl font-bold font-serif text-sky-900 mb-4">Jai Hind!</h2>
            <p className="text-sky-600 font-medium mb-8 leading-relaxed">Celebrate the spirit of the Republic with an exclusive 26% discount on our entire collection.</p>
            
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 mb-8">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 block mb-2">Republic Day Special</span>
               <p className="text-3xl font-black text-orange-500 font-serif">FLAT 26% OFF</p>
            </div>

            <button onClick={closeFestivePopup} className="w-full republic-btn py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              Claim Offer & Browse
            </button>
          </div>
        </div>
      )}

      {/* Tri-color Confetti Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[2000] overflow-hidden">
          {[...Array(60)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-2 h-4"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animation: `confetti-fall ${2 + Math.random() * 3}s linear forwards`,
                backgroundColor: i % 3 === 0 ? '#FF9933' : (i % 3 === 1 ? '#ffffff' : '#128807'),
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <section className="relative h-[100vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 z-0 transition-transform duration-700 ease-out pointer-events-none"
          style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)` }}
        >
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" 
            alt="Hero background" 
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100/20 via-sky-50/50 to-sky-100/20"></div>
        </div>

        <div 
          className="relative z-10 text-center px-4 max-w-5xl mb-12 transition-transform duration-500 ease-out"
          style={{ transform: `translate(${-mousePos.x * 0.5}px, ${-mousePos.y * 0.5}px)` }}
        >
          <div className="mb-8 flex items-center justify-center gap-4 animate-reveal">
             <div className="h-[1px] w-12 bg-sky-500/50"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.5em] text-sky-600">{settings.promoText}</span>
             <div className="h-[1px] w-12 bg-sky-500/50"></div>
          </div>
          <h1 className="text-7xl md:text-[10rem] font-bold font-serif mb-8 drop-shadow-[0_20px_50px_rgba(14,165,233,0.1)] animate-reveal uppercase tracking-tighter text-theme-shimmer leading-none">
            {BRAND_NAME.split(' ')[0]} <br/> <span className="text-4xl md:text-6xl tracking-[0.2em] font-light italic">Sanctuary</span>
          </h1>
          <p className="text-xl md:text-3xl mb-16 text-sky-900 max-w-3xl mx-auto font-light leading-relaxed animate-reveal stagger-2">
            A tribute to the Republic. Discover a legacy of hospitality across India's most breathtaking retreats.
          </p>
        </div>

        {/* Floating Search Hub */}
        <div className="relative z-20 w-full max-w-6xl px-4 animate-scale stagger-3 float-animation">
          <div className="bg-white/80 backdrop-blur-3xl p-4 rounded-[3.5rem] shadow-[0_50px_100px_rgba(30,58,138,0.12)] flex flex-col md:flex-row items-center gap-4 border border-white">
            
            <div 
              className="flex-[1.2] w-full px-10 py-5 border-b md:border-b-0 md:border-r border-sky-100 hover:bg-sky-50/50 transition-colors rounded-[2.5rem] md:rounded-none relative group"
              ref={locationRef}
            >
              <label className="block text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2 group-hover:translate-x-1 transition-transform">Destination</label>
              <div className="flex items-center gap-3">
                 <i className="fa-solid fa-location-dot text-sky-200 group-hover:text-sky-600 transition-colors"></i>
                 <input 
                  type="text"
                  placeholder="Where to?"
                  className="w-full bg-transparent outline-none text-base font-bold text-sky-900 placeholder:text-sky-200"
                  value={searchFilters.location}
                  onFocus={() => {
                    setShowLocationSuggestions(true);
                    setShowPicker(false);
                  }}
                  onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                />
              </div>
              
              {showLocationSuggestions && (
                <div className="absolute top-full left-0 mt-8 w-full md:w-96 bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_30px_80px_rgba(30,58,138,0.15)] border border-sky-100 p-8 z-[110] animate-scale">
                  <p className="text-[10px] font-black text-sky-300 uppercase tracking-[0.3em] mb-6">Republic Hotspots</p>
                  <div className="space-y-2">
                    {filteredLocations.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => {
                          setSearchFilters({...searchFilters, location: loc.name});
                          setShowLocationSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-4 rounded-2xl hover:bg-sky-50 group flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <img src={loc.image} className="w-10 h-10 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                          <span className="text-sm font-bold text-sky-700 group-hover:text-sky-900">{loc.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-sky-200 group-hover:text-sky-600 transition-colors">{loc.count} Stays</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div 
              className={`flex-[1.8] w-full px-10 py-5 border-b md:border-b-0 md:border-r border-sky-100 relative group transition-all cursor-pointer rounded-[2.5rem] md:rounded-none ${showPicker ? 'bg-sky-50' : 'hover:bg-sky-50/50'}`}
              onClick={() => {
                setShowPicker(true);
                setShowLocationSuggestions(false);
              }}
            >
              <label className="block text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                <i className="fa-solid fa-calendar-days text-[11px]"></i>
                Booking Windows
              </label>
              <div className="flex items-center gap-6">
                <div className={`text-base font-bold ${searchFilters.checkIn ? 'text-sky-900' : 'text-sky-300'}`}>
                  {formatDateString(searchFilters.checkIn) || 'Arrival'}
                </div>
                <div className="w-8 h-[1px] bg-sky-200"></div>
                <div className={`text-base font-bold ${searchFilters.checkOut ? 'text-sky-900' : 'text-sky-300'}`}>
                  {formatDateString(searchFilters.checkOut) || 'Departure'}
                </div>
              </div>
            </div>

            <div className="p-2 w-full md:w-auto">
              <button 
                onClick={handleSearch}
                className="theme-btn px-16 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-4 w-full justify-center group shadow-2xl active:scale-95 border-none"
              >
                Explore Sanctum
                <i className="fa-solid fa-arrow-right-long group-hover:translate-x-2 transition-transform"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Chronicles / Reviews Section */}
      <section className="py-32 bg-slate-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 flex flex-col md:flex-row justify-between items-end gap-10 relative z-10">
          <div className="max-w-2xl">
             <span className="text-sky-500 font-black uppercase tracking-[0.6em] text-[10px] mb-4 block">The Global Feed</span>
             <h2 className="text-5xl md:text-7xl font-bold font-serif text-white leading-none mb-6">Voices of the Sanctuary</h2>
             <p className="text-slate-400 font-light text-lg">Real feedback covering everything from recently done trips to our premium food service.</p>
          </div>
          <button onClick={() => (window as any).location.hash = 'testimonials'} className="republic-btn-outline px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white border border-white/20 hover:bg-white hover:text-slate-900 transition-all">Read More Stories</button>
        </div>

        <div className="flex animate-[marquee_50s_linear_infinite] whitespace-nowrap gap-10 hover:[animation-play-state:paused] py-10">
           {[...testimonials, ...testimonials].map((t, i) => (
             <div key={`${t.id}-${i}`} className="inline-block w-[450px] bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[4rem] group hover:bg-white hover:shadow-2xl transition-all duration-700 cursor-default">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-1 text-sky-400 text-[10px]">
                    {[...Array(t.rating)].map((_, star) => <i key={star} className="fa-solid fa-star"></i>)}
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 group-hover:bg-slate-900 group-hover:text-white px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
                    <i className={`fa-solid ${getCategoryIcon(t.category)}`}></i>
                    {t.category}
                  </div>
                </div>
                <p className="text-slate-300 group-hover:text-slate-700 whitespace-normal leading-loose font-medium mb-12 text-xl italic line-clamp-3">"{t.content}"</p>
                <div className="flex items-center gap-6 mt-auto border-t border-white/10 group-hover:border-slate-100 pt-10">
                  <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden shadow-2xl transition-transform group-hover:rotate-3">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-slate-900 text-base">{t.name}</h4>
                    <p className="text-[9px] text-sky-400 font-black uppercase tracking-[0.2em] mt-1">
                      {t.category === 'Food' ? 'Culinary Review' : t.category === 'Trip' ? 'Travel Review' : 'Verified Stay'}
                    </p>
                  </div>
                </div>
             </div>
           ))}
        </div>
        
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-[150px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      </section>

      {/* Interactive Stats Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" ref={statsRef}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
          {[
            { label: "Elite Sanctums", value: "500+", icon: "fa-hotel", color: "text-sky-600" },
            { label: "Indian Cities", value: "24+", icon: "fa-map-location-dot", color: "text-sky-600" },
            { label: "Satisfied Guests", value: "12k", icon: "fa-users-viewfinder", color: "text-sky-600" },
            { label: "Expert Concierge", value: "100%", icon: "fa-user-tie", color: "text-sky-900" }
          ].map((stat, i) => (
            <div key={i} className="group bg-white p-8 rounded-[3rem] border border-sky-100 hover:shadow-2xl transition-all duration-700 text-center animate-reveal" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`w-14 h-14 mx-auto mb-6 rounded-2xl bg-sky-50 flex items-center justify-center text-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                 <i className={`fa-solid ${stat.icon}`}></i>
              </div>
              <p className="text-4xl font-bold font-serif text-sky-900 mb-2">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-20 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl">
            <span className="text-sky-600 font-black uppercase tracking-[0.5em] text-[10px] mb-4 block">Hand-Picked Legacy</span>
            <h2 className="text-5xl md:text-8xl font-bold font-serif text-sky-900 leading-none">Patriotic Premier Stays</h2>
          </div>
          <button onClick={() => onExplore()} className="group flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-sky-600 hover:text-sky-500 transition-all border border-sky-100 hover:border-sky-200 px-12 py-6 rounded-[2rem] bg-white shadow-sm hover:shadow-2xl active:scale-95">
            Explore All Collection <i className="fa-solid fa-chevron-right group-hover:translate-x-2 transition-transform"></i>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {featuredVillas.map(v => (
            <VillaCard key={v.id} villa={v} whatsappNumber={settings.whatsappNumber} onViewDetails={onViewDetails} />
          ))}
        </div>
      </section>

      {showPicker && (
        <div 
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 bg-sky-900/10 backdrop-blur-md animate-fade overflow-y-auto"
          onClick={() => setShowPicker(false)}
        >
          <div className="relative w-full max-w-4xl my-auto" onClick={e => e.stopPropagation()}>
            <DateRangePicker 
              startDate={searchFilters.checkIn || ''} 
              endDate={searchFilters.checkOut || ''} 
              onChange={handleDatesChange}
              onClose={() => setShowPicker(false)}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .republic-btn-outline {
            border: 2px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
};

export default HomePage;
