
import React from 'react';
import { BRAND_NAME } from '../constants';

const AboutPage: React.FC = () => {
  return (
    <div className="pb-24">
      {/* Header */}
      <section className="bg-slate-900 text-white py-24 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold font-serif mb-6">The {BRAND_NAME} Story</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Defining the new standard of private luxury travel since 2015.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 md:p-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center border border-gray-100">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 mb-8">Crafting Unforgettable Moments</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              {BRAND_NAME} was founded on a simple belief: that travel should be more than just visiting a place—it should be about inhabiting its soul in total comfort. 
            </p>
            <p className="text-slate-600 leading-relaxed mb-8">
              We hand-select every property in our portfolio, ensuring they meet our strict standards for architecture, location, and privacy. Our local concierge teams are the bridge between your desires and local reality.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-4xl font-bold font-serif text-amber-600 mb-1">500+</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Curated Villas</p>
              </div>
              <div>
                <p className="text-4xl font-bold font-serif text-amber-600 mb-1">12k</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Happy Guests</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800" 
              alt="Luxury interior" 
              className="rounded-3xl shadow-2xl w-full h-[500px] object-cover"
            />
            <div className="absolute -bottom-8 -left-8 bg-amber-600 text-white p-8 rounded-2xl hidden lg:block max-w-xs shadow-xl">
              <p className="font-serif italic text-lg mb-2">"True luxury is the absence of worry."</p>
              <p className="text-sm font-bold opacity-80">— Founder's Motto</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-serif mb-4">The {BRAND_NAME} Advantage</h2>
          <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: "Rigorous Selection", desc: "Only 1% of villas reviewed make it into our exclusive collection.", icon: "fa-gem" },
            { title: "24/7 Concierge", desc: "Your personal host is just a WhatsApp message away, any time, anywhere.", icon: "fa-user-tie" },
            { title: "Local Expertise", desc: "We live in the destinations we serve, giving you insider access.", icon: "fa-map-location-dot" }
          ].map((item, i) => (
            <div key={i} className="text-center p-8 bg-white rounded-3xl border border-gray-100 hover:shadow-xl transition-all group">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;