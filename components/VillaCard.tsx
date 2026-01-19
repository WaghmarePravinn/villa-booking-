
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
  const autoPlayRef = useRef<any>(null);

  const images = (villa.imageUrls && Array.isArray(villa.imageUrls) && villa.imageUrls.length > 0)
    ? villa.imageUrls
    : ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800'];

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
      className="group bg-white rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-slate-100 cursor-pointer flex flex-col h-full hover-lift transition-all duration-500 shadow-sm hover:shadow-2xl"
    >
      <div className="relative h-64 sm:h-[28rem] xl:h-[32rem] overflow-hidden">
        {/* Gallery Slider */}
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

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
        
        {/* Navigation Controls */}
        {images.length > 1 && (
          <div className="absolute inset-x-2 sm:inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center pointer-events-none">
            <button 
              onClick={prevImage}
              className="pointer-events-auto w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white lg:opacity-0 group-hover:opacity-100 transition-all duration-300 active:bg-white active:text-slate-900"
            >
              <i className="fa-solid fa-chevron-left text-[9px] sm:text-xs"></i>
            </button>
            <button 
              onClick={nextImage}
              className="pointer-events-auto w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white lg:opacity-0 group-hover:opacity-100 transition-all duration-300 active:bg-white active:text-slate-900"
            >
              <i className="fa-solid fa-chevron-right text-[9px] sm:text-xs"></i>
            </button>
          </div>
        )}

        {/* Pagination Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-20">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => goToImage(e, i)}
                className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ${i === currentImageIndex ? 'w-4 sm:w-8 bg-white' : 'w-1 sm:w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 right-4 sm:right-8 flex justify-between items-start z-10">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {villa.isFeatured && (
              <div className="bg-amber-500/95 backdrop-blur-md px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-2xl text-[6px] sm:text-[9px] font-black text-white shadow-xl uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                <i className="fa-solid fa-crown text-[8px] sm:text-base"></i>
                Signature
              </div>
            )}
            {villa.petFriendly && (
              <div className="bg-emerald-500/90 backdrop-blur-md px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[6px] sm:text-[7px] font-black text-white shadow-lg uppercase tracking-widest self-start">
                <i className="fa-solid fa-paw mr-1"></i> Pets
              </div>
            )}
          </div>
          <div className="bg-white/95 backdrop-blur-md px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-2xl text-[8px] sm:text-[11px] font-black text-slate-900 shadow-xl flex items-center gap-1 sm:gap-2 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
            <i className="fa-solid fa-star text-amber-500"></i>
            {villa.rating}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-10 flex flex-col flex-grow text-left">
        <h3 className="text-lg sm:text-2xl xl:text-3xl font-bold font-serif text-slate-900 leading-tight mb-2 group-hover:text-sky-600 transition-colors duration-300">
          {villa.name}
        </h3>
        <div className="flex items-center gap-1.5 mb-5 sm:mb-6">
          <i className="fa-solid fa-location-dot text-sky-400 text-[8px] sm:text-[10px]"></i>
          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{villa.location}</p>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-slate-50">
           <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <i className="fa-solid fa-bed text-[9px]"></i>
              </div>
              <span className="text-[9px] sm:text-xs font-bold text-slate-600">{villa.bedrooms} BHK</span>
           </div>
           <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <i className="fa-solid fa-users text-[9px]"></i>
              </div>
              <span className="text-[9px] sm:text-xs font-bold text-slate-600">{villa.capacity} Slp.</span>
           </div>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Start from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-3xl font-black text-slate-900 font-serif">₹{villa.pricePerNight.toLocaleString()}</span>
              <span className="text-[8px] sm:text-[11px] font-bold text-slate-400">/nt</span>
            </div>
          </div>
          <button 
            onClick={handleWhatsAppRedirect}
            className="w-10 h-10 sm:w-16 sm:h-16 bg-emerald-500 text-white rounded-xl sm:rounded-3xl flex items-center justify-center transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <i className="fa-brands fa-whatsapp text-lg sm:text-2xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillaCard;
