
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Villa } from '../types';
import { WHATSAPP_NUMBER } from '../constants';
import DateRangePicker from '../components/DateRangePicker';

interface VillaDetailPageProps {
  villa: Villa;
  onBack: () => void;
}

const VillaDetailPage: React.FC<VillaDetailPageProps> = ({ villa, onBack }) => {
  const [scrolled, setScrolled] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [guestCount, setGuestCount] = useState(villa.capacity > 2 ? 2 : villa.capacity);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { nights, totalPrice } = useMemo(() => {
    if (checkIn && checkOut) {
      const [y1, m1, d1] = checkIn.split('-').map(Number);
      const [y2, m2, d2] = checkOut.split('-').map(Number);
      const start = new Date(y1, m1 - 1, d1);
      const end = new Date(y2, m2 - 1, d2);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        return { nights: diffDays, totalPrice: diffDays * villa.pricePerNight };
      }
    }
    return { nights: 0, totalPrice: 0 };
  }, [checkIn, checkOut, villa.pricePerNight]);

  const handleCheckAvailability = () => {
    setIsCheckingAvailability(true);
    setIsAvailable(null);
    // Simulate API call
    setTimeout(() => {
      setIsCheckingAvailability(false);
      setIsAvailable(true); // Always available in this demo
    }, 1500);
  };

  const handleWhatsApp = () => {
    let messageStr = `Hi, I'm interested in booking ${villa.name} in ${villa.location}.`;
    if (checkIn && checkOut) {
      messageStr += ` Dates: ${checkIn} to ${checkOut} (${nights} nights). Guests: ${guestCount}.`;
    }
    const message = encodeURIComponent(messageStr);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const navItems = [
    "Overview", "Highlights", "Refund Policy", "Spaces", "Reviews", "Amenities", "Meals", "Location"
  ];

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return 'Add Date';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
  };

  return (
    <div className="bg-white min-h-screen pb-20 animate-fade">
      {/* Top Navigation Breadcrumb */}
      <div className="hidden md:flex justify-center py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center space-x-8 px-8 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm">
          <button className="text-slate-400 hover:text-slate-900 transition-colors" onClick={onBack}>
             <i className="fa-solid fa-chevron-left text-xs mr-2"></i> Back
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="text-xs font-black uppercase tracking-widest text-slate-900">{villa.name}</div>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="text-xs font-bold text-amber-600">{villa.location}</div>
        </div>
      </div>

      {/* Image Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="md:col-span-2 h-full overflow-hidden relative group">
            <img src={villa.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] ease-out" alt={villa.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          <div className="md:col-span-1 h-full flex flex-col gap-3">
             <div className="h-1/2 overflow-hidden relative group">
                <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Interior" />
             </div>
             <div className="h-1/2 overflow-hidden relative group">
                <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Bedroom" />
             </div>
          </div>
          <div className="relative h-full hidden md:block md:col-span-1 overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-1000" alt="Poolside" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40 backdrop-blur-[2px] hover:backdrop-blur-none transition-all cursor-pointer">
              <span className="text-4xl font-serif font-bold">+18</span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-black mt-2">View Gallery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Secondary Nav */}
      <div className={`sticky top-20 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-300 ${scrolled ? 'shadow-md py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-10 overflow-x-auto no-scrollbar scroll-smooth">
            {navItems.map((item, idx) => (
              <a 
                key={idx} 
                href={`#${item.toLowerCase().replace("'", "").replace(" ", "-")}`}
                className={`whitespace-nowrap text-[10px] md:text-xs font-black uppercase tracking-widest pb-1 transition-all ${idx === 0 ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          
          <div className="lg:col-span-8 space-y-16">
            <div id="overview">
              <div className="flex items-center gap-3 mb-6">
                 <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg">Property 0{villa.id}</span>
                 {villa.isFeatured && <span className="bg-amber-500 text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg">Signature Collection</span>}
              </div>
              <h1 className="text-4xl md:text-7xl font-bold font-serif text-slate-900 mb-6 leading-tight">
                {villa.name}
              </h1>
              <p className="text-slate-400 text-xl font-light leading-relaxed">
                {villa.longDescription || villa.description}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: 'fa-users', label: 'Capacity', value: `${villa.capacity} Guests` },
                { icon: 'fa-bed', label: 'Bedrooms', value: `${villa.bedrooms} Suites` },
                { icon: 'fa-bath', label: 'Baths', value: `${villa.bathrooms} En-suites` },
                { icon: 'fa-paw', label: 'Pets', value: villa.petFriendly ? 'Welcomed' : 'Restricted' }
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                  <i className={`fa-solid ${item.icon} text-amber-500 text-2xl mb-4 group-hover:scale-110 transition-transform`}></i>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-sm font-black text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div id="amenities" className="space-y-8">
               <h2 className="text-3xl font-bold font-serif text-slate-900">Premium Amenities</h2>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {villa.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <i className="fa-solid fa-star-of-life text-[10px]"></i>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{amenity}</span>
                    </div>
                  ))}
               </div>
            </div>
            
            <div id="refund-policy" className="bg-slate-900 text-white p-12 rounded-[3rem] relative overflow-hidden">
               <i className="fa-solid fa-shield-halved absolute -right-10 -bottom-10 text-[12rem] opacity-5"></i>
               <h2 className="text-2xl font-bold font-serif mb-4 relative z-10">Curation & Refund Policy</h2>
               <p className="text-slate-400 leading-relaxed font-light relative z-10 mb-8">
                 {villa.refundPolicy}
               </p>
               <div className="flex flex-wrap gap-4 relative z-10">
                  <div className="bg-slate-800 px-6 py-3 rounded-2xl flex items-center gap-3">
                     <i className="fa-solid fa-check-circle text-emerald-500"></i>
                     <span className="text-[10px] font-black uppercase tracking-widest">100% Verified</span>
                  </div>
                  <div className="bg-slate-800 px-6 py-3 rounded-2xl flex items-center gap-3">
                     <i className="fa-solid fa-check-circle text-emerald-500"></i>
                     <span className="text-[10px] font-black uppercase tracking-widest">Safe Stay Protocol</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 relative">
            <div className="sticky top-40 bg-white border border-gray-100 rounded-[3rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.1)]">
              <div className="flex items-end gap-2 mb-10">
                <span className="text-4xl font-black text-slate-900 font-serif">₹{villa.pricePerNight.toLocaleString()}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">/ Nightly</span>
              </div>

              <div className="space-y-6">
                <div 
                  className={`border-2 rounded-[2rem] overflow-hidden transition-all duration-500 ${showPicker ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}
                  onClick={() => setShowPicker(true)}
                >
                  <div className="flex divide-x divide-gray-100 cursor-pointer">
                    <div className="flex-1 p-6">
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Inbound</p>
                      <p className={`text-sm font-black ${checkIn ? 'text-slate-900' : 'text-gray-300'}`}>{formatDateString(checkIn)}</p>
                    </div>
                    <div className="flex-1 p-6">
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Outbound</p>
                      <p className={`text-sm font-black ${checkOut ? 'text-slate-900' : 'text-gray-300'}`}>{formatDateString(checkOut)}</p>
                    </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Occupants</p>
                      <p className="text-sm font-black text-slate-900">{guestCount} Guests</p>
                    </div>
                    <select 
                      className="bg-transparent outline-none text-transparent w-full h-full absolute inset-0 cursor-pointer opacity-0"
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                    >
                      {[...Array(villa.capacity)].map((_, i) => <option key={i} value={i+1}>{i+1} Guests</option>)}
                    </select>
                    <i className="fa-solid fa-chevron-down text-slate-300 text-xs"></i>
                  </div>
                </div>

                {nights > 0 ? (
                  <div className="animate-fade-in-up space-y-6 pt-4">
                    <div className="space-y-3 px-2">
                       <div className="flex justify-between text-sm font-bold text-slate-500">
                          <span>₹{villa.pricePerNight.toLocaleString()} x {nights} nights</span>
                          <span className="text-slate-900">₹{totalPrice.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-sm font-bold text-slate-500">
                          <span>Management Fee (12%)</span>
                          <span className="text-slate-900">₹{(totalPrice * 0.12).toLocaleString()}</span>
                       </div>
                       <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-900">Total</span>
                          <span className="text-3xl font-black font-serif text-slate-900">₹{(totalPrice * 1.12).toLocaleString()}</span>
                       </div>
                    </div>
                    
                    {isAvailable === null && !isCheckingAvailability && (
                      <button 
                        onClick={handleCheckAvailability}
                        className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] hover:bg-black transition-all shadow-2xl uppercase text-[10px] tracking-widest"
                      >
                        Check Availability
                      </button>
                    )}

                    {isCheckingAvailability && (
                      <div className="w-full bg-slate-100 text-slate-400 font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                        <i className="fa-solid fa-spinner fa-spin text-amber-500"></i>
                        Syncing Calendar...
                      </div>
                    )}

                    {isAvailable === true && (
                      <div className="space-y-4 animate-scale">
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                           <i className="fa-solid fa-check-circle"></i> High Intent - Fully Available
                        </div>
                        <button 
                          onClick={handleWhatsApp}
                          className="w-full bg-emerald-500 text-white font-black py-6 rounded-[2rem] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest"
                        >
                          <i className="fa-brands fa-whatsapp text-2xl"></i>
                          Reserve on WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowPicker(true)}
                    className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] hover:bg-black transition-all shadow-xl uppercase text-[10px] tracking-widest"
                  >
                    Select Your Dates
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPicker(false)}>
          <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
             <button onClick={() => setShowPicker(false)} className="absolute -top-12 right-0 text-white hover:text-amber-400 font-black uppercase text-xs tracking-widest">
                Close <i className="fa-solid fa-xmark text-lg"></i>
             </button>
             <DateRangePicker 
               startDate={checkIn} 
               endDate={checkOut} 
               onChange={(start, end) => { setCheckIn(start); setCheckOut(end); setIsAvailable(null); }}
               onClose={() => setShowPicker(false)}
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default VillaDetailPage;
