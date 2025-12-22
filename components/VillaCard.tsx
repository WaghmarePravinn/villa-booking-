
import React from 'react';
import { Villa } from '../types';
import { WHATSAPP_NUMBER } from '../constants';

interface VillaCardProps {
  villa: Villa;
  onViewDetails: (id: string) => void;
}

const VillaCard: React.FC<VillaCardProps> = ({ villa, onViewDetails }) => {
  const handleWhatsAppRedirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = encodeURIComponent(`Hi, I am interested in booking "${villa.name}" in ${villa.location}. Could you please provide more information?`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div 
      onClick={() => onViewDetails(villa.id)}
      className="group bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)] transition-all duration-700 border border-gray-100 cursor-pointer flex flex-col h-full hover:-translate-y-4"
    >
      <div className="relative h-80 overflow-hidden">
        <img 
          src={villa.imageUrl} 
          alt={villa.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
        
        <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl text-sm font-black text-slate-900 shadow-2xl flex items-center gap-2 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
          <i className="fa-solid fa-star text-amber-500 group-hover:text-white"></i>
          {villa.rating}
        </div>

        {villa.isFeatured && (
          <div className="absolute top-8 left-8 bg-amber-500 px-5 py-2 rounded-2xl text-[10px] font-black text-white shadow-xl uppercase tracking-[0.2em]">
            Signature
          </div>
        )}

        <div className="absolute bottom-8 left-8 flex items-center gap-3">
          {villa.petFriendly && (
            <div className="bg-white/90 backdrop-blur-md w-10 h-10 rounded-2xl flex items-center justify-center text-slate-700 shadow-xl hover:bg-amber-500 hover:text-white transition-all duration-500">
              <i className="fa-solid fa-paw text-sm"></i>
            </div>
          )}
          {villa.mealsAvailable && (
             <div className="bg-white/90 backdrop-blur-md w-10 h-10 rounded-2xl flex items-center justify-center text-slate-700 shadow-xl hover:bg-amber-500 hover:text-white transition-all duration-500">
               <i className="fa-solid fa-utensils text-sm"></i>
             </div>
          )}
        </div>
      </div>

      <div className="p-10 flex flex-col flex-grow">
        <div className="mb-2">
           <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">{villa.location.split(',')[0]}</span>
        </div>
        <h3 className="text-3xl font-bold font-serif text-slate-900 leading-tight mb-4 group-hover:text-amber-600 transition-colors duration-500">
          {villa.name}
        </h3>
        
        <div className="flex items-center gap-6 mb-10 py-4 border-y border-gray-50">
           <div className="flex items-center gap-2">
              <i className="fa-solid fa-bed text-slate-300 text-xs"></i>
              <span className="text-xs font-bold text-slate-600">{villa.bedrooms} Br</span>
           </div>
           <div className="flex items-center gap-2">
              <i className="fa-solid fa-users text-slate-300 text-xs"></i>
              <span className="text-xs font-bold text-slate-600">{villa.capacity} Guests</span>
           </div>
           <div className="flex items-center gap-2">
              <i className="fa-solid fa-bath text-slate-300 text-xs"></i>
              <span className="text-xs font-bold text-slate-600">{villa.bathrooms} Ba</span>
           </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Starting from</span>
            <span className="text-2xl font-black text-slate-900 font-serif">₹{villa.pricePerNight.toLocaleString()}</span>
          </div>
          <button 
            onClick={handleWhatsAppRedirect}
            className="w-14 h-14 bg-emerald-500 hover:bg-slate-900 text-white rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl shadow-emerald-500/20 active:scale-90"
          >
            <i className="fa-brands fa-whatsapp text-2xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillaCard;
