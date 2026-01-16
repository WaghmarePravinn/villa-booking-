
import React from 'react';
import { OfferPopup as OfferPopupType } from '../types';

interface OfferPopupProps {
  offer: OfferPopupType;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

const OfferPopup: React.FC<OfferPopupProps> = ({ offer, onClose, onNavigate }) => {
  if (!offer.enabled) return null;

  const handleAction = () => {
    onNavigate(offer.buttonLink);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-reveal">
      <div 
        className="bg-white rounded-[3rem] overflow-hidden max-w-2xl w-full shadow-2xl relative animate-popup flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/30 transition-all"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {offer.imageUrl && (
          <div className="md:w-1/2 h-64 md:h-auto overflow-hidden">
            <img src={offer.imageUrl} className="w-full h-full object-cover" alt="Offer" />
          </div>
        )}

        <div className="p-8 md:p-12 md:w-1/2 flex flex-col justify-center text-left">
          <div className="inline-block px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-6">
            Limited Time Offer
          </div>
          <h2 className="text-3xl font-bold font-serif text-slate-900 mb-4">{offer.title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 font-medium">
            {offer.description}
          </p>
          <button 
            onClick={handleAction}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-sky-600 transition-all active:scale-95"
          >
            {offer.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferPopup;
