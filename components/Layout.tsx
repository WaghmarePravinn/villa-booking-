
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
    { label: 'Reviews', id: 'testimonials', icon: 'fa-comment-dots' }
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
  };

  const dashboardId = user ? (user.role === UserRole.ADMIN ? 'admin' : 'user-dashboard') : null;

  return (
    <div className="min-h-screen flex flex-col selection:bg-sky-100 selection:text-sky-900 bg-[#fcfdfe]">
      {/* Top Global Announcement Banner */}
      <div 
        className="fixed top-0 left-0 right-0 z-[300] overflow-hidden py-2 shadow-sm border-b border-white/10 h-10 flex items-center"
        style={{ backgroundColor: 'var(--t-marquee-bg)', color: 'var(--t-marquee-text)' }}
      >
        <div className="flex animate-[marquee_40s_linear_infinite] whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.4em] mx-10 sm:mx-24 flex items-center gap-3 sm:gap-6">
              <i className="fa-solid fa-sparkles text-amber-400"></i>
              {settings.promoText}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation Bar - Refined for Large Breaks */}
      <nav className="fixed top-10 left-0 right-0 z-[250] bg-white/95 backdrop-blur-3xl border-b border-slate-100 h-20 sm:h-24 flex items-center shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full flex justify-between items-center">
          
          {/* Logo Branding Cluster */}
          <div 
            className="flex items-center cursor-pointer group space-x-4 shrink-0" 
            onClick={() => onNavigate('home')}
          >
            {settings.siteLogo ? (
              <img src={settings.siteLogo} alt={BRAND_NAME} className="w-10 h-10 sm:w-12 sm:h-12 object-contain transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl group-hover:scale-110 bg-sky-600">
                <i className="fa-solid fa-mountain text-white text-base sm:text-xl"></i>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-base sm:text-2xl font-black font-serif tracking-tight uppercase leading-none text-slate-900">
                Peak Stay
              </span>
              <span className="text-[6px] sm:text-[10px] font-sans tracking-[0.5em] font-extrabold uppercase opacity-50 mt-1 text-amber-500">
                DESTINATION
              </span>
            </div>
          </div>
          
          {/* Centralized Desktop Navigation Links */}
          <div className="hidden lg:flex space-x-12 xl:space-x-16 items-center">
            {navLinks.map((link) => (
              <button 
                key={link.id}
                onClick={() => handleLinkClick(link.id)} 
                className={`relative text-[10px] font-black uppercase tracking-[0.4em] transition-all py-4 group ${currentPage === link.id ? 'text-sky-600' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 h-1 transition-all duration-500 rounded-full bg-sky-600 ${currentPage === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </button>
            ))}
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-4 sm:gap-8">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                {dashboardId && (
                  <button 
                    onClick={() => onNavigate(dashboardId)}
                    className={`px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${currentPage === dashboardId ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <i className={`fa-solid ${user.role === UserRole.ADMIN ? 'fa-user-shield' : 'fa-gauge-high'}`}></i>
                    <span className="hidden xl:inline">{user.role === UserRole.ADMIN ? 'Admin Dashboard' : 'My Retreats'}</span>
                  </button>
                )}
                <button 
                  onClick={onLogout}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 transition-all hover:bg-white shadow-sm"
                  aria-label="Secure Logout"
                >
                  <i className="fa-solid fa-power-off text-sm"></i>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('login')}
                className="hidden sm:block px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-slate-900 transition-all"
              >
                Log In
              </button>
            )}
            
            <button 
              onClick={() => onNavigate('villas')}
              className="px-8 sm:px-14 py-3.5 sm:py-4 rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-white bg-sky-600 hover:bg-slate-900 transition-all shadow-2xl shadow-sky-600/20 active:scale-95"
            >
              Explore Stays
            </button>
          </div>
        </div>
      </nav>

      {/* Main Viewport Wrapper */}
      <main className="flex-grow pt-32 sm:pt-40 lg:pt-48">
        {children}
      </main>

      {/* Global Brand Footer */}
      <footer className="py-20 sm:py-40 bg-slate-900 border-t border-slate-800 mt-20 mb-24 lg:mb-0">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24">
            <div className="md:col-span-6 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-8">
                {settings.siteLogo ? (
                  <img src={settings.siteLogo} alt={BRAND_NAME} className="w-12 h-12 object-contain mr-5 brightness-0 invert" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mr-5 bg-sky-600 shadow-xl">
                    <i className="fa-solid fa-mountain text-white text-xl"></i>
                  </div>
                )}
                <span className="text-2xl sm:text-4xl font-black font-serif tracking-tight uppercase text-white">Peak Stay</span>
              </div>
              <p className="text-base sm:text-2xl text-slate-400 font-medium leading-relaxed italic opacity-70 mb-10 max-w-xl mx-auto md:mx-0">
                Curating breathtaking private retreats that define the new standard of Indian luxury and legacy travel.
              </p>
              <div className="flex justify-center md:justify-start gap-4">
                {['instagram', 'facebook-f', 'linkedin-in', 'whatsapp'].map(social => (
                  <a key={social} href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-sky-600 hover:scale-110 transition-all">
                    <i className={`fa-brands fa-${social} text-lg`}></i>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-12">
              <div className="text-left">
                <h4 className="font-black mb-8 uppercase text-[9px] tracking-[0.5em] text-slate-500">Discover</h4>
                <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {navLinks.map(link => (
                    <li key={link.id}><button onClick={() => handleLinkClick(link.id)} className="hover:text-sky-400 transition-all">/ {link.label}</button></li>
                  ))}
                  <li><button onClick={() => onNavigate('admin')} className="text-amber-500 hover:text-white transition-all">/ Admin Console</button></li>
                </ul>
              </div>
              <div className="col-span-1 sm:col-span-2 text-left">
                <h4 className="font-black mb-8 uppercase text-[9px] tracking-[0.5em] text-slate-500">Concierge Desk</h4>
                <div className="space-y-6">
                  <div>
                    <p className="text-[8px] font-black uppercase opacity-30 tracking-[0.3em] mb-2 text-white">Direct Line</p>
                    <a href={`tel:${settings.contactPhone}`} className="text-lg sm:text-2xl font-black text-slate-100 hover:text-sky-400 transition-colors">{settings.contactPhone}</a>
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase opacity-30 tracking-[0.3em] mb-2 text-white">Email Reservation</p>
                    <a href={`mailto:${settings.contactEmail}`} className="text-sm sm:text-lg font-bold text-slate-100 hover:text-sky-400 transition-colors break-all opacity-80">{settings.contactEmail}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-20 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.4em] font-black text-slate-600">
              &copy; {new Date().getFullYear()} {BRAND_NAME}. Luxury Redefined. Crafted for Legacy.
            </p>
            <div className="flex gap-4 opacity-10">
               <div className="w-2 h-2 rounded-full bg-orange-500"></div>
               <div className="w-2 h-2 rounded-full bg-white"></div>
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
