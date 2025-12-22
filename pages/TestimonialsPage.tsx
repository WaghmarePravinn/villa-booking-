
import React, { useState } from 'react';
import { TESTIMONIALS } from '../constants';

const TestimonialsPage: React.FC = () => {
  const [showReviewForm, setShowReviewForm] = useState(false);

  return (
    <div className="pb-24 animate-fade">
      <section className="bg-white py-24 text-center border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <span className="text-amber-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">The Guest Book</span>
          <h1 className="text-5xl md:text-7xl font-bold font-serif mb-8 text-slate-900">True Stories of Luxury</h1>
          <p className="text-slate-500 text-lg leading-relaxed font-light">
            We don't just host guests; we create memories that last a lifetime. Read about the Peak Stay experience from our global community.
          </p>
          <button 
            onClick={() => setShowReviewForm(true)}
            className="mt-10 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-600 transition-all text-xs uppercase tracking-widest shadow-xl"
          >
            Write a Review
          </button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {TESTIMONIALS.map((t, idx) => (
            <div 
              key={t.id} 
              className="break-inside-avoid bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 animate-scale"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex text-amber-400 mb-6 text-xs gap-1">
                {[...Array(t.rating)].map((_, i) => (
                  <i key={i} className="fa-solid fa-star"></i>
                ))}
              </div>
              <p className="text-slate-600 italic mb-8 leading-relaxed font-light text-lg">"{t.content}"</p>
              <div className="flex items-center gap-4 mt-auto border-t border-gray-50 pt-6">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                  <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                  <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest">Verified Guest Stay</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Extended Fake Testimonials for Layout */}
          {[
            { name: "David Miller", content: "Lonavala has many villas, but the management at Peak Stay is what sets them apart. Absolute perfection from check-in to check-out.", avatar: "https://i.pravatar.cc/150?u=david" },
            { name: "Elena Rossi", content: "We booked the Heritage villa in Konkan. The traditional food was the highlight of our trip. Truly an authentic experience with 5-star comfort.", avatar: "https://i.pravatar.cc/150?u=elena" }
          ].map((t, idx) => (
             <div 
              key={idx + 10} 
              className="break-inside-avoid bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-700"
            >
              <div className="flex text-amber-400 mb-6 text-xs gap-1">
                {[...Array(5)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
              </div>
              <p className="text-slate-600 italic mb-8 leading-relaxed font-light text-lg">"{t.content}"</p>
              <div className="flex items-center gap-4 mt-auto border-t border-gray-50 pt-6">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                  <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                  <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest">Verified Guest Stay</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showReviewForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowReviewForm(false)}>
          <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full relative animate-scale" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowReviewForm(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-2">Share Your Story</h2>
            <p className="text-slate-500 text-sm mb-8">We value your feedback and your privacy.</p>
            
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Thank you! Your review is pending approval."); setShowReviewForm(false); }}>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" required className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 text-sm font-bold" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rating</label>
                <div className="flex gap-2 text-2xl text-amber-400">
                   {[1, 2, 3, 4, 5].map(s => <i key={s} className="fa-regular fa-star cursor-pointer hover:text-amber-500"></i>)}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Feedback</label>
                <textarea required rows={4} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 text-sm font-medium" placeholder="Describe your stay..."></textarea>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsPage;
