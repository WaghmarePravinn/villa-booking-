
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
    { label: 'Stay', id: 'villas', icon: 'fa-map-location-dot' },
    { label: 'Services', id: 'services', icon: 'fa-concierge-bell' },
    { label: 'Contact', id: 'contact', icon: 'fa-envelope' }
  ];

  const handleLinkClick = (id: string) => {
    if (id === 'contact') {
      const footer = document.querySelector('footer');
      footer?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-sky-100 selection:text-sky-900 bg-[#fcfdfe]">
      {/* Top Banner - Higher contrast for mobile legibility */}
      <div 
        className="fixed top-0 left-0 right-0 z-[150] overflow-hidden py-1 sm:py-1.5 shadow-sm"
        style={{ backgroundColor: 'var(--t-marquee-bg)', color: 'var(--t-marquee-text)' }}
      >
        <div className="flex animate-[marquee_40s_linear_infinite] whitespace-nowrap">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.4em] mx-8 sm:mx-16 flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-white rounded-full opacity-40"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </span>
              {settings.promoText}
            </span>
          ))}
        </div>
      </div>

      {/* Top Navigation - Simplified for mobile */}
      <nav className="fixed top-6 sm:top-8 left-0 right-0 z-[140] transition-all duration-700 glass-panel shadow-sm border-b border-white/20 h-14 sm:h-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Branding */}
            <div 
              className="flex items-center cursor-pointer group space-x-2 sm:space-x-3 shrink-0" 
              onClick={() => onNavigate('home')}
            >
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-500 shadow-xl group-hover:rotate-6 bg-sky-600"
              >
                <i className="fa-solid fa-mountain text-white text-xs sm:text-base"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-lg font-black font-serif tracking-tight uppercase leading-none text-sky-600">
                  {BRAND_NAME.split(' ')[0]} {BRAND_NAME.split(' ')[1]}
                </span>
                <span className="text-[6px] sm:text-[7px] font-sans tracking-[0.25em] font-extrabold uppercase opacity-60 mt-0.5 text-amber-500">
                  DESTINATION
                </span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex space-x-10 items-center">
              {navLinks.map((link) => (
                <button 
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)} 
                  className={`relative text-[10px] font-black uppercase tracking-[0.25em] transition-all py-2 group ${currentPage === link.id ? 'opacity-100 text-sky-600' : 'opacity-40 hover:opacity-100'}`}
                >
                  {link.label}
                  <span 
                    className={`absolute bottom-0 left-0 h-0.5 transition-all duration-500 rounded-full bg-sky-600 ${currentPage === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`}
                  ></span>
                </button>
              ))}
            </div>

            {/* User Menu & CTA */}
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-sm">
                  <span className="hidden md:block text-[10px] font-black text-slate-800 px-3">{user.username}</span>
                  <button 
                    onClick={onLogout}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-all"
                  >
                    <i className="fa-solid fa-power-off text-xs"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onNavigate('login')}
                  className="px-3 sm:px-6 py-2 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                >
                  Log In
                </button>
              )}
              
              <button 
                onClick={() => onNavigate('villas')}
                className="px-4 sm:px-10 py-2 sm:py-3.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[11px] font-black uppercase tracking-widest text-white bg-sky-600 hover:bg-sky-700 transition-all shadow-lg shadow-sky-500/20"
              >
                Book
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Fixed Bottom for better reach and cleaner header */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[150] px-4 py-3 bg-white/80 backdrop-blur-2xl border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center">
          {navLinks.map((link) => (
            <button 
              key={link.id}
              onClick={() => handleLinkClick(link.id)} 
              className={`flex flex-col items-center justify-center w-16 transition-all ${currentPage === link.id ? 'scale-110' : 'opacity-40'}`}
            >
              <i className={`fa-solid ${link.icon} text-lg mb-1 ${currentPage === link.id ? 'text-sky-600' : 'text-slate-900'}`}></i>
              <span className={`text-[8px] font-black uppercase tracking-widest ${currentPage === link.id ? 'text-sky-600' : 'text-slate-500'}`}>
                {link.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-grow pt-20 sm:pt-28 pb-20 lg:pb-0">
        {children}
      </main>

      <footer className="py-12 sm:py-24 bg-slate-900 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 bg-sky-600 shadow-2xl">
                   <i className="fa-solid fa-mountain text-white text-lg"></i>
                </div>
                <span className="text-xl sm:text-3xl font-bold font-serif tracking-tight uppercase text-white">
                  {BRAND_NAME}
                </span>
              </div>
              <p className="max-w-md mb-10 text-sm sm:text-lg text-slate-400 italic font-medium leading-relaxed opacity-70">
                Experience the height of luxury and comfort with our curated selection of breathtaking private retreats.
              </p>
              <div className="flex space-x-6">
                {['instagram', 'facebook-f', 'linkedin-in', 'twitter'].map(social => (
                  <a key={social} href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all shadow-sm">
                    <i className={`fa-brands fa-${social} text-lg text-white group-hover:text-slate-900`}></i>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-10 col-span-1 md:col-span-2">
              <div>
                <h4 className="font-black mb-8 uppercase text-[10px] tracking-[0.5em] text-slate-500">Navigation</h4>
                <ul className="space-y-6 text-[12px] font-black uppercase tracking-widest text-slate-300">
                  {navLinks.map(link => (
                    <li key={link.id}><button onClick={() => handleLinkClick(link.id)} className="hover:text-sky-400 transition-colors">{link.label}</button></li>
                  ))}
                  <li><button onClick={() => onNavigate('about')} className="hover:text-sky-400 transition-colors">About Us</button></li>
                  <li><button className="hover:text-sky-400 transition-colors">Privacy</button></li>
                  <li><button className="hover:text-sky-400 transition-colors">Terms</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-black mb-8 uppercase text-[10px] tracking-[0.5em] text-slate-500">Contact</h4>
                <div className="flex flex-col gap-6">
                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase opacity-40 tracking-widest mb-1.5 text-white">Concierge</p>
                    <a href={`mailto:${settings.contactEmail}`} className="text-[12px] font-black text-slate-100 hover:text-sky-400 transition-colors truncate block">{settings.contactEmail}</a>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase opacity-40 tracking-widest mb-1.5 text-white">Direct</p>
                    <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" className="text-[12px] font-black text-slate-100 hover:text-emerald-400 transition-colors truncate block">{settings.whatsappNumber}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t mt-16 pt-10 flex flex-col md:flex-row justify-between items-center gap-8 border-slate-800">
            <p className="text-[9px] sm:text-[11px] uppercase tracking-[0.5em] font-black opacity-30 text-slate-400 text-center">
              &copy; {new Date().getFullYear()} {BRAND_NAME}
            </p>
            <div className="flex gap-4">
               <div className="w-8 h-1 rounded-full bg-sky-600 opacity-20"></div>
               <div className="w-8 h-1 rounded-full bg-amber-500 opacity-20"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
