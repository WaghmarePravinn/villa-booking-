
import React from 'react';
import { BRAND_NAME } from '../constants';

const AboutPage: React.FC = () => {
  return (
    <div className="pb-24">
      {/* Header */}
      <section className="bg-sky-100 text-sky-900 py-24 text-center border-b border-sky-200">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold font-serif mb-6">The {BRAND_NAME} Story</h1>
          <p className="text-sky-700 text-lg leading-relaxed font-light">
            Defining the new standard of private luxury travel since 2015.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 md:p-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center border border-sky-100">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-sky-900 mb-8">Crafting Unforgettable Moments</h2>
            <p className="text-sky-700 leading-relaxed mb-6">
              {BRAND_NAME} was founded on a simple belief: that travel should be more than just visiting a place—it should be about inhabiting its soul in total comfort. 
            </p>
            <p className="text-sky-700 leading-relaxed mb-8">
              We hand-select every property in our portfolio, ensuring they meet our strict standards for architecture, location, and privacy.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-4xl font-bold font-serif text-sky-600 mb-1">500+</p>
                <p className="text-sm font-bold text-sky-400 uppercase tracking-wider">Curated Villas</p>
              </div>
              <div>
                <p className="text-4xl font-bold font-serif text-sky-600 mb-1">12k</p>
                <p className="text-sm font-bold text-sky-400 uppercase tracking-wider">Happy Guests</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800" 
              alt="Luxury interior" 
              className="rounded-3xl shadow-2xl w-full h-[500px] object-cover border border-sky-50"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
