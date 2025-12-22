
import React from 'react';
import { SERVICES } from '../constants';

const ServicesPage: React.FC = () => {
  const categories = [
    {
      title: "Culinary Experiences",
      description: "From traditional regional delicacies to international fine dining, our chefs curate menus that celebrate flavor and local produce.",
      services: ["Private In-Villa Chef", "Barbecue Nights", "Cooking Masterclasses", "Gourmet Picnic Baskets"],
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Wellness & Rejuvenation",
      description: "Transform your villa into a private sanctuary with our curated wellness programs led by certified practitioners.",
      services: ["In-Villa Massage Therapy", "Sunrise Yoga Sessions", "Guided Meditation", "Organic Detox Menus"],
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Logistics & Exploration",
      description: "Seamless travel and exclusive access. We handle the details while you create the memories.",
      services: ["Luxury Airport Transfers", "Private Chauffeur", "Guided Heritage Tours", "Yacht & Boat Rentals"],
      image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="pb-24 animate-fade">
      <section className="bg-slate-900 text-white py-32 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="Background" />
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="text-amber-500 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">The Concierge Tier</span>
          <h1 className="text-5xl md:text-7xl font-bold font-serif mb-8">Curated Experiences</h1>
          <p className="text-slate-400 text-xl leading-relaxed font-light">
            Luxury is not just a place to sleep; it's the seamless orchestration of your desires. Our on-ground teams ensure every moment is managed to perfection.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICES.map((service, idx) => (
            <div key={service.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center text-center transform hover:-translate-y-2 transition-all duration-500">
              <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-8 text-amber-600 text-3xl">
                <i className={`fa-solid ${service.icon}`}></i>
              </div>
              <h3 className="text-2xl font-bold mb-4 font-serif">{service.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="space-y-32">
          {categories.map((cat, idx) => (
            <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-20 items-center`}>
              <div className="lg:w-1/2">
                <div className="relative">
                  <img src={cat.image} alt={cat.title} className="rounded-[3rem] shadow-2xl w-full h-[500px] object-cover" />
                  <div className="absolute -bottom-10 -right-10 bg-slate-900 text-white p-10 rounded-[2.5rem] hidden lg:block shadow-2xl">
                    <p className="text-4xl font-serif mb-2">0{idx + 1}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Service Category</p>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 leading-tight">{cat.title}</h2>
                <p className="text-slate-600 text-lg leading-relaxed font-light">{cat.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cat.services.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <i className="fa-solid fa-check text-emerald-500 text-xs"></i>
                      <span className="text-xs font-bold text-slate-700">{s}</span>
                    </div>
                  ))}
                </div>
                <button className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-600 transition-all text-xs uppercase tracking-widest">
                  Inquire Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-amber-50 py-24 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-serif mb-6 text-slate-900">Custom Request?</h2>
          <p className="text-slate-600 mb-10 leading-relaxed">
            Need something specifically tailored for an event, wedding, or corporate retreat? Our event management specialists are at your disposal.
          </p>
          <a href="https://wa.me/+919157928471" className="inline-flex items-center gap-3 px-10 py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 uppercase text-xs tracking-widest">
            <i className="fa-brands fa-whatsapp text-lg"></i>
            Chat with Concierge
          </a>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
