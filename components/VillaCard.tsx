import React, { useState, useEffect, useRef } from 'react';
import { Villa } from '../types';

interface VillaCardProps {
  villa: Villa;
  whatsappNumber: string;
  onViewDetails: (id: string) => void;
}

const VillaCard: React.FC<VillaCardProps> = ({ villa, whatsappNumber, onViewDetails }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  // Fix: Use any to avoid NodeJS namespace dependency which may not be available in the frontend environment
  const autoPlayRef = useRef<any>(null);

  const images = (villa.imageUrls && Array.isArray(villa.imageUrls) && villa.imageUrls.length > 0)
    ? villa.imageUrls
    : ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800'];

  // Optional: Auto-play carousel when hovered
  useEffect(() => {
    if (isHovered && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 3000);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isHovered, images.length]);

  const handleWhatsAppRedirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = encodeURIComponent(`Namaste! I'm interested in booking ${villa.name} via Peak Stay Destination.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  return (
    <div 
      onClick={() => onViewDetails(villa.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden border border-slate-100 cursor-pointer flex flex-col h-full hover-lift transition-all duration-500 shadow-sm hover:shadow-2xl"
    >
      <div className="relative h-72 sm:h-[28rem] xl:h-[32rem] overflow-hidden">
        {/* Gallery Slider - Slide Transition */}
        <div className="w-full h-full relative flex transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" 
             style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
          {images.map((img, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0">
              <img 
                src={img} 
                alt={`${villa.name} ${idx + 1}`} 
                className="w-full h-full object-cover select-none"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Dynamic Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
        
        {/* Navigation Controls - Enhanced Visibility */}
        {images.length > 1 && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center pointer-events-none">
            <button 
              onClick={prevImage}
              className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-slate-900 hover:scale-110 active:scale-90"
            >
              <i className="fa-solid fa-chevron-left text-[10px] sm:text-xs"></i>
            </button>
            <button 
              onClick={nextImage}
              className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-slate-900 hover:scale-110 active:scale-90"
            >
              <i className="fa-solid fa-chevron-right text-[10px] sm:text-xs"></i>
            </button>
          </div>
        )}

        {/* Interactive Pagination Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-20">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => goToImage(e, i)}
                className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 hover:bg-white/80 ${i === currentImageIndex ? 'w-6 sm:w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'w-1 sm:w-1.5 bg-white/40'}`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Premium Badges */}
        <div className="absolute top-6 sm:top-8 left-6 sm:left-8 right-6 sm:right-8 flex justify-between items-start z-10">
          <div className="flex flex-col gap-2">
            {villa.isFeatured && (
              <div className="bg-amber-500/95 backdrop-blur-md px-4 sm:px-6 py-2 rounded-xl sm:rounded-2xl text-[7px] sm:text-[9px] font-black text-white shadow-xl uppercase tracking-[0.2em] sm:tracking-[0.3em] flex items-center gap-2">
                <i className="fa-solid fa-crown"></i>
                Signature Stay
              </div>
            )}
            {villa.petFriendly && (
              <div className="bg-emerald-500/90 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-xl text-[7px] font-black text-white shadow-lg uppercase tracking-widest self-start">
                <i className="fa-solid fa-paw mr-1.5"></i> Pet Friendly
              </div>
            )}
          </div>
          <div className="bg-white/95 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[11px] font-black text-slate-900 shadow-xl flex items-center gap-1.5 sm:gap-2 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
            <i className="fa-solid fa-star text-amber-500"></i>
            {villa.rating}
          </div>
        </div>
      </div>

      <div className="p-8 sm:p-10 flex flex-col flex-grow text-left">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl sm:text-2xl xl:text-3xl font-bold font-serif text-slate-900 leading-tight group-hover:text-sky-600 transition-colors duration-300">
            {villa.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 mb-6">
          <i className="fa-solid fa-location-dot text-sky-400 text-[10px]"></i>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{villa.location}</p>
        </div>
        
        <div className="flex items-center gap-6 sm:gap-8 mb-8 pb-6 border-b border-slate-50">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <i className="fa-solid fa-bed text-[10px]"></i>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-600">{villa.bedrooms} BHK</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <i className="fa-solid fa-users text-[10px]"></i>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-600">{villa.capacity} Guests</span>
           </div>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stay from</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">₹{villa.pricePerNight.toLocaleString()}</span>
              <span className="text-[9px] sm:text-[11px] font-bold text-slate-400">/ night</span>
            </div>
          </div>
          <button 
            onClick={handleWhatsAppRedirect}
            title="Book via WhatsApp"
            className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500 text-white rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all shadow-xl shadow-emerald-500/20 hover:scale-110 active:scale-95 group/btn"
          >
            <i className="fa-brands fa-whatsapp text-xl sm:text-2xl group-hover/btn:animate-pulse"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillaCard;