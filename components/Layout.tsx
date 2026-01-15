
import React from 'react';
import { User, UserRole, SiteSettings } from '../types';
import { BRAND_NAME } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  settings: SiteSettings;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Layout: React.FC<LayoutProps> = ({ children, user, settings, onLogout, onNavigate, currentPage }) => {
  const navLinks = [
    { label: 'Collection', id: 'villas' },
    { label: 'Experiences', id: 'services' },
    { label: 'Chronicles', id: 'testimonials' },
    { label: 'Legacy', id: 'about' }
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-sky-100 selection:text-sky-900">
      {/* Dynamic Marquee - Responsive Height */}
      <div 
        className="fixed top-0 left-0 right-0 z-[120] overflow-hidden py-1.5 sm:py-2.5 shadow-sm"
        style={{ backgroundColor: 'var(--t-marquee-bg)', color: 'var(--t-marquee-text)' }}
      >
        <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mx-6 sm:mx-12 flex items-center gap-3 sm:gap-6">
              <span className="flex items-center gap-1.5">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full opacity-40"></div>
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
              </span>
              {settings.promoText}
              <i className="fa-solid fa-sparkles text-white/50 text-[10px]"></i>
            </span>
          ))}
        </div>
      </div>

      <nav className="fixed top-8 sm:top-10 left-0 right-0 z-[110] transition-all duration-700 glass-panel shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            {/* Branding - Responsive Sizing */}
            <div 
              className="flex items-center cursor-pointer group space-x-2 sm:space-x-4 shrink-0" 
              onClick={() => onNavigate('home')}
            >
              <div 
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl group-hover:rotate-12"
                style={{ backgroundColor: 'var(--t-primary)' }}
              >
                <i className="fa-solid fa-hotel text-white text-base sm:text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-black font-serif tracking-tight uppercase leading-none" style={{ color: 'var(--t-primary)' }}>
                  Peak Stay
                </span>
                <span className="text-[6px] sm:text-[8px] font-sans tracking-[0.2em] sm:tracking-[0.4em] font-extrabold uppercase opacity-60 mt-0.5 sm:mt-1" style={{ color: 'var(--t-accent)' }}>
                  {settings.activeTheme.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex space-x-8 xl:space-x-12 items-center">
              {navLinks.map((link) => (
                <button 
                  key={link.id}
                  onClick={() => onNavigate(link.id)} 
                  className={`relative text-[10px] font-black uppercase tracking-[0.25em] transition-all py-2 group ${currentPage === link.id ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                  style={{ color: currentPage === link.id ? 'var(--t-primary)' : 'inherit' }}
                >
                  {link.label}
                  <span 
                    className={`absolute bottom-0 left-0 h-0.5 transition-all duration-500 rounded-full ${currentPage === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`}
                    style={{ backgroundColor: 'var(--t-primary)' }}
                  ></span>
                </button>
              ))}
            </div>

            {/* Mobile Actions & User Menu */}
            <div className="flex items-center gap-2 sm:gap-6">
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-3 bg-white/60 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/40 shadow-sm hover:shadow-md transition-all">
                  <div 
                    className="flex flex-col items-end px-2 sm:px-4 cursor-pointer group max-w-[80px] sm:max-w-none"
                    onClick={() => onNavigate(user.role === UserRole.ADMIN ? 'admin' : 'user-dashboard')}
                  >
                    <span className="hidden sm:block text-[7px] font-black uppercase tracking-[0.25em] opacity-50 mb-0.5">
                      {user.role === UserRole.ADMIN ? 'CONTROL' : 'GUEST'}
                    </span>
                    <span className="text-[10px] sm:text-xs font-black leading-none text-slate-800 truncate w-full text-right">{user.username}</span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-all border border-slate-50 hover:bg-red-50"
                    title="Sign Out"
                  >
                    <i className="fa-solid fa-power-off text-xs sm:text-sm"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onNavigate('login')}
                  className="px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 text-white premium-btn border-none"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation - Scrollable */}
        <div className="lg:hidden flex overflow-x-auto no-scrollbar px-4 py-2 bg-white/20 border-t border-white/20">
          <div className="flex gap-4">
            {navLinks.map((link) => (
              <button 
                key={link.id}
                onClick={() => onNavigate(link.id)} 
                className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap px-3 py-1.5 rounded-full transition-all ${currentPage === link.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-grow mt-24 sm:mt-32">
        {children}
      </main>

      <footer className="py-12 sm:py-24 bg-white/50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6 sm:mb-10">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-5 shadow-2xl" style={{ backgroundColor: 'var(--t-primary)' }}>
                   <i className="fa-solid fa-hotel text-white text-lg sm:text-xl"></i>
                </div>
                <span className="text-2xl sm:text-4xl font-bold font-serif tracking-tight uppercase leading-none text-slate-900">
                  {BRAND_NAME}
                  <span className="block text-[8px] sm:text-[11px] font-sans tracking-[0.3em] sm:tracking-[0.5em] opacity-50 mt-1 sm:mt-2 font-black">INDIAN HERITAGE LUXURY</span>
                </span>
              </div>
              <p className="max-w-md mb-8 sm:mb-12 leading-relaxed sm:leading-loose font-medium text-base sm:text-lg text-slate-500 italic">
                Crafting timeless memories through a curated selection of India's most breathtaking private retreats.
              </p>
              <div className="flex space-x-4 sm:space-x-6">
                {['instagram', 'facebook-f', 'linkedin-in'].map(social => (
                  <a key={social} href="#" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all group border border-slate-100 shadow-sm">
                    <i className={`fa-brands fa-${social} text-sm sm:text-base group-hover:scale-110 transition-transform`}></i>
                  </a>
                ))}
              </div>
            </div>
            <div className="hidden sm:block">
              <h4 className="font-black mb-6 sm:mb-10 uppercase text-[10px] sm:text-[11px] tracking-[0.4em] text-slate-400">Discover</h4>
              <ul className="space-y-4 sm:space-y-6 text-[12px] sm:text-[13px] font-bold text-slate-600">
                <li><button onClick={() => onNavigate('villas')} className="hover:text-sky-600 transition-colors">The Collection</button></li>
                <li><button onClick={() => onNavigate('services')} className="hover:text-sky-600 transition-colors">Experiences</button></li>
                <li><button onClick={() => onNavigate('testimonials')} className="hover:text-sky-600 transition-colors">Guest Stories</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-6 sm:mb-10 uppercase text-[10px] sm:text-[11px] tracking-[0.4em] text-slate-400">Reach Us</h4>
              <div className="flex flex-col gap-6 sm:gap-8">
                <div className="flex items-center gap-3 sm:gap-5 group">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-sky-100 transition-colors shrink-0">
                    <i className="fa-solid fa-envelope text-slate-400 group-hover:text-sky-600 text-sm sm:text-base"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] sm:text-[9px] font-black uppercase opacity-40 tracking-widest mb-0.5 sm:mb-1">Global Support</p>
                    <a href={`mailto:${settings.contactEmail}`} className="text-xs sm:text-sm font-bold text-slate-800 hover:text-sky-600 transition-colors truncate block">{settings.contactEmail}</a>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 group">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors shrink-0">
                    <i className="fa-brands fa-whatsapp text-emerald-400 group-hover:text-emerald-600 text-sm sm:text-base"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] sm:text-[9px] font-black uppercase opacity-40 tracking-widest mb-0.5 sm:mb-1">WhatsApp Concierge</p>
                    <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" className="text-xs sm:text-sm font-bold text-slate-800 hover:text-emerald-600 transition-colors truncate block">{settings.whatsappNumber}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t mt-12 sm:mt-24 pt-8 sm:pt-12 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 border-slate-100">
            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.5em] font-black opacity-30 text-center">
              &copy; {new Date().getFullYear()} {BRAND_NAME} • ALL RIGHTS RESERVED
            </p>
            <div className="flex gap-4 sm:gap-5">
               <div className="w-8 h-1 sm:w-10 sm:h-1.5 rounded-full opacity-20" style={{ backgroundColor: 'var(--t-primary)' }}></div>
               <div className="w-8 h-1 sm:w-10 sm:h-1.5 rounded-full opacity-20" style={{ backgroundColor: 'var(--t-accent)' }}></div>
               <div className="w-8 h-1 sm:w-10 sm:h-1.5 rounded-full opacity-20" style={{ backgroundColor: 'var(--t-secondary)' }}></div>
            </div>
          </div>
        </div>
      </footer>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default Layout;
