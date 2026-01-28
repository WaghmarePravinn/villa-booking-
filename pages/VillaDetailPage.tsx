
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Villa, User, SiteSettings } from '../types';
import DateRangePicker from '../components/DateRangePicker';
import VillaCard from '../components/VillaCard';
import { saveLead } from '../services/leadService';

interface VillaDetailPageProps {
  villa: Villa;
  allVillas: Villa[];
  settings: SiteSettings;
  user: User | null;
  onBack: () => void;
  onViewDetails: (id: string) => void;
}

const VillaDetailPage: React.FC<VillaDetailPageProps> = ({ villa, allVillas, settings, user, onBack, onViewDetails }) => {
  const [scrolled, setScrolled] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [activeImage, setActiveImage] = useState(villa.imageUrls?.[0] || '');
  const [showSuccess, setShowSuccess] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (villa.imageUrls && villa.imageUrls.length > 0) {
      if (!activeImage || !villa.imageUrls.includes(activeImage)) {
        setActiveImage(villa.imageUrls[0]);
      }
    }
  }, [villa.id, villa.imageUrls]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const similarVillas = useMemo(() => {
    if (!allVillas || allVillas.length === 0) return [];

    return allVillas
      .filter(v => v.id !== villa.id)
      .map(v => {
        let score = 0;
        if (v.location.split(',')[0].trim() === villa.location.split(',')[0].trim()) score += 15;
        const priceDiff = Math.abs(v.pricePerNight - villa.pricePerNight);
        const priceTolerance = villa.pricePerNight * 0.25;
        if (priceDiff <= priceTolerance) score += 10;
        if (Math.abs(v.capacity - villa.capacity) <= 2) score += 5;
        if (v.bedrooms === villa.bedrooms) score += 8;
        return { villa: v, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.villa);
  }, [villa, allVillas]);

  const handleWhatsApp = async () => {
    try {
      await saveLead({ 
        villaId: villa.id, 
        villaName: villa.name, 
        source: 'Direct Inquiry', 
        userId: user?.id, 
        customerName: user?.username, 
        checkIn: checkIn || undefined, 
        checkOut: checkOut || undefined 
      });
      setShowSuccess(true);
      setTimeout(() => {
        const message = encodeURIComponent(`Namaste! I'm interested in ${villa.name} stay: ${checkIn || 'dates flexible'} to ${checkOut || 'dates flexible'}. Please confirm availability.`);
        window.open(`https://wa.me/${settings.whatsappNumber}?text=${message}`, '_blank');
        setShowSuccess(false);
      }, 2000);
    } catch (error) { alert("Inquiry failed. Please try again."); }
  };

  return (
    <div className="bg-[#fcfdfe] min-h-screen pb-48 lg:pb-32 animate-reveal">
      {showSuccess && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-2xl animate-fade p-6">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center animate-scale max-w-sm w-full border border-white/20">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
              <i className="fa-solid fa-check text-4xl text-emerald-500"></i>
            </div>
            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-4 leading-tight">Request Logged</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed opacity-80">Connecting you with our specialized concierge on WhatsApp...</p>
          </div>
        </div>
      )}

      {/* Persistent Back Button - Positioned to clear top nav */}
      <div className="max-w-7xl mx-auto px-6 mb-8 flex items-center">
         <button onClick={onBack} className="flex items-center gap-3 text-slate-400 hover:text-sky-600 transition-all group">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-sky-50 transition-colors">
              <i className="fa-solid fa-arrow-left text-[10px]"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Return to Collection</span>
         </button>
      </div>

      {/* Scrolled Header HUD */}
      <header className={`fixed top-4 sm:top-6 left-4 right-4 sm:left-10 sm:right-10 z-[210] transition-all duration-700 h-16 sm:h-20 ${scrolled ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="h-full bg-white/95 backdrop-blur-3xl border border-slate-100 rounded-full px-6 sm:px-10 flex items-center justify-between shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)]">
           <button onClick={onBack} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-sky-600 transition-all flex items-center gap-3 active:scale-90">
             <i className="fa-solid fa-chevron-left"></i> <span className="hidden sm:inline">Collection</span>
           </button>
           <h1 className="hidden md:block text-lg font-bold font-serif text-slate-900 truncate max-w-sm">{villa.name}</h1>
           <div className="flex items-center gap-6">
              <div className="hidden lg:block text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reservation From</p>
                <p className="text-sm font-black text-slate-900">₹{villa.pricePerNight.toLocaleString()}</p>
              </div>
              <button onClick={handleWhatsApp} className="px-6 sm:px-10 py-3 sm:py-4 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest sm:tracking-[0.3em] shadow-xl hover:bg-sky-600 transition-all active:scale-95">Inquire Now</button>
           </div>
        </div>
      </header>

      {/* Immersive Gallery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 lg:mb-24 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 lg:h-[750px]">
        <div className="lg:col-span-9 h-[55vh] sm:h-[650px] lg:h-full rounded-[2.5rem] lg:rounded-[4rem] overflow-hidden shadow-2xl relative">
          <img src={activeImage} className="w-full h-full object-cover" alt="Villa Exterior" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/10 to-transparent"></div>
          
          <div className="absolute bottom-10 left-8 right-8 sm:bottom-16 sm:left-16 text-white text-left z-20">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-[9px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-white/90 truncate">{villa.location}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-8xl font-bold font-serif leading-[1.05] drop-shadow-2xl tracking-tighter mb-4">{villa.name}</h1>
            <div className="flex flex-wrap gap-3 mt-6">
               <span className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{villa.bedrooms} BHK Stay</span>
               <span className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Cap. {villa.capacity} Guests</span>
               <span className="px-4 py-2 bg-amber-500/90 backdrop-blur-md rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 shadow-lg">
                 <i className="fa-solid fa-star"></i> {villa.rating}
               </span>
            </div>
          </div>
        </div>
        
        <div className="flex lg:col-span-3 flex-row lg:flex-col gap-3 lg:gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar py-2 px-4 sm:px-0">
          {villa.imageUrls?.map((url, i) => (
            <div key={i} onClick={() => setActiveImage(url)} className={`w-24 h-24 lg:w-full lg:h-32 xl:h-44 shrink-0 rounded-2xl sm:rounded-[3rem] overflow-hidden cursor-pointer border-4 transition-all hover:scale-[1.03] active:scale-95 shadow-md ${activeImage === url ? 'border-sky-500' : 'border-transparent opacity-60'}`}>
              <img src={url} className="w-full h-full object-cover" alt={`Gallery View ${i}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Detail Narrative Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
        <div className="lg:col-span-8 space-y-16 lg:space-y-28 text-left">
          
          <div className="space-y-8 lg:space-y-12">
             <div className="flex items-center gap-4">
               <div className="w-12 h-[2px] bg-sky-500"></div>
               <span className="text-[10px] sm:text-[13px] font-black uppercase tracking-[0.5em] text-slate-400">Atmosphere</span>
             </div>
             <p className="text-slate-800 text-2xl sm:text-4xl lg:text-5xl lg:leading-[1.4] font-light italic font-serif max-w-5xl">
               "{villa.longDescription || villa.description}"
             </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 py-10 border-t border-b border-slate-50">
             {[
               { l: 'Occupancy', v: `${villa.capacity} Guests`, i: 'fa-user-group' },
               { l: 'Layout', v: `${villa.bedrooms} En-suites`, i: 'fa-house-chimney' },
               { l: 'Tier', v: villa.isFeatured ? 'Signature' : 'Elite', i: 'fa-crown' },
               { l: 'Connectivity', v: 'Fiber Optic', i: 'fa-wifi' }
             ].map((stat, i) => (
               <div key={i} className="space-y-4">
                 <div className="w-10 h-10 lg:w-14 lg:h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 text-lg lg:text-xl">
                   <i className={`fa-solid ${stat.i}`}></i>
                 </div>
                 <div>
                   <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">{stat.l}</p>
                   <p className="text-sm lg:text-lg font-black text-slate-900 tracking-tight">{stat.v}</p>
                 </div>
               </div>
             ))}
          </div>

          <div className="space-y-10 lg:space-y-16">
             <h3 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serif text-slate-900 leading-tight">Elite Amenities</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {[...(villa.amenities || []), ...(villa.includedServices || [])].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 lg:gap-6 p-5 lg:p-7 bg-white rounded-[1.5rem] lg:rounded-[2.5rem] border border-slate-50 shadow-sm transition-all hover:shadow-xl hover:border-sky-100 group">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 text-[10px] lg:text-sm group-hover:bg-sky-500 group-hover:text-white transition-all">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <span className="text-[10px] lg:text-xs font-black uppercase tracking-[0.1em] text-slate-700">{s}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Desktop Sidebar Reservation Panel */}
        <div className="hidden lg:block lg:col-span-4 sticky top-36">
          <div className="bg-white border border-slate-100 rounded-[3rem] p-10 xl:p-14 shadow-[0_40px_100px_rgba(0,0,0,0.06)] hover:shadow-[0_50px_120px_rgba(0,0,0,0.1)] transition-shadow">
            <div className="flex justify-between items-end mb-12">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Reservation</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl xl:text-6xl font-black font-serif text-slate-900">₹{villa.pricePerNight.toLocaleString()}</span>
                  <span className="text-sm font-bold text-slate-400 opacity-60">/nt</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 shadow-inner">
                <i className="fa-solid fa-calendar-check text-xl"></i>
              </div>
            </div>

            <div className="space-y-5 mb-10 relative" ref={datePickerRef}>
              <button 
                onClick={() => setShowPicker(!showPicker)} 
                className="w-full bg-slate-50 py-6 px-8 rounded-2xl flex justify-between items-center border border-transparent hover:border-sky-100 transition-all shadow-inner group"
              >
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-sky-600 mb-1">Check Period</p>
                  <p className="text-base xl:text-lg font-black text-slate-900">
                    {checkIn ? `${checkIn.split('-').slice(1).join('/')} to ${checkOut.split('-').slice(1).join('/')}` : 'Choose Dates'}
                  </p>
                </div>
                <i className="fa-solid fa-chevron-down text-slate-300 group-hover:text-sky-500 transition-colors"></i>
              </button>

              {showPicker && (
                <div className="absolute top-[calc(100%+1rem)] right-0 z-[600] w-[650px] xl:w-[750px] animate-scale" onClick={e => e.stopPropagation()}>
                  <div className="shadow-2xl rounded-[2.5rem] overflow-hidden bg-white border border-slate-100">
                    <DateRangePicker startDate={checkIn} endDate={checkOut} onChange={(s, e) => { setCheckIn(s); setCheckOut(e); }} onClose={() => setShowPicker(false)} />
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleWhatsApp} disabled={showSuccess} className="w-full py-6 rounded-2xl bg-slate-900 text-white font-black uppercase text-[11px] tracking-[0.35em] shadow-xl hover:bg-sky-600 active:scale-95 transition-all">
              <i className="fa-brands fa-whatsapp text-xl mr-2"></i>
              Secure Booking
            </button>
            
            <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-center gap-3 opacity-30">
               <i className="fa-solid fa-shield-halved text-xs"></i>
               <span className="text-[9px] font-black uppercase tracking-[0.2em]">Authentic Direct Booking</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECOMMENDED SECTION */}
      {similarVillas.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32 mt-20 border-t border-slate-50">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                 <div className="w-12 h-[2px] bg-sky-500"></div>
                 <span className="text-sky-600 font-black uppercase tracking-[0.6em] text-[10px] sm:text-[11px]">Recommended Discoveries</span>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold font-serif text-slate-900 leading-[1.1] tracking-tighter">You Might Also Like</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
            {similarVillas.map(v => (
              <VillaCard 
                key={v.id} 
                villa={v} 
                whatsappNumber={settings.whatsappNumber} 
                onViewDetails={onViewDetails} 
              />
            ))}
          </div>
        </section>
      )}

      {/* FIXED MOBILE BOOKING HUD */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[220] p-4 bg-white/95 backdrop-blur-3xl border-t border-slate-100 shadow-[0_-15px_50px_rgba(0,0,0,0.12)] pb-[calc(env(safe-area-inset-bottom)+0.8rem)]">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
           <div className="text-left shrink-0 pl-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">From</p>
              <p className="text-2xl font-black text-slate-900 leading-none font-serif tracking-tight">₹{villa.pricePerNight.toLocaleString()}<span className="text-[10px] ml-1 font-sans opacity-40 font-bold">/nt</span></p>
           </div>
           
           <div className="flex-grow flex items-center justify-end gap-2.5 h-16">
             <button 
               onClick={() => setShowPicker(!showPicker)} 
               className="h-full px-5 bg-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-800 border border-slate-100 flex items-center justify-center gap-3 min-w-[120px] shadow-sm active:bg-slate-200"
             >
                <span className="truncate">{checkIn ? `${checkIn.slice(5)}` : 'Dates'}</span>
                <i className="fa-solid fa-calendar text-sky-500"></i>
             </button>
             
             {showPicker && (
               <div className="fixed bottom-[110px] left-4 right-4 z-[400] animate-scale" onClick={e => e.stopPropagation()}>
                  <div className="shadow-2xl rounded-[2rem] overflow-hidden bg-white">
                    <DateRangePicker startDate={checkIn} endDate={checkOut} onChange={(s, e) => { setCheckIn(s); setCheckOut(e); }} onClose={() => setShowPicker(false)} />
                  </div>
               </div>
             )}

             <button onClick={handleWhatsApp} className="flex-grow h-full bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                <i className="fa-brands fa-whatsapp text-2xl"></i>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Inquire</span>
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VillaDetailPage;
