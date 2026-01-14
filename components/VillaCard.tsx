
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
    const message = encodeURIComponent(`Jai Hind! I'm enquiring about ${villa.name} for the Republic Day 2025 weekend.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const mainImage = (villa.imageUrls && villa.imageUrls.length > 0) 
    ? villa.imageUrls[0] 
    : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800';

  return (
    <div 
      onClick={() => onViewDetails(villa.id)}
      className="group bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-[0_40px_100px_rgba(255,153,51,0.15)] transition-all duration-700 border border-sky-50 cursor-pointer flex flex-col h-full hover:-translate-y-4"
    >
      <div className="relative h-80 overflow-hidden">
        <img 
          src={mainImage} 
          alt={villa.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 via-transparent to-transparent group-hover:opacity-80 transition-opacity duration-700"></div>
        
        <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl text-sm font-black text-sky-900 shadow-2xl flex items-center gap-2 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
          <i className="fa-solid fa-star text-orange-500 group-hover:text-white"></i>
          {villa.rating}
        </div>

        <div className="absolute top-8 left-8 flex flex-col gap-2">
          {villa.isFeatured && (
            <div className="bg-orange-500 px-5 py-2 rounded-2xl text-[10px] font-black text-white shadow-xl uppercase tracking-[0.2em] animate-pulse border border-orange-400">
              REPUBLIC OFFER 26% OFF
            </div>
          )}
          <div className="bg-green-600/90 text-white px-4 py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            Lush Surroundings
          </div>
        </div>
      </div>

      <div className="p-10 flex flex-col flex-grow bg-white">
        <div className="mb-2">
           <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.3em]">{villa.location.split(',')[0]}</span>
        </div>
        <h3 className="text-3xl font-bold font-serif text-sky-900 leading-tight mb-4 group-hover:text-orange-500 transition-colors duration-500">
          {villa.name}
        </h3>
        
        <div className="flex items-center gap-6 mb-10 py-4 border-y border-sky-50">
           <div className="flex items-center gap-2">
              <i className="fa-solid fa-bed text-sky-200 text-xs"></i>
              <span className="text-xs font-bold text-sky-600">{villa.bedrooms} Br</span>
           </div>
           <div className="flex items-center gap-2">
              <i className="fa-solid fa-users text-sky-200 text-xs"></i>
              <span className="text-xs font-bold text-sky-600">{villa.capacity} Guests</span>
           </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">Stay Exclusive</span>
            <span className="text-2xl font-black text-sky-900 font-serif">₹{villa.pricePerNight.toLocaleString()}</span>
          </div>
          <button 
            onClick={handleWhatsAppRedirect}
            className="w-14 h-14 bg-green-500 hover:bg-orange-500 text-white rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl active:scale-90"
          >
            <i className="fa-brands fa-whatsapp text-2xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillaCard;
