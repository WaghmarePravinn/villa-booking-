
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
    <div className="bg-[#fcfdfe] min-h-screen pb-40 lg:pb-0 animate-reveal">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-2xl animate-fade p-6">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center animate-scale max-w-sm w-full">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
              <i className="fa-solid fa-check text-3xl text-emerald-500"></i>
            </div>
            <h2 className="text-2xl font-bold font-serif text-slate-900 mb-4 leading-tight">Request Logged</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed opacity-80">Connecting you with our concierge on WhatsApp...</p>
          </div>
        </div>
      )}

      {/* Floating Dynamic Header */}
      <header className={`fixed top-4 sm:top-10 left-4 right-4 sm:left-10 sm:right-10 z-[195] transition-all duration-700 h-14 sm:h-20 ${scrolled ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="h-full bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-xl sm:rounded-full px-4 sm:px-10 flex items-center justify-between shadow-2xl">
           <button onClick={onBack} className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-sky-600 transition-all flex items-center gap-2 sm:gap-3 active:scale-95">
             <i className="fa-solid fa-chevron-left text-[8px]"></i> Back
           </button>
           <h1 className="hidden md:block text-xl font-bold font-serif text-slate-900 truncate max-w-md">{villa.name}</h1>
           <div className="flex items-center gap-4 sm:gap-6">
              <div className="hidden lg:block text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Stay Start</p>
                <p className="text-sm font-black text-slate-900">₹{villa.pricePerNight.toLocaleString()}</p>
              </div>
              <button onClick={handleWhatsApp} className="px-5 sm:px-10 py-2 sm:py-3.5 bg-slate-900 text-white rounded-lg sm:rounded-full text-[8px] sm:text-[11px] font-black uppercase tracking-widest sm:tracking-[0.3em] shadow-xl hover:bg-sky-600 transition-all active:scale-95">Inquire</button>
           </div>
        </div>
      </header>

      {/* Hero Gallery */}
      <section className="max-w-7xl mx-auto px-0 sm:px-6 py-0 sm:py-12 flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-10 h-auto lg:h-[800px]">
        <div className="lg:col-span-9 h-[60vh] sm:h-[600px] lg:h-full sm:rounded-[4rem] overflow-hidden shadow-2xl relative group">
          <img src={activeImage} className="w-full h-full object-cover" alt="Villa View" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
          
          <div className="absolute top-6 sm:top-12 left-6 sm:left-12 flex gap-3 z-20">
            <button onClick={onBack} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all active:scale-90">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
          </div>

          <div className="absolute bottom-6 left-6 right-6 sm:bottom-20 sm:left-20 text-white text-left z-20">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <i className="fa-solid fa-location-dot text-amber-400 text-xs"></i>
              <span className="text-[8px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-white/90 truncate">{villa.location}</span>
            </div>
            <h1 className="text-3xl sm:text-7xl lg:text-9xl font-bold font-serif leading-[1] drop-shadow-2xl tracking-tighter mb-4">{villa.name}</h1>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-6 sm:mt-8">
               <span className="px-4 py-1.5 sm:px-5 sm:py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg sm:rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{villa.bedrooms} BHK</span>
               <span className="px-4 py-1.5 sm:px-5 sm:py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg sm:rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{villa.capacity} Guests</span>
               <span className="px-4 py-1.5 sm:px-5 sm:py-2 bg-amber-500/90 backdrop-blur-md rounded-lg sm:rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                 <i className="fa-solid fa-star"></i> {villa.rating}
               </span>
            </div>
          </div>
        </div>
        
        {/* Gallery Sidebar */}
        <div className="flex lg:col-span-3 flex-row lg:flex-col gap-3 sm:gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar py-2 sm:py-4 px-4 sm:px-2">
          {villa.imageUrls?.map((url, i) => (
            <div key={i} onClick={() => setActiveImage(url)} className={`w-24 h-24 lg:w-full lg:h-44 shrink-0 rounded-xl sm:rounded-[2.5rem] overflow-hidden cursor-pointer border-2 sm:border-4 transition-all hover:scale-[1.03] active:scale-95 shadow-md ${activeImage === url ? 'border-sky-500' : 'border-transparent opacity-60'}`}>
              <img src={url} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-24">
        <div className="lg:col-span-8 space-y-16 sm:space-y-32 text-left">
          
          <div className="space-y-8 sm:space-y-16">
             <div className="flex items-center gap-4">
               <div className="w-12 h-[1.5px] bg-sky-500"></div>
               <span className="text-[9px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">Chronicle</span>
             </div>
             <p className="text-slate-800 text-xl sm:text-5xl leading-[1.4] font-light italic font-serif">
               "{villa.longDescription || villa.description}"
             </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12">
             {[
               { l: 'OCCUPANCY', v: `MAX ${villa.capacity}`, i: 'fa-user-group' },
               { l: 'CATEGORY', v: `${villa.bedrooms} BHK`, i: 'fa-house-chimney' },
               { l: 'TIER', v: villa.isFeatured ? 'SIGNATURE' : 'PREMIUM', i: 'fa-crown' },
               { l: 'WIFI', v: 'GIGABIT', i: 'fa-bolt' }
             ].map((stat, i) => (
               <div key={i} className="space-y-3 sm:space-y-4">
                 <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white border border-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-sky-500 shadow-sm">
                   <i className={`fa-solid ${stat.i} text-base sm:text-xl`}></i>
                 </div>
                 <div>
                   <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.l}</p>
                   <p className="text-[11px] sm:text-sm font-black text-slate-900 truncate">{stat.v}</p>
                 </div>
               </div>
             ))}
          </div>

          <div className="space-y-10 sm:space-y-20">
             <h3 className="text-2xl sm:text-5xl font-bold font-serif text-slate-900">Elite Amenities</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...(villa.amenities || []), ...(villa.includedServices || [])].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-50 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 text-[10px]">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{s}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Desktop Sidebar Booking */}
        <div className="hidden lg:block lg:col-span-4 relative">
          <div className="sticky top-40 bg-white border border-slate-100 rounded-[3rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.12)]">
            <div className="flex justify-between items-end mb-12">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Reservation</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-serif text-slate-900">₹{villa.pricePerNight.toLocaleString()}</span>
                  <span className="text-base font-bold text-slate-400">/nt</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 shadow-inner">
                <i className="fa-solid fa-calendar-check text-xl"></i>
              </div>
            </div>

            <div className="space-y-6 mb-10 relative" ref={datePickerRef}>
              <button 
                onClick={() => setShowPicker(!showPicker)} 
                className="w-full bg-slate-50 py-6 px-8 rounded-2xl flex justify-between items-center border-2 border-transparent hover:border-sky-500 transition-all shadow-sm"
              >
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase tracking-widest text-sky-600 mb-0.5">CHECK-IN/OUT</p>
                  <p className="text-sm font-black text-slate-900 uppercase">
                    {checkIn ? `${checkIn.split('-').slice(1).join('/')} - ${checkOut.split('-').slice(1).join('/')}` : 'CHOOSE DATES'}
                  </p>
                </div>
                <i className="fa-solid fa-chevron-down text-slate-300"></i>
              </button>

              {showPicker && (
                <div className="absolute top-[calc(100%+0.5rem)] right-0 z-[300] w-[650px] animate-scale" onClick={e => e.stopPropagation()}>
                  <DateRangePicker startDate={checkIn} endDate={checkOut} onChange={(s, e) => { setCheckIn(s); setCheckOut(e); }} onClose={() => setShowPicker(false)} />
                </div>
              )}
            </div>

            <button onClick={handleWhatsApp} disabled={showSuccess} className="w-full py-6 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 hover:bg-sky-600 active:scale-95 transition-all">
              <i className="fa-brands fa-whatsapp text-xl"></i>
              BOOK VIA WHATSAPP
            </button>
          </div>
        </div>
      </div>

      {/* FIXED MOBILE BOTTOM BOOKING BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[210] p-4 bg-white/95 backdrop-blur-3xl border-t border-slate-100 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] mb-[calc(env(safe-area-inset-bottom)+0.2rem)]">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
           <div className="text-left shrink-0">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Start From</p>
              <p className="text-xl font-black text-slate-900 leading-none font-serif">₹{villa.pricePerNight.toLocaleString()}<span className="text-[9px] ml-1 font-sans opacity-40">/nt</span></p>
           </div>
           
           <div className="flex-grow flex items-center justify-end gap-3 h-14">
             <button 
               onClick={() => setShowPicker(!showPicker)} 
               className="h-full px-4 bg-slate-50 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-700 border border-slate-100 flex items-center justify-center gap-2 max-w-[120px]"
             >
                <span className="truncate">{checkIn ? `${checkIn.slice(5)}` : 'Stay'}</span>
                <i className="fa-solid fa-calendar text-sky-400"></i>
             </button>
             
             {showPicker && (
               <div className="fixed bottom-[100px] left-4 right-4 z-[300] animate-scale" onClick={e => e.stopPropagation()}>
                  <DateRangePicker startDate={checkIn} endDate={checkOut} onChange={(s, e) => { setCheckIn(s); setCheckOut(e); }} onClose={() => setShowPicker(false)} />
               </div>
             )}

             <button onClick={handleWhatsApp} className="flex-grow h-full bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                <i className="fa-brands fa-whatsapp text-xl"></i>
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">Book Now</span>
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VillaDetailPage;
