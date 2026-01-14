
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
    const handleScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsApp = async () => {
    try {
      await saveLead({
        villaId: villa.id,
        villaName: villa.name,
        source: 'WhatsApp',
        userId: user?.id,
        customerName: user?.username,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined
      });
      
      setShowSuccess(true);
      
      setTimeout(() => {
        const message = encodeURIComponent(`Jai Hind! I'm interested in ${villa.name} for the stay: ${checkIn || 'flexible'} to ${checkOut || 'flexible'}. Please confirm availability.`);
        window.open(`https://wa.me/${settings.whatsappNumber}?text=${message}`, '_blank');
        setShowSuccess(false);
      }, 2000);
      
    } catch (error) {
      alert("Failed to process inquiry. Please try again.");
    }
  };

  return (
    <div className="bg-white min-h-screen pb-20 animate-fade relative">
      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-sky-900/40 backdrop-blur-xl animate-fade">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center animate-popup max-w-sm w-full">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <i className="fa-solid fa-check text-4xl text-emerald-600"></i>
            </div>
            <h2 className="text-3xl font-bold font-serif text-sky-900 mb-4">Inquiry Recorded!</h2>
            <p className="text-sky-600 font-medium leading-relaxed">Connecting you with our premium concierge via WhatsApp...</p>
            <div className="mt-8 flex justify-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white border border-sky-100 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Header */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">
          <i className="fa-solid fa-chevron-left"></i> Back to Catalog
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold font-serif">{villa.name}</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">{villa.location}</p>
        </div>
        <div className="w-20"></div> {/* Spacer */}
      </div>

      {/* Hero Gallery */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-4 h-[600px]">
        <div className="md:col-span-3 h-full rounded-[3rem] overflow-hidden shadow-2xl relative">
          <img src={activeImage} className="w-full h-full object-cover transition-all duration-700" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
        <div className="hidden md:flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2">
          {villa.imageUrls?.map((url, i) => (
            <div 
              key={i} 
              onClick={() => setActiveImage(url)}
              className={`h-32 rounded-3xl overflow-hidden cursor-pointer border-2 transition-all ${activeImage === url ? 'border-amber-500 scale-95 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={url} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-8 space-y-16">
          <div id="overview">
             <h2 className="text-4xl font-bold font-serif mb-6">Experience {villa.name}</h2>
             <p className="text-slate-500 text-xl leading-relaxed font-light">{villa.longDescription || villa.description}</p>
          </div>

          {/* Videos Section */}
          {villa.videoUrls && villa.videoUrls.length > 0 && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold font-serif">Walkthrough Tours</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {villa.videoUrls.map((vUrl, i) => (
                  <div key={i} className="aspect-video rounded-[2.5rem] overflow-hidden shadow-xl bg-slate-900">
                    <video src={vUrl} controls className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {[
               { label: 'Guests', value: villa.capacity, icon: 'fa-users' },
               { label: 'Suites', value: villa.bedrooms, icon: 'fa-bed' },
               { label: 'Pools', value: 1, icon: 'fa-water' },
               { label: 'WiFi', value: 'High Speed', icon: 'fa-wifi' }
             ].map((stat, i) => (
               <div key={i} className="bg-gray-50 p-8 rounded-[2.5rem] text-center border border-gray-100">
                 <i className={`fa-solid ${stat.icon} text-amber-500 text-xl mb-4`}></i>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                 <p className="text-sm font-black text-slate-900">{stat.value}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-28 bg-white border border-gray-100 rounded-[3rem] p-10 shadow-2xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-3xl font-bold font-serif text-slate-900">₹{villa.pricePerNight.toLocaleString()}</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">/ Nightly Rate</p>
              </div>
              <div className="text-amber-500 flex gap-1">
                {[...Array(5)].map((_, i) => <i key={i} className="fa-solid fa-star text-[10px]"></i>)}
              </div>
            </div>

            <button 
              onClick={() => setShowPicker(true)}
              className="w-full bg-gray-50 border border-gray-100 py-6 rounded-2xl flex justify-between px-8 items-center group hover:border-amber-500 transition-all mb-6"
            >
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Select Stay</p>
                <p className="text-sm font-black text-slate-900">{checkIn || 'Arrival'} - {checkOut || 'Departure'}</p>
              </div>
              <i className="fa-solid fa-calendar-days text-slate-300 group-hover:text-amber-500"></i>
            </button>

            <button 
              onClick={handleWhatsApp}
              disabled={showSuccess}
              className="w-full bg-emerald-500 text-white font-black py-6 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <i className="fa-brands fa-whatsapp text-xl"></i>
              {showSuccess ? 'Processing...' : 'Confirm Availability'}
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPicker(false)}>
           <div onClick={e => e.stopPropagation()}>
              <DateRangePicker 
                startDate={checkIn} 
                endDate={checkOut} 
                onChange={(s, e) => { setCheckIn(s); setCheckOut(e); }} 
                onClose={() => setShowPicker(false)}
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default VillaDetailPage;
