
import React from 'react';
import { Villa } from '../types';

interface VillaCardProps {
  villa: Villa;
  whatsappNumber: string;
  onViewDetails: (id: string) => void;
}

const VillaCard: React.FC<VillaCardProps> = ({ villa, whatsappNumber, onViewDetails }) => {
  const handleWhatsAppRedirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = encodeURIComponent(`Jai Hind! I'm enquiring about ${villa.name} for my next premium stay.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const mainImage = (villa.imageUrls && Array.isArray(villa.imageUrls) && villa.imageUrls.length > 0) 
    ? villa.imageUrls[0] 
    : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800';

  return (
    <div 
      onClick={() => onViewDetails(villa.id)}
      className="group bg-white rounded-[3.5rem] overflow-hidden soft-shadow hover:shadow-[0_50px_100px_-20px_rgba(2,132,199,0.15)] transition-all duration-700 border border-slate-50 cursor-pointer flex flex-col h-full hover:-translate-y-4"
    >
      <div className="relative h-96 overflow-hidden">
        <img 
          src={mainImage} 
          alt={villa.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2.5s] ease-out"
          onError={(e) => {
             (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
        
        {/* Top Badges */}
        <div className="absolute top-8 right-8 flex flex-col items-end gap-3">
          <div className="bg-white/95 backdrop-blur-2xl px-5 py-2.5 rounded-2xl text-[11px] font-black text-slate-900 shadow-2xl flex items-center gap-2 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
            <i className="fa-solid fa-star text-amber-500 group-hover:text-white"></i>
            {villa.rating}
          </div>
        </div>

        <div className="absolute top-8 left-8 flex flex-col gap-3">
          {villa.isFeatured && (
            <div className="bg-amber-500 px-6 py-2.5 rounded-2xl text-[9px] font-black text-white shadow-xl uppercase tracking-[0.25em] border border-white/20">
              ELITE SELECTION
            </div>
          )}
          <div className="bg-white/20 backdrop-blur-md text-white px-5 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            Curated Sanctuary
          </div>
        </div>

        {/* Floating Location Overlay */}
        <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
          <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.4em] drop-shadow-lg">
            {villa.location}
          </span>
        </div>
      </div>

      <div className="p-10 flex flex-col flex-grow bg-white">
        <div className="mb-4 flex items-center gap-3">
           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em]">Available Now</span>
        </div>
        
        <h3 className="text-3xl font-bold font-serif text-slate-900 leading-tight mb-6 group-hover:text-sky-600 transition-colors duration-500">
          {villa.name}
        </h3>
        
        <div className="flex items-center gap-10 mb-10 py-6 border-y border-slate-50">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                <i className="fa-solid fa-bed text-slate-400 text-xs"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rooms</span>
                <span className="text-xs font-bold text-slate-800">{villa.bedrooms} BHK</span>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                <i className="fa-solid fa-users text-slate-400 text-xs"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Guests</span>
                <span className="text-xs font-bold text-slate-800">Up to {villa.capacity}</span>
              </div>
           </div>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exclusivity starts at</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 font-serif">₹{villa.pricePerNight.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-slate-400">/ night</span>
            </div>
          </div>
          <button 
            onClick={handleWhatsAppRedirect}
            className="w-16 h-16 bg-emerald-500 hover:bg-slate-900 text-white rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl shadow-emerald-500/20 active:scale-90 group-hover:scale-105"
          >
            <i className="fa-brands fa-whatsapp text-2xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillaCard;
