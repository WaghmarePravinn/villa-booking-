
import React, { useState } from 'react';
import { Villa } from '../types';

interface VillaCardProps {
  villa: Villa;
  whatsappNumber: string;
  onViewDetails: (id: string) => void;
}

const VillaCard: React.FC<VillaCardProps> = ({ villa, whatsappNumber, onViewDetails }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = (villa.imageUrls && Array.isArray(villa.imageUrls) && villa.imageUrls.length > 0)
    ? villa.imageUrls
    : ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800'];

  const handleWhatsAppRedirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = encodeURIComponent(`Jai Hind! I'm enquiring about ${villa.name} for my next premium stay.`);
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

  return (
    <div 
      onClick={() => onViewDetails(villa.id)}
      className="group bg-white rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden soft-shadow hover:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.12)] transition-all duration-700 border border-slate-100 cursor-pointer flex flex-col h-full hover:-translate-y-3"
    >
      <div className="relative h-72 sm:h-[28rem] overflow-hidden">
        {/* Image Slider */}
        <div className="w-full h-full relative">
          {images.map((img, idx) => (
            <img 
              key={idx}
              src={img} 
              alt={`${villa.name} - ${idx + 1}`} 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
              onError={(e) => {
                 (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800';
              }}
            />
          ))}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-700"></div>
        
        {/* Slider Controls - Better Mobile Touch Area */}
        {images.length > 1 && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 sm:px-8 opacity-0 group-hover:opacity-100 transition-all duration-500">
            <button 
              onClick={prevImage}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all shadow-2xl"
            >
              <i className="fa-solid fa-chevron-left text-xs sm:text-base"></i>
            </button>
            <button 
              onClick={nextImage}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all shadow-2xl"
            >
              <i className="fa-solid fa-chevron-right text-xs sm:text-base"></i>
            </button>
          </div>
        )}

        {/* Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-700 ${i === currentImageIndex ? 'w-8 bg-white shadow-xl' : 'w-2 bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Featured/Rating Badges */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10">
          <div>
            {villa.isFeatured && (
              <div className="bg-amber-500 px-5 py-2.5 rounded-2xl text-[9px] font-black text-white shadow-2xl uppercase tracking-[0.25em] border border-white/20 backdrop-blur-md">
                ELITE SELECTION
              </div>
            )}
          </div>
          <div className="bg-white/95 backdrop-blur-2xl px-5 py-2.5 rounded-2xl text-[11px] font-black text-slate-900 shadow-2xl flex items-center gap-2 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
            <i className="fa-solid fa-star text-amber-500 group-hover:text-amber-400"></i>
            {villa.rating}
          </div>
        </div>
      </div>

      <div className="p-8 sm:p-12 flex flex-col flex-grow bg-white">
        <div className="mb-4 flex items-center gap-3">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Direct Verification Complete</span>
        </div>
        
        <h3 className="text-2xl sm:text-4xl font-bold font-serif text-slate-900 leading-[1.1] mb-6 group-hover:text-sky-600 transition-colors duration-500">
          {villa.name}
        </h3>
        
        <div className="flex items-center gap-8 sm:gap-14 mb-8 sm:mb-12 py-6 sm:py-8 border-y border-slate-50">
           <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <i className="fa-solid fa-bed text-sm sm:text-lg"></i>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Configuration</span>
                <span className="text-xs sm:text-base font-bold text-slate-800">{villa.bedrooms} BHK</span>
              </div>
           </div>
           <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <i className="fa-solid fa-users text-sm sm:text-lg"></i>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Occupancy</span>
                <span className="text-xs sm:text-base font-bold text-slate-800">Up to {villa.capacity}</span>
              </div>
           </div>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div className="text-left">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Heritage Experience from</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-4xl font-black text-slate-900 font-serif">₹{villa.pricePerNight.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-slate-400">/ night</span>
            </div>
          </div>
          <button 
            onClick={handleWhatsAppRedirect}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 hover:bg-slate-900 text-white rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl shadow-emerald-500/30 active:scale-90 group-hover:scale-110"
          >
            <i className="fa-brands fa-whatsapp text-2xl sm:text-3xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillaCard;
