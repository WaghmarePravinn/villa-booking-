
import React, { useEffect, useState, useRef } from 'react';
import { Villa, User, SiteSettings } from '../types';
import DateRangePicker from '../components/DateRangePicker';
import { saveLead } from '../services/leadService';

interface VillaDetailPageProps {
  villa: Villa;
  settings: SiteSettings;
  user: User | null;
  onBack: () => void;
}

const VillaDetailPage: React.FC<VillaDetailPageProps> = ({ villa, settings, user, onBack }) => {
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

  const handleWhatsApp = async () => {
    try {
      await saveLead({ villaId: villa.id, villaName: villa.name, source: 'Direct Inquiry', userId: user?.id, customerName: user?.username, checkIn: checkIn || undefined, checkOut: checkOut || undefined });
      setShowSuccess(true);
      setTimeout(() => {
        const message = encodeURIComponent(`Namaste! I'm interested in ${villa.name} stay: ${checkIn || 'dates flexible'} to ${checkOut || 'dates flexible'}. Please confirm availability.`);
        window.open(`https://wa.me/${settings.whatsappNumber}?text=${message}`, '_blank');
        setShowSuccess(false);
      }, 2000);
    } catch (error) { alert("Inquiry failed. Please try again."); }
  };

  return (
    <div className="bg-[#fcfdfe] min-h-screen pb-48 lg:pb-0 animate-reveal">
      {/* Success Animation Overlay */}
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

      {/* Dynamic Navigation Header */}
      <header className={`fixed top-4 sm:top-10 left-4 right-4 sm:left-10 sm:right-10 z-[195] transition-all duration-700 h-14 sm:h-20 ${scrolled ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="h-full bg-white/95 backdrop-blur-3xl border border-slate-100 rounded-2xl sm:rounded-full px-5 sm:px-10 flex items-center justify-between shadow-2xl">
           <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-sky-600 transition-all flex items-center gap-3 active:scale-90">
             <i className="fa-solid fa-chevron-left"></i> <span className="hidden sm:inline">Collection</span>
           </button>
           <h1 className="hidden md:block text-xl font-bold font-serif text-slate-900 truncate max-w-md">{villa.name}</h1>
           <div className="flex items-center gap-6">
              <div className="hidden lg:block text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reservation Starts</p>
                <p className="text-sm font-black text-slate-900">₹{villa.pricePerNight.toLocaleString()}</p>
              </div>
              <button onClick={handleWhatsApp} className="px-6 sm:px-10 py-3 sm:py-4 bg-slate-900 text-white rounded-xl sm:rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-widest sm:tracking-[0.3em] shadow-xl hover:bg-sky-600 transition-all active:scale-95">Inquire Now</button>
           </div>
        </div>
      </header>

      {/* Immersive Gallery Section */}
      <section className="max-w-7xl mx-auto px-0 sm:px-6 py-0 sm:py-12 flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-10 h-auto lg:h-[850px]">
        <div className="lg:col-span-9 h-[65vh] sm:h-[650px] lg:h-full sm:rounded-[4rem] overflow-hidden shadow-2xl relative">
          <img src={activeImage} className="w-full h-full object-cover" alt="Villa Exterior" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/20 to-transparent"></div>
          
          <div className="absolute top-6 sm:top-12 left-6 sm:left-12 flex gap-3 z-20">
            <button onClick={onBack} className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all active:scale-90 shadow-xl">
              <i className="fa-solid fa-arrow-left text-lg"></i>
            </button>
          </div>

          <div className="absolute bottom-10 left-8 right-8 sm:bottom-24 sm:left-24 text-white text-left z-20">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-[10px] sm:text-[14px] font-black uppercase tracking-[0.4em] text-white/90 truncate">{villa.location}</span>
            </div>
            <h1 className="text-4xl sm:text-8xl lg:text-[10rem] font-bold font-serif leading-[1] drop-shadow-2xl tracking-tighter mb-6">{villa.name}</h1>
            <div className="flex flex-wrap gap-3 sm:gap-5 mt-8">
               <span className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-widest">{villa.bedrooms} BHK Masterpiece</span>
               <span className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-widest">Cap. {villa.capacity} Guests</span>
               <span className="px-4 py-2 sm:px-6 sm:py-3 bg-amber-500/90 backdrop-blur-md rounded-xl sm:rounded-full text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 shadow-lg">
                 <i className="fa-solid fa-star"></i> {villa.rating}
               </span>
            </div>
          </div>
        </div>
        
        {/* Horizontal Scroll Thumbnails for mobile, Vertical for Desktop */}
        <div className="flex lg:col-span-3 flex-row lg:flex-col gap-4 sm:gap-5 overflow-x-auto lg:overflow-y-auto no-scrollbar py-4 px-6 sm:px-2">
          {villa.imageUrls?.map((url, i) => (
            <div key={i} onClick={() => setActiveImage(url)} className={`w-24 h-24 lg:w-full lg:h-48 shrink-0 rounded-2xl sm:rounded-[3rem] overflow-hidden cursor-pointer border-4 transition-all hover:scale-[1.05] active:scale-95 shadow-xl ${activeImage === url ? 'border-sky-500' : 'border-transparent opacity-60'}`}>
              <img src={url} className="w-full h-full object-cover" alt={`Gallery View ${i}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Main Narrative Area */}
      <div className="max-w-7xl mx-auto px-6 py-16 sm:py-40 grid grid-cols-1 lg:grid-cols-12 gap-16 sm:gap-32">
        <div className="lg:col-span-8 space-y-20 sm:space-y-40 text-left">
          
          <div className="space-y-12 sm:space-y-20">
             <div className="flex items-center gap-4">
               <div className="w-16 h-[2px] bg-sky-500"></div>
               <span className="text-[10px] sm:text-[14px] font-black uppercase tracking-[0.5em] text-slate-400">Atmosphere</span>
             </div>
             <p className="text-slate-800 text-2xl sm:text-6xl leading-[1.3] font-light italic font-serif">
               "{villa.longDescription || villa.description}"
             </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-16">
             {[
               { l: 'Max Occupancy', v: `${villa.capacity} Guests`, i: 'fa-user-group' },
               { l: 'Configuration', v: `${villa.bedrooms} En-suites`, i: 'fa-house-chimney' },
               { l: 'Collection', v: villa.isFeatured ? 'Signature' : 'Elite', i: 'fa-crown' },
               { l: 'Connectivity', v: 'High-Speed', i: 'fa-wifi' }
             ].map((stat, i) => (
               <div key={i} className="space-y-4 sm:space-y-6">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl flex items-center justify-center text-sky-500 shadow-sm">
                   <i className={`fa-solid ${stat.i} text-xl sm:text-2xl`}></i>
                 </div>
                 <div>
                   <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.l}</p>
                   <p className="text-sm sm:text-lg font-black text-slate-900 truncate tracking-tight">{stat.v}</p>
                 </div>
               </div>
             ))}
          </div>

          <div className="space-y-12 sm:space-y-24">
             <h3 className="text-3xl sm:text-6xl font-bold font-serif text-slate-900 leading-tight">Elite Amenities</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {[...(villa.amenities || []), ...(villa.includedServices || [])].map((s, i) => (
                  <div key={i} className="flex items-center gap-5 p-6 sm:p-8 bg-white rounded-[2rem] border border-slate-50 shadow-sm transition-all hover:shadow-xl hover:border-sky-100 group">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 text-sm group-hover:bg-sky-500 group-hover:text-white transition-all">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <span className="text-[11px] sm:text-sm font-black uppercase tracking-widest text-slate-700">{s}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Desktop Anchor Booking - Higher Z-Index */}
        <div className="hidden lg:block lg:col-span-4 relative z-50">
          <div className="sticky top-44 bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-[0_50px_120px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-end mb-14">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Reservation</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black font-serif text-slate-900">₹{villa.pricePerNight.toLocaleString()}</span>
                  <span className="text-lg font-bold text-slate-400 opacity-60">/nt</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-sky-50 rounded-[1.5rem] flex items-center justify-center text-sky-500 shadow-inner">
                <i className="fa-solid fa-calendar-check text-2xl"></i>
              </div>
            </div>

            <div className="space-y-6 mb-12 relative" ref={datePickerRef}>
              <button 
                onClick={() => setShowPicker(!showPicker)} 
                className="w-full bg-slate-50 py-7 px-10 rounded-2xl flex justify-between items-center border-2 border-transparent hover:border-sky-500 transition-all shadow-inner"
              >
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-sky-600 mb-1">Check Period</p>
                  <p className="text-base font-black text-slate-900">
                    {checkIn ? `${checkIn.split('-').slice(1).join('/')} to ${checkOut.split('-').slice(1).join('/')}` : 'Choose Dates'}
                  </p>
                </div>
                <i className="fa-solid fa-chevron-down text-slate-300"></i>
              </button>

              {showPicker && (
                <div className="absolute bottom-[calc(100%+1.5rem)] right-0 z-[600] w-[750px] animate-scale" onClick={e => e.stopPropagation()}>
                  <div className="shadow-2xl rounded-[3rem] overflow-hidden">
                    <DateRangePicker startDate={checkIn} endDate={checkOut} onChange={(s, e) => { setCheckIn(s); setCheckOut(e); }} onClose={() => setShowPicker(false)} />
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleWhatsApp} disabled={showSuccess} className="w-full py-7 rounded-2xl bg-slate-900 text-white font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl flex items-center justify-center gap-5 hover:bg-sky-600 active:scale-95 transition-all">
              <i className="fa-brands fa-whatsapp text-2xl"></i>
              Secure Booking
            </button>
          </div>
        </div>
      </div>

      {/* FIXED MOBILE PERSISTENT BOOKING HUD */}
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
                  <div className="shadow-2xl rounded-[2rem] overflow-hidden">
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
