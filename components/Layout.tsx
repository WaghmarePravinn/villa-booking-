
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
    { label: 'Home', id: 'home', icon: 'fa-house' },
    { label: 'Villas', id: 'villas', icon: 'fa-hotel' },
    { label: 'Services', id: 'services', icon: 'fa-concierge-bell' },
    { label: 'Testimonials', id: 'testimonials', icon: 'fa-comment-dots' },
    { label: 'About', id: 'about', icon: 'fa-circle-info' }
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-sky-100 selection:text-sky-900">
      {/* Dynamic Marquee */}
      <div 
        className="fixed top-0 left-0 right-0 z-[120] overflow-hidden py-1.5 sm:py-2 shadow-sm"
        style={{ backgroundColor: 'var(--t-marquee-bg)', color: 'var(--t-marquee-text)' }}
      >
        <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mx-4 sm:mx-12 flex items-center gap-2 sm:gap-6">
              <span className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-white rounded-full opacity-40"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </span>
              {settings.promoText}
              <i className="fa-solid fa-sparkles text-white/50"></i>
            </span>
          ))}
        </div>
      </div>

      <nav className="fixed top-6 sm:top-8 left-0 right-0 z-[110] transition-all duration-700 glass-panel shadow-sm border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-20 items-center">
            {/* Branding */}
            <div 
              className="flex items-center cursor-pointer group space-x-2 sm:space-x-4 shrink-0" 
              onClick={() => onNavigate('home')}
            >
              <div 
                className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl group-hover:rotate-12"
                style={{ backgroundColor: 'var(--t-primary)' }}
              >
                <i className="fa-solid fa-hotel text-white text-xs sm:text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-xl font-black font-serif tracking-tight uppercase leading-none" style={{ color: 'var(--t-primary)' }}>
                  {BRAND_NAME.split(' ')[0]}
                </span>
                <span className="text-[6px] sm:text-[8px] font-sans tracking-[0.2em] font-extrabold uppercase opacity-60 mt-0.5" style={{ color: 'var(--t-accent)' }}>
                  EST. 2015
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

            {/* User Menu */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2 bg-white/60 p-1 rounded-xl border border-white/40 shadow-sm">
                  <div 
                    className="flex flex-col items-end px-2 sm:px-4 cursor-pointer"
                    onClick={() => onNavigate(user.role === UserRole.ADMIN ? 'admin' : 'user-dashboard')}
                  >
                    <span className="text-[9px] sm:text-xs font-black text-slate-800 truncate max-w-[60px] sm:max-w-none">{user.username}</span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-white flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-all"
                  >
                    <i className="fa-solid fa-power-off text-xs"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onNavigate('login')}
                  className="px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white premium-btn border-none"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Persistent Mobile Sub-Navigation - Clear & Visible */}
        <div className="lg:hidden flex justify-between px-2 py-2 bg-white/40 border-t border-white/20 backdrop-blur-md overflow-x-auto no-scrollbar">
          {navLinks.map((link) => (
            <button 
              key={link.id}
              onClick={() => onNavigate(link.id)} 
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 transition-all rounded-xl ${currentPage === link.id ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'opacity-60'}`}
            >
              <i className={`fa-solid ${link.icon} text-[14px] mb-1`} style={{ color: currentPage === link.id ? 'var(--t-primary)' : 'inherit' }}></i>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${currentPage === link.id ? 'text-slate-900' : 'text-slate-500'}`}>
                {link.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-grow pt-24 sm:pt-36">
        {children}
      </main>

      <footer className="py-12 sm:py-24 bg-white/50 border-t border-slate-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-5 shadow-2xl" style={{ backgroundColor: 'var(--t-primary)' }}>
                   <i className="fa-solid fa-hotel text-white text-lg sm:text-xl"></i>
                </div>
                <span className="text-2xl sm:text-4xl font-bold font-serif tracking-tight uppercase leading-none text-slate-900">
                  {BRAND_NAME}
                </span>
              </div>
              <p className="max-w-md mb-8 leading-relaxed font-medium text-base text-slate-500 italic">
                Crafting timeless memories through a curated selection of India's most breathtaking private retreats.
              </p>
              <div className="flex space-x-4">
                {['instagram', 'facebook-f', 'linkedin-in'].map(social => (
                  <a key={social} href="#" className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all border border-slate-100 shadow-sm">
                    <i className={`fa-brands fa-${social} text-sm`}></i>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 col-span-1 md:col-span-2">
              <div>
                <h4 className="font-black mb-6 uppercase text-[10px] tracking-[0.4em] text-slate-400">Navigation</h4>
                <ul className="space-y-4 text-[12px] font-bold text-slate-600">
                  {navLinks.map(link => (
                    <li key={link.id}><button onClick={() => onNavigate(link.id)} className="hover:text-sky-600 transition-colors">{link.label}</button></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-black mb-6 uppercase text-[10px] tracking-[0.4em] text-slate-400">Contact</h4>
                <div className="flex flex-col gap-4">
                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase opacity-40 tracking-widest mb-1">Global Support</p>
                    <a href={`mailto:${settings.contactEmail}`} className="text-xs font-bold text-slate-800 hover:text-sky-600 transition-colors truncate block">{settings.contactEmail}</a>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase opacity-40 tracking-widest mb-1">WhatsApp</p>
                    <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" className="text-xs font-bold text-slate-800 hover:text-emerald-600 transition-colors truncate block">{settings.whatsappNumber}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 border-slate-100">
            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.3em] font-black opacity-30 text-center">
              &copy; {new Date().getFullYear()} {BRAND_NAME} • ALL RIGHTS RESERVED
            </p>
            <div className="flex gap-4">
               <div className="w-8 h-1 rounded-full opacity-20" style={{ backgroundColor: 'var(--t-primary)' }}></div>
               <div className="w-8 h-1 rounded-full opacity-20" style={{ backgroundColor: 'var(--t-accent)' }}></div>
               <div className="w-8 h-1 rounded-full opacity-20" style={{ backgroundColor: 'var(--t-secondary)' }}></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
