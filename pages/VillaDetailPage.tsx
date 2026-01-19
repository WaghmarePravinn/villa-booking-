
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

  // Ensure the active image updates if the villa data changes (e.g. after an admin edit)
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
    <div className="bg-[#fcfdfe] min-h-screen pb-32 sm:pb-40 animate-reveal">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-2xl animate-fade p-6">
          <div className="bg-white p-12 sm:p-20 rounded-[3rem] sm:rounded-[5rem] shadow-2xl text-center animate-scale max-w-md w-full">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
              <i className="fa-solid fa-check text-4xl text-emerald-500"></i>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold font-serif text-slate-900 mb-6">Request Received</h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed">Connecting you with our Elite Concierge via WhatsApp...</p>
          </div>
        </div>
      )}

      {/* Floating Dynamic Header */}
      <header className={`fixed top-6 sm:top-10 left-4 right-4 sm:left-10 sm:right-10 z-[195] transition-all duration-700 h-14 sm:h-20 ${scrolled ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="h-full bg-white/90 backdrop-blur-2xl border border-slate-100 rounded-2xl sm:rounded-full px-6 sm:px-10 flex items-center justify-between shadow-2xl">
           <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-sky-600 transition-all flex items-center gap-3">
             <i className="fa-solid fa-chevron-left"></i> Catalog
           </button>
           <h1 className="hidden md:block text-xl font-bold font-serif text-slate-900 truncate max-w-md">{villa.name}</h1>
           <div className="flex items-center gap-6">
              <div className="hidden lg:block text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Stay Start</p>
                <p className="text-sm font-black text-slate-900 leading-none">₹{villa.pricePerNight.toLocaleString()}</p>
              </div>
              <button onClick={handleWhatsApp} className="px-6 sm:px-10 py-2.5 sm:py-3.5 bg-slate-900 text-white rounded-xl sm:rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-sky-600 transition-all active:scale-95">Inquire Now</button>
           </div>
        </div>
      </header>

      {/* Hero Gallery - Full Screen Hybrid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-10 h-auto lg:h-[800px]">
        <div className="lg:col-span-9 h-[450px] sm:h-[600px] lg:h-full rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative group">
          <img src={activeImage} className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-110" alt="Villa View" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
          
          <div className="absolute top-8 sm:top-12 left-8 sm:left-12 flex gap-3">
            <button onClick={onBack} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
          </div>

          <div className="absolute bottom-10 left-10 sm:bottom-20 sm:left-20 text-white max-w-[85%] text-left">
            <div className="flex items-center gap-3 mb-4">
              <i className="fa-solid fa-location-dot text-amber-400"></i>
              <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.5em] text-white/90">{villa.location}</span>
            </div>
            <h1 className="text-4xl sm:text-7xl md:text-9xl font-bold font-serif leading-[0.9] drop-shadow-2xl tracking-tighter mb-4">{villa.name}</h1>
            <div className="flex flex-wrap gap-4 mt-8">
               <span className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">{villa.bedrooms} Bedrooms</span>
               <span className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">{villa.capacity} Guests</span>
               <span className="px-5 py-2 bg-amber-500/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                 <i className="fa-solid fa-star"></i> {villa.rating}
               </span>
            </div>
          </div>
        </div>
        
        {/* Gallery Sidebar */}
        <div className="flex lg:col-span-3 flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar py-4 px-2">
          {villa.imageUrls?.map((url, i) => (
            <div key={i} onClick={() => setActiveImage(url)} className={`w-28 h-28 lg:w-full lg:h-44 shrink-0 rounded-2xl sm:rounded-[2.5rem] overflow-hidden cursor-pointer border-4 transition-all hover:scale-105 active:scale-95 shadow-lg ${activeImage === url ? 'border-sky-500' : 'border-transparent opacity-50 hover:opacity-100'}`}>
              <img src={url} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-32 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        <div className="lg:col-span-8 space-y-20 sm:space-y-32 text-left">
          
          {/* Narrative Overview */}
          <div className="space-y-10 sm:space-y-16">
             <div className="flex items-center gap-4">
               <div className="w-12 sm:w-20 h-[2px] bg-sky-500"></div>
               <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.5em] text-slate-400">Architectural Narrative</span>
             </div>
             <p className="text-slate-800 text-2xl sm:text-5xl leading-[1.3] font-light italic font-serif">
               "{villa.longDescription || villa.description}"
             </p>
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
             {[
               { l: 'OCCUPANCY', v: `UP TO ${villa.capacity}`, i: 'fa-user-group' },
               { l: 'VILLA TYPE', v: `${villa.bedrooms} BHK`, i: 'fa-house-chimney' },
               { l: 'STAY CLASS', v: villa.isFeatured ? 'SIGNATURE' : 'PREMIUM', i: 'fa-crown' },
               { l: 'INTERNET', v: 'GIGABIT', i: 'fa-bolt' }
             ].map((stat, i) => (
               <div key={i} className="space-y-4">
                 <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-sky-500 shadow-sm">
                   <i className={`fa-solid ${stat.i} text-xl`}></i>
                 </div>
                 <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.l}</p>
                   <p className="text-sm font-black text-slate-900">{stat.v}</p>
                 </div>
               </div>
             ))}
          </div>

          {/* Amenities & Services */}
          <div className="space-y-12 sm:space-y-20">
             <h3 className="text-3xl sm:text-5xl font-bold font-serif text-slate-900">Amenities & Services</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...(villa.amenities || []), ...(villa.includedServices || [])].map((s, i) => (
                  <div key={i} className="flex items-center gap-5 p-6 bg-white rounded-3xl border border-slate-50 shadow-sm group hover:border-sky-500 transition-all">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 text-xs group-hover:bg-sky-600 group-hover:text-white transition-all">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">{s}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Sidebar Booking Experience (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-4 relative">
          <div className="sticky top-40 bg-white border border-slate-100 rounded-[3rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.12)]">
            <div className="flex justify-between items-end mb-12">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Private Escapade</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-serif text-slate-900">₹{villa.pricePerNight.toLocaleString()}</span>
                  <span className="text-base font-bold text-slate-400">/ night</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500">
                <i className="fa-solid fa-calendar-check text-xl"></i>
              </div>
            </div>

            <div className="space-y-6 mb-12 relative" ref={datePickerRef}>
              <button 
                onClick={() => setShowPicker(!showPicker)} 
                className="w-full bg-slate-50 py-7 px-8 rounded-[2rem] flex justify-between items-center group hover:bg-white border-2 border-transparent hover:border-sky-500 transition-all shadow-sm"
              >
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-sky-600 mb-1">STAY DATES</p>
                  <p className="text-sm font-black text-slate-900 uppercase">
                    {checkIn ? `${checkIn.split('-').reverse().slice(0,2).join('/')} - ${checkOut.split('-').reverse().slice(0,2).join('/')}` : 'SELECT ARRIVAL'}
                  </p>
                </div>
                <i className="fa-solid fa-chevron-down text-slate-300 group-hover:text-sky-500 transition-colors"></i>
              </button>

              {showPicker && (
                <div className="absolute top-[calc(100%+1rem)] right-0 z-[300] w-[650px] animate-scale" onClick={e => e.stopPropagation()}>
                  <DateRangePicker 
                    startDate={checkIn} 
                    endDate={checkOut} 
                    onChange={(s, e) => { setCheckIn(s); setCheckOut(e); }} 
                    onClose={() => setShowPicker(false)} 
                  />
                </div>
              )}
            </div>

            <button onClick={handleWhatsApp} disabled={showSuccess} className="w-full py-7 rounded-[2rem] bg-slate-900 text-white font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:bg-sky-600 transition-all active:scale-95 group">
              <i className="fa-brands fa-whatsapp text-2xl group-hover:animate-bounce"></i>
              {showSuccess ? 'SYCHRONIZING...' : 'BOOK SANCTUARY'}
            </button>
            <p className="mt-8 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Price inclusive of concierge support & daily cleaning</p>
          </div>
        </div>
      </div>

      {/* Fixed Mobile Bottom Bar - Optimized for detail page */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[205] p-5 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-between gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
         <div className="text-left shrink-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Start From</p>
            <p className="text-2xl font-black text-slate-900 leading-none font-serif">₹{villa.pricePerNight.toLocaleString()}</p>
         </div>
         <div className="flex-grow relative h-full flex items-center" ref={datePickerRef}>
           <button 
             onClick={() => setShowPicker(!showPicker)} 
             className="w-full h-14 px-6 bg-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-700 border border-slate-100 flex items-center justify-between"
           >
              <span className="truncate">{checkIn ? `${checkIn.slice(5)} to ${checkOut.slice(5)}` : 'Dates'}</span>
              <i className="fa-solid fa-calendar text-sky-400"></i>
           </button>
           {showPicker && (
             <div className="fixed bottom-[90px] left-4 right-4 z-[300] animate-scale" onClick={e => e.stopPropagation()}>
                <DateRangePicker 
                  startDate={checkIn} 
                  endDate={checkOut} 
                  onChange={(s, e) => { setCheckIn(s); setCheckOut(e); }} 
                  onClose={() => setShowPicker(false)} 
                />
             </div>
           )}
         </div>
         <button onClick={handleWhatsApp} className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-95 shrink-0">
            <i className="fa-brands fa-whatsapp text-2xl"></i>
         </button>
      </div>
    </div>
  );
};

export default VillaDetailPage;
