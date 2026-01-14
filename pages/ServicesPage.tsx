
import React from 'react';
import { SERVICES } from '../constants';

const ServicesPage: React.FC = () => {
  const categories = [
    {
      title: "Desi Gourmet Experiences",
      description: "Celebrate Indian flavors with our in-villa chefs specializing in regional delicacies from across the subcontinent.",
      services: ["Private Maharaja Chef", "Tandoor Nights", "Regional Masterclasses", "Gourmet Picnic Baskets"],
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Ayurvedic Wellness",
      description: "Rooted in ancient Indian wisdom, our wellness programs offer rejuvenation through Ayurveda and traditional Yoga.",
      services: ["In-Villa Abhyanga Massage", "Vedic Yoga Sessions", "Chakra Meditation", "Organic Sattvic Menus"],
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="pb-24 animate-fade bg-[#f0f9ff]">
      <section className="bg-sky-100/50 text-sky-900 py-32 text-center relative overflow-hidden border-b border-sky-200">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="text-orange-600 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Elite Hospitality</span>
          <h1 className="text-5xl md:text-7xl font-bold font-serif mb-8">Premium Curations</h1>
          <p className="text-sky-700 text-xl leading-relaxed font-light">
            Luxury defined by the warmth of Indian hospitality and modern seamless orchestration.
          </p>
        </div>
        {/* Subtle tri-color background circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-green-100/20 rounded-full blur-3xl"></div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICES.map((service, idx) => (
            <div key={service.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-sky-50 flex flex-col items-center text-center transform hover:-translate-y-2 transition-all duration-500">
              <div className="w-20 h-20 bg-sky-50 rounded-3xl flex items-center justify-center mb-8 text-orange-500 text-3xl shadow-inner border border-sky-100">
                <i className={`fa-solid ${service.icon}`}></i>
              </div>
              <h3 className="text-2xl font-bold mb-4 font-serif text-sky-900">{service.title}</h3>
              <p className="text-sky-600 leading-relaxed text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="space-y-32">
           {categories.map((cat, idx) => (
             <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-20 items-center`}>
               <div className="lg:w-1/2">
                 <img src={cat.image} className="rounded-[3rem] shadow-2xl w-full h-[500px] object-cover border border-sky-100" alt="" />
               </div>
               <div className="lg:w-1/2 space-y-8 text-left">
                  <h2 className="text-4xl font-serif text-sky-900">{cat.title}</h2>
                  <p className="text-sky-600 text-lg leading-relaxed font-light">{cat.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cat.services.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-sky-100 shadow-sm">
                        <i className="fa-solid fa-circle-check text-green-500 text-xs"></i>
                        <span className="text-xs font-bold text-sky-800">{s}</span>
                      </div>
                    ))}
                  </div>
               </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
