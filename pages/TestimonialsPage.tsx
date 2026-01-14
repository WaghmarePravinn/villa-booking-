
import React, { useState, useEffect, useMemo } from 'react';
import { Testimonial } from '../types';
import { subscribeToTestimonials, addTestimonial } from '../services/testimonialService';

const TestimonialsPage: React.FC = () => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Testimonial['category'] | 'All'>('All');

  useEffect(() => {
    const unsubscribe = subscribeToTestimonials((data) => {
      setReviews(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredReviews = useMemo(() => {
    if (activeCategory === 'All') return reviews;
    return reviews.filter(r => r.category === activeCategory);
  }, [reviews, activeCategory]);

  const categories: (Testimonial['category'] | 'All')[] = ['All', 'Trip', 'Booking', 'Food', 'Service', 'Hospitality'];

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as Testimonial['category'];
    
    try {
      await addTestimonial({
        name,
        content,
        rating: 5,
        category,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`
      });

      alert("Thank you! Your review has been published.");
      setShowReviewForm(false);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 animate-fade bg-slate-50/30">
      {/* Animated Live Feed Bar */}
      <div className="bg-slate-900 text-white py-4 overflow-hidden shadow-lg relative z-10">
        <div className="flex animate-[marquee_50s_linear_infinite] whitespace-nowrap">
           {[...reviews, ...reviews].slice(0, 20).map((r, i) => (
             <div key={`feed-${i}`} className="flex items-center gap-4 mx-12">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-black border border-white/20">
                  {r.name.charAt(0)}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="text-white">{r.name}</span> verified a <span className="text-orange-400 font-black">{r.category}</span> experience
                </span>
                <i className="fa-solid fa-bolt-lightning text-orange-500 text-[8px] animate-pulse"></i>
             </div>
           ))}
        </div>
      </div>

      <section className="bg-white py-24 text-center border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -ml-32 -mt-32"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mb-32"></div>
        
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <span className="text-orange-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Guest Chronicles</span>
          <h1 className="text-5xl md:text-7xl font-bold font-serif mb-8 text-slate-900 leading-tight">Authentic Stories</h1>
          <p className="text-slate-500 text-lg leading-relaxed font-light mb-12">
            Real feedback from our premium villa stays across India. Hear from our discerning community.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-100 shadow-sm'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button 
            onClick={() => { setShowReviewForm(true); setSubmitError(null); }}
            className="px-10 py-5 bg-orange-500 text-white font-black rounded-2xl hover:bg-slate-900 transition-all text-xs uppercase tracking-widest shadow-2xl shadow-orange-500/20 flex items-center gap-3 mx-auto active:scale-95"
          >
            <i className="fa-solid fa-pen-nib"></i>
            Post Your Experience
          </button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse uppercase text-[10px] font-black tracking-widest">
            Fetching Guest History...
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {filteredReviews.map((t, idx) => (
              <div 
                key={t.id} 
                className="break-inside-avoid bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 flex flex-col group hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 animate-reveal"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex text-orange-400 text-xs gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <i key={i} className="fa-solid fa-star"></i>
                    ))}
                  </div>
                  <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    {t.category}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium mb-10 text-lg italic">"{t.content}"</p>
                <div className="flex items-center gap-4 mt-auto border-t border-slate-50 pt-8">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group-hover:rotate-3 transition-transform">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{t.name}</h4>
                    <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest mt-1">
                      {t.timestamp ? new Date(t.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent Legacy Stay'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showReviewForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowReviewForm(false)}>
          <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full relative animate-popup" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowReviewForm(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-2">Share Your Story</h2>
            <p className="text-slate-500 text-sm mb-8">Tell us about your recent sanctuary stay.</p>
            
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-bold text-red-900 leading-relaxed">
                <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                {submitError}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleReviewSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                  <input name="name" type="text" required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-sm font-bold shadow-inner" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Experience</label>
                  <select name="category" required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-sm font-bold shadow-inner cursor-pointer">
                    <option value="Trip">Trip Overall</option>
                    <option value="Booking">Booking Process</option>
                    <option value="Food">Culinary Service</option>
                    <option value="Service">On-site Staff</option>
                    <option value="Hospitality">Vibe & Hospitality</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Your Narrative</label>
                <textarea name="content" required rows={4} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-sm font-medium shadow-inner" placeholder="Describe your stay..."></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-orange-500 transition-all disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? 'Syncing...' : 'Publish to Chronicles'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default TestimonialsPage;
