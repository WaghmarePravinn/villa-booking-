
import React, { useState, useEffect } from 'react';
import { Testimonial } from '../types';
import { subscribeToTestimonials, addTestimonial } from '../services/testimonialService';

const TestimonialsPage: React.FC = () => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTestimonials((data) => {
      setReviews(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const content = formData.get('content') as string;
    
    try {
      await addTestimonial({
        name,
        content,
        rating: 5,
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
    <div className="pb-24 animate-fade">
      <section className="bg-white py-24 text-center border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <span className="text-amber-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">The Guest Book</span>
          <h1 className="text-5xl md:text-7xl font-bold font-serif mb-8 text-slate-900">True Stories of Luxury</h1>
          <p className="text-slate-500 text-lg leading-relaxed font-light">
            Read authentic experiences from our global community of travelers.
          </p>
          <button 
            onClick={() => { setShowReviewForm(true); setSubmitError(null); }}
            className="mt-10 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-600 transition-all text-xs uppercase tracking-widest shadow-xl"
          >
            Write a Review
          </button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse uppercase text-[10px] font-black tracking-widest">
            Syncing Guest Stories...
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {reviews.map((t, idx) => (
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
          </div>
        )}
      </section>

      {showReviewForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowReviewForm(false)}>
          <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full relative animate-scale" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowReviewForm(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-2">Share Your Story</h2>
            <p className="text-slate-500 text-sm mb-8">Tell us about your recent sanctuary stay.</p>
            
            {submitError && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] font-bold text-amber-900 leading-relaxed">
                <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                {submitError}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleReviewSubmit}>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input name="name" type="text" required className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 text-sm font-bold" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Feedback</label>
                <textarea name="content" required rows={4} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 text-sm font-medium" placeholder="Describe your stay..."></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsPage;
