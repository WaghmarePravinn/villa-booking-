
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

  return (
    <div 
      onClick={() => onViewDetails(villa.id)}
      className="group bg-white rounded-[3rem] overflow-hidden border border-slate-100 cursor-pointer flex flex-col h-full hover-lift"
    >
      <div className="relative h-80 sm:h-[32rem] overflow-hidden">
        {/* Gallery Slider */}
        <div className="w-full h-full relative">
          {images.map((img, idx) => (
            <img 
              key={idx}
              src={img} 
              alt={`${villa.name} ${idx + 1}`} 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
              loading="lazy"
            />
          ))}
        </div>

        {/* Gradient Layer */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
        
        {/* Controls */}
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900"
            >
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900"
            >
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
          {villa.isFeatured && (
            <div className="bg-amber-500/90 backdrop-blur-md px-6 py-2.5 rounded-2xl text-[9px] font-black text-white shadow-2xl uppercase tracking-[0.3em]">
              Signature Stay
            </div>
          )}
          <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl text-[11px] font-black text-slate-900 shadow-2xl flex items-center gap-2 group-hover:bg-slate-900 group-hover:text-white transition-all">
            <i className="fa-solid fa-star text-amber-500"></i>
            {villa.rating}
          </div>
        </div>
      </div>

      <div className="p-10 flex flex-col flex-grow text-left">
        <h3 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 leading-tight mb-4 group-hover:text-sky-600 transition-colors">
          {villa.name}
        </h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{villa.location}</p>
        
        <div className="flex items-center gap-8 mb-10 pb-8 border-b border-slate-50">
           <div className="flex items-center gap-4">
              <i className="fa-solid fa-bed text-sky-400"></i>
              <span className="text-xs font-bold text-slate-700">{villa.bedrooms} BHK</span>
           </div>
           <div className="flex items-center gap-4">
              <i className="fa-solid fa-users text-sky-400"></i>
              <span className="text-xs font-bold text-slate-700">Up to {villa.capacity}</span>
           </div>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Starting from</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 font-serif">₹{villa.pricePerNight.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-slate-400">/ night</span>
            </div>
          </div>
          <button 
            onClick={handleWhatsAppRedirect}
            className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center transition-all shadow-2xl shadow-emerald-500/20 hover:scale-110 active:scale-90"
          >
            <i className="fa-brands fa-whatsapp text-2xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillaCard;
