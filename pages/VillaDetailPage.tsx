
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsApp = async () => {
    try {
      await saveLead({ villaId: villa.id, villaName: villa.name, source: 'WhatsApp', userId: user?.id, customerName: user?.username, checkIn: checkIn || undefined, checkOut: checkOut || undefined });
      setShowSuccess(true);
      setTimeout(() => {
        const message = encodeURIComponent(`Jai Hind! I'm interested in ${villa.name} stay: ${checkIn || 'flexible'} to ${checkOut || 'flexible'}. Please confirm.`);
        window.open(`https://wa.me/${settings.whatsappNumber}?text=${message}`, '_blank');
        setShowSuccess(false);
      }, 2000);
    } catch (error) { alert("Failed to process inquiry. Please try again."); }
  };

  return (
    <div className="bg-[#fcfdfe] min-h-screen pb-20 sm:pb-40 animate-reveal">
      {showSuccess && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-2xl animate-reveal p-4">
          <div className="bg-white p-10 sm:p-16 rounded-[2.5rem] sm:rounded-[4rem] soft-shadow text-center animate-reveal max-w-sm w-full">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 sm:mb-10">
              <i className="fa-solid fa-check text-3xl sm:text-4xl text-emerald-500"></i>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mb-4">Inquiry Recorded</h2>
            <p className="text-slate-500 font-medium">Connecting you with our concierge...</p>
          </div>
        </div>
      )}

      {/* Fixed Sticky Header - Responsive Height */}
      <header className={`fixed top-8 sm:top-10 left-0 right-0 z-[115] transition-all duration-700 h-16 sm:h-20 ${scrolled ? 'glass-panel soft-shadow translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between">
           <button onClick={onBack} className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all flex items-center gap-2 sm:gap-3">
             <i className="fa-solid fa-chevron-left"></i> Catalog
           </button>
           <h1 className="text-sm sm:text-lg font-bold font-serif text-slate-900 truncate max-w-[120px] sm:max-w-xs">{villa.name}</h1>
           <button onClick={handleWhatsApp} className="px-5 sm:px-8 py-2 sm:py-3 bg-slate-900 text-white rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-xl">Inquire</button>
        </div>
      </header>

      {/* Immersive Gallery - Mobile Optimized View */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-8 lg:h-[750px] mt-6 sm:mt-10">
        <div className="lg:col-span-9 h-[400px] sm:h-[500px] lg:h-full rounded-3xl sm:rounded-[4rem] overflow-hidden soft-shadow relative group shrink-0">
          <img src={activeImage} className="w-full h-full object-cover transition-all duration-[2s] group-hover:scale-105" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60"></div>
          <div className="absolute bottom-8 left-8 sm:bottom-16 sm:left-16 text-white max-w-[80%]">
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] mb-2 sm:mb-4 block text-white/80">{villa.location}</span>
            <h1 className="text-3xl sm:text-6xl md:text-8xl font-bold font-serif leading-none drop-shadow-2xl">{villa.name}</h1>
          </div>
        </div>
        <div className="flex lg:flex lg:col-span-3 flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar py-2">
          {villa.imageUrls?.map((url, i) => (
            <div key={i} onClick={() => setActiveImage(url)} className={`w-24 h-24 lg:w-full lg:h-40 shrink-0 rounded-2xl sm:rounded-[2.5rem] overflow-hidden cursor-pointer border-2 transition-all soft-shadow ${activeImage === url ? 'border-sky-500 scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <img src={url} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
        </div>
      </section>

      {/* Detail Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-24">
        <div className="lg:col-span-8 space-y-16 sm:space-y-32 text-left">
          <div id="overview" className="space-y-8 sm:space-y-12">
             <div className="flex items-center gap-4">
               <div className="w-8 sm:w-12 h-[2px] bg-sky-500"></div>
               <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-slate-400">Architectural Narrative</span>
             </div>
             <p className="text-slate-700 text-xl sm:text-3xl leading-relaxed font-light italic font-serif">"{villa.longDescription || villa.description}"</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12">
             {[
               { l: 'OCCUPANCY', v: `UP TO ${villa.capacity}`, i: 'fa-users' },
               { l: 'PRIVATE SUITES', v: `${villa.bedrooms} BHK`, i: 'fa-bed' },
               { l: 'EXPERIENCE', v: 'SIGNATURE', i: 'fa-water' },
               { l: 'CONNECTIVITY', v: 'GIGABIT', i: 'fa-wifi' }
             ].map((stat, i) => (
               <div key={i} className="space-y-3 sm:space-y-4">
                 <div className="w-10 h-10 sm:w-14 sm:h-14 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-sky-500 shadow-inner">
                   <i className={`fa-solid ${stat.i} text-sm sm:text-base`}></i>
                 </div>
                 <div>
                   <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.l}</p>
                   <p className="text-xs sm:text-sm font-black text-slate-900">{stat.v}</p>
                 </div>
               </div>
             ))}
          </div>

          <div className="space-y-8 sm:space-y-12">
             <h3 className="text-2xl sm:text-4xl font-bold font-serif text-slate-900">Included Services</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                {villa.includedServices?.map((s, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-50 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 text-[10px]">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-700">{s}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Sidebar Booking Card - desktop only behavior */}
        <div className="hidden lg:block lg:col-span-4 relative">
          <div className="sticky top-40 bg-white border border-slate-50 rounded-[4rem] p-10 xl:p-12 soft-shadow">
            <div className="flex justify-between items-end mb-10">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Private Escapade</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl xl:text-4xl font-black font-serif text-slate-900">₹{villa.pricePerNight.toLocaleString()}</span>
                  <span className="text-sm font-bold text-slate-400">/ night</span>
                </div>
              </div>
            </div>

            <div className="space-y-5 mb-10">
              <button onClick={() => setShowPicker(true)} className="w-full bg-slate-50 py-6 px-8 rounded-3xl flex justify-between items-center group hover:bg-slate-100 transition-all border border-transparent hover:border-sky-200">
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-sky-600 mb-1">STAY WINDOW</p>
                  <p className="text-xs font-black text-slate-900">{checkIn ? `${checkIn} to ${checkOut}` : 'DEFINE DATES'}</p>
                </div>
                <i className="fa-solid fa-calendar-days text-slate-300 group-hover:text-sky-500 transition-colors"></i>
              </button>
            </div>

            <button onClick={handleWhatsApp} disabled={showSuccess} className="w-full premium-btn py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 border-none">
              <i className="fa-brands fa-whatsapp text-xl"></i>
              {showSuccess ? 'ORCHESTRATING...' : 'SECURE BOOKING'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] p-4 glass-panel border-t border-slate-100 flex items-center justify-between gap-4 animate-reveal">
         <div className="text-left">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Starting at</p>
            <p className="text-lg font-black text-slate-900 leading-none font-serif">₹{villa.pricePerNight.toLocaleString()}</p>
         </div>
         <button onClick={() => setShowPicker(true)} className="flex-grow py-3 px-4 bg-slate-50 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-600 border border-slate-100">
            {checkIn ? `${checkIn.slice(5)} to ${checkOut.slice(5)}` : 'Select Dates'}
         </button>
         <button onClick={handleWhatsApp} className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95">
            <i className="fa-brands fa-whatsapp text-xl"></i>
         </button>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-slate-900/10 backdrop-blur-md animate-reveal" onClick={() => setShowPicker(false)}>
           <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl">
              <DateRangePicker startDate={checkIn} endDate={checkOut} onChange={(s, e) => { setCheckIn(s); setCheckOut(e); }} onClose={() => setShowPicker(false)} />
           </div>
        </div>
      )}
    </div>
  );
};

export default VillaDetailPage;
