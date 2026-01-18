
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
    { label: 'Testimonials', id: 'testimonials', icon: 'fa-comment-dots' }
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
  };

  const getDashboardId = () => {
    if (!user) return null;
    return user.role === UserRole.ADMIN ? 'admin' : 'user-dashboard';
  };

  const dashboardId = getDashboardId();

  return (
    <div className="min-h-screen flex flex-col selection:bg-sky-100 selection:text-sky-900 bg-[#fcfdfe]">
      {/* Top Banner - Slimmer and more elegant */}
      <div 
        className="fixed top-0 left-0 right-0 z-[200] overflow-hidden py-1 shadow-sm border-b border-white/10"
        style={{ backgroundColor: 'var(--t-marquee-bg)', color: 'var(--t-marquee-text)' }}
      >
        <div className="flex animate-[marquee_40s_linear_infinite] whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.3em] mx-10 sm:mx-20 flex items-center gap-4">
              <i className="fa-solid fa-sparkles text-amber-400"></i>
              {settings.promoText}
            </span>
          ))}
        </div>
      </div>

      {/* Main Top Nav - Refined Spacing */}
      <nav className="fixed top-6 sm:top-8 left-0 right-0 z-[190] transition-all duration-700 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 sm:h-20 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full flex justify-between items-center">
          {/* Branding */}
          <div 
            className="flex items-center cursor-pointer group space-x-2 sm:space-x-3 shrink-0" 
            onClick={() => onNavigate('home')}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-500 shadow-xl group-hover:scale-110 bg-sky-600">
              <i className="fa-solid fa-mountain text-white text-sm sm:text-base"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-xl font-black font-serif tracking-tight uppercase leading-none text-slate-900">
                Peak Stay
              </span>
              <span className="text-[6px] sm:text-[8px] font-sans tracking-[0.3em] font-extrabold uppercase opacity-60 mt-0.5 text-amber-500">
                DESTINATION
              </span>
            </div>
          </div>
          
          {/* Desktop Navigation - Improved visibility */}
          <div className="hidden lg:flex space-x-12 items-center">
            {navLinks.map((link) => (
              <button 
                key={link.id}
                onClick={() => handleLinkClick(link.id)} 
                className={`relative text-[10px] font-black uppercase tracking-[0.3em] transition-all py-2 group ${currentPage === link.id ? 'text-sky-600' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 h-0.5 transition-all duration-500 rounded-full bg-sky-600 ${currentPage === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </button>
            ))}
          </div>

          {/* User & CTA Area */}
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                {dashboardId && (
                  <button 
                    onClick={() => onNavigate(dashboardId)}
                    className={`px-3 sm:px-5 py-2 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${currentPage === dashboardId ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <i className={`fa-solid ${user.role === UserRole.ADMIN ? 'fa-user-shield' : 'fa-gauge-high'}`}></i>
                    <span className="hidden md:inline">{user.role === UserRole.ADMIN ? 'Admin' : 'My Dashboard'}</span>
                  </button>
                )}
                <button 
                  onClick={onLogout}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white transition-all"
                >
                  <i className="fa-solid fa-power-off text-xs"></i>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('login')}
                className="hidden sm:block px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all"
              >
                Log In
              </button>
            )}
            
            <button 
              onClick={() => onNavigate('villas')}
              className="px-5 sm:px-10 py-2.5 sm:py-4 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-white bg-sky-600 hover:bg-sky-700 transition-all shadow-xl shadow-sky-500/10 active:scale-95"
            >
              Book Stay
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Bar - Fixed at bottom for touch accessibility */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] pb-safe bg-white/90 backdrop-blur-2xl border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 sm:h-20">
          {navLinks.map((link) => (
            <button 
              key={link.id}
              onClick={() => handleLinkClick(link.id)} 
              className={`flex flex-col items-center justify-center w-full transition-all ${currentPage === link.id ? 'text-sky-600' : 'text-slate-400'}`}
            >
              <i className={`fa-solid ${link.icon} text-lg mb-1`}></i>
              <span className="text-[7px] font-black uppercase tracking-widest">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-grow pt-24 sm:pt-32 pb-24 lg:pb-0">
        {children}
      </main>

      <footer className="py-16 sm:py-32 bg-slate-900 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24">
            <div className="md:col-span-5">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 bg-sky-600">
                   <i className="fa-solid fa-mountain text-white text-xl"></i>
                </div>
                <span className="text-2xl sm:text-3xl font-bold font-serif tracking-tight uppercase text-white">Peak Stay</span>
              </div>
              <p className="text-base sm:text-xl text-slate-400 font-medium leading-relaxed italic opacity-80 mb-10">
                Discover the height of luxury and comfort with our curated selection of breathtaking private retreats.
              </p>
              <div className="flex gap-4">
                {['instagram', 'facebook-f', 'linkedin-in', 'whatsapp'].map(social => (
                  <a key={social} href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-sky-600 hover:border-sky-600 transition-all">
                    <i className={`fa-brands fa-${social} text-lg`}></i>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12">
              <div>
                <h4 className="font-black mb-8 uppercase text-[9px] tracking-[0.4em] text-slate-500">Navigation</h4>
                <ul className="space-y-4 text-[11px] font-black uppercase tracking-widest text-slate-300">
                  {navLinks.map(link => (
                    <li key={link.id}><button onClick={() => handleLinkClick(link.id)} className="hover:text-sky-400 transition-colors">{link.label}</button></li>
                  ))}
                  <li><button onClick={() => onNavigate('admin')} className="hover:text-amber-400 transition-colors">Admin Portal</button></li>
                </ul>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <h4 className="font-black mb-8 uppercase text-[9px] tracking-[0.4em] text-slate-500">Concierge Desk</h4>
                <div className="space-y-6">
                  <div>
                    <p className="text-[8px] font-black uppercase opacity-40 tracking-widest mb-1 text-white">Email Reservation</p>
                    <a href={`mailto:${settings.contactEmail}`} className="text-sm sm:text-lg font-bold text-slate-100 hover:text-sky-400 transition-colors">{settings.contactEmail}</a>
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase opacity-40 tracking-widest mb-1 text-white">24/7 Priority Support</p>
                    <a href={`tel:${settings.contactPhone}`} className="text-sm sm:text-lg font-bold text-slate-100 hover:text-sky-400 transition-colors">{settings.contactPhone}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-20 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[9px] uppercase tracking-[0.4em] font-black text-slate-500">
              &copy; {new Date().getFullYear()} {BRAND_NAME}. Luxury Redefined.
            </p>
            <div className="flex gap-2">
               <div className="w-2 h-2 rounded-full bg-orange-500 opacity-20"></div>
               <div className="w-2 h-2 rounded-full bg-white opacity-20"></div>
               <div className="w-2 h-2 rounded-full bg-green-500 opacity-20"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
