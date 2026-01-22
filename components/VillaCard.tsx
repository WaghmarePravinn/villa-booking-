
import React, { useState, useEffect, useRef } from 'react';
import { Villa } from '../types';

interface VillaCardProps {
  villa: Villa;
  whatsappNumber: string;
  onViewDetails: (id: string) => void;
}

const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="w-full h-full bg-slate-100 overflow-hidden relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="fa-solid fa-mountain-sun text-slate-200 text-2xl animate-pulse"></i>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover select-none transition-all duration-700 ease-in-out ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-lg'
        }`}
      />
    </div>
  );
};

const VillaCard: React.FC<VillaCardProps> = ({ villa, whatsappNumber, onViewDetails }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayRef = useRef<any>(null);

  const images = (villa.imageUrls && Array.isArray(villa.imageUrls) && villa.imageUrls.length > 0)
    ? villa.imageUrls
    : ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800'];

  useEffect(() => {
    // Only autoplay on desktop hover
    if (isHovered && images.length > 1 && window.innerWidth >= 1024) {
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
      <div className="relative h-72 sm:h-[28rem] xl:h-[32rem] overflow-hidden bg-slate-50">
        {/* Gallery Slider */}
        <div className="w-full h-full relative flex transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" 
             style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
          {images.map((img, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0">
              <LazyImage 
                src={img} 
                alt={`${villa.name} ${idx + 1}`} 
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-60 sm:opacity-40 sm:group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
        
        {/* Navigation Controls */}
        {images.length > 1 && (
          <div className="absolute inset-x-3 sm:inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center pointer-events-none">
            <button 
              onClick={prevImage}
              className="pointer-events-auto w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/30 sm:bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white lg:opacity-0 group-hover:opacity-100 transition-all duration-300 active:bg-white active:text-slate-900"
            >
              <i className="fa-solid fa-chevron-left text-[10px] sm:text-xs"></i>
            </button>
            <button 
              onClick={nextImage}
              className="pointer-events-auto w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/30 sm:bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white lg:opacity-0 group-hover:opacity-100 transition-all duration-300 active:bg-white active:text-slate-900"
            >
              <i className="fa-solid fa-chevron-right text-[10px] sm:text-xs"></i>
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
                className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ${i === currentImageIndex ? 'w-5 sm:w-8 bg-white shadow-sm' : 'w-1 sm:w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 right-4 sm:right-8 flex justify-between items-start z-10 pointer-events-none">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {villa.isFeatured && (
              <div className="bg-amber-500/95 backdrop-blur-md px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-2xl text-[7px] sm:text-[9px] font-black text-white shadow-xl uppercase tracking-widest flex items-center gap-2">
                 <i className="fa-solid fa-crown"></i> Signature
              </div>
            )}
            <div className="bg-white/80 backdrop-blur-md px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-2xl text-[7px] sm:text-[9px] font-black text-slate-900 shadow-xl uppercase tracking-widest flex items-center gap-2">
               <i className="fa-solid fa-map-pin text-sky-500"></i> {villa.location.split(',')[0]}
            </div>
          </div>
          <button 
            onClick={handleWhatsAppRedirect}
            className="pointer-events-auto w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl hover:bg-emerald-600 transition-all active:scale-90"
          >
            <i className="fa-brands fa-whatsapp text-lg sm:text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-6 sm:p-10 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="text-left">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 font-serif leading-tight group-hover:text-sky-600 transition-colors mb-1 truncate max-w-[200px] sm:max-w-xs">{villa.name}</h3>
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400 text-[8px] sm:text-[10px]">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`${i < Math.floor(villa.rating) ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                ))}
              </div>
              <span className="text-[7px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest">({villa.ratingCount} Reviews)</span>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">FROM</p>
             <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight">₹{villa.pricePerNight.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
           <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-50 flex flex-col items-center justify-center">
              <i className="fa-solid fa-bed text-sky-400 text-xs sm:text-base mb-1 sm:mb-2"></i>
              <span className="text-[8px] sm:text-[10px] font-black text-slate-900">{villa.bedrooms} BHK</span>
           </div>
           <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-50 flex flex-col items-center justify-center">
              <i className="fa-solid fa-shower text-sky-400 text-xs sm:text-base mb-1 sm:mb-2"></i>
              <span className="text-[8px] sm:text-[10px] font-black text-slate-900">{villa.bathrooms} Baths</span>
           </div>
           <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-50 flex flex-col items-center justify-center">
              <i className="fa-solid fa-users text-sky-400 text-xs sm:text-base mb-1 sm:mb-2"></i>
              <span className="text-[8px] sm:text-[10px] font-black text-slate-900">{villa.capacity} Guests</span>
           </div>
        </div>

        <p className="text-slate-500 text-xs sm:text-base font-medium leading-relaxed line-clamp-2 mb-8 text-left opacity-80 italic">
          "{villa.description}"
        </p>

        <div className="mt-auto pt-6 sm:pt-10 border-t border-slate-50 flex items-center justify-between">
           <div className="flex -space-x-2">
              {['wifi', 'snowflake', 'utensils', 'car'].map((amenity, i) => (
                <div key={i} className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[8px] sm:text-[10px] text-slate-300 shadow-sm">
                   <i className={`fa-solid fa-${amenity}`}></i>
                </div>
              ))}
              <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[6px] sm:text-[8px] font-black text-slate-400 shadow-sm">
                 +12
              </div>
           </div>
           <button 
             onClick={(e) => { e.stopPropagation(); onViewDetails(villa.id); }}
             className="px-5 sm:px-8 py-2 sm:py-3.5 bg-slate-900 text-white rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all active:scale-95 shadow-lg"
           >
             View Details
           </button>
        </div>
      </div>
    </div>
  );
};

export default VillaCard;
