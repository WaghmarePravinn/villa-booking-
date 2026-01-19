
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

  const getDashboardId = () => {
    if (!user) return null;
    return user.role === UserRole.ADMIN ? 'admin' : 'user-dashboard';
  };

  const dashboardId = getDashboardId();

  return (
    <div className="min-h-screen flex flex-col selection:bg-sky-100 selection:text-sky-900 bg-[#fcfdfe]">
      {/* Top Banner - Responsive visibility */}
      <div 
        className="fixed top-0 left-0 right-0 z-[200] overflow-hidden py-1 shadow-sm border-b border-white/10"
        style={{ backgroundColor: 'var(--t-marquee-bg)', color: 'var(--t-marquee-text)' }}
      >
        <div className="flex animate-[marquee_40s_linear_infinite] whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.3em] mx-6 sm:mx-20 flex items-center gap-2 sm:gap-4">
              <i className="fa-solid fa-sparkles text-amber-400"></i>
              {settings.promoText}
            </span>
          ))}
        </div>
      </div>

      {/* Main Top Nav - More compact on mobile */}
      <nav className="fixed top-6 sm:top-8 left-0 right-0 z-[190] transition-all duration-700 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-14 sm:h-20 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full flex justify-between items-center">
          {/* Branding */}
          <div 
            className="flex items-center cursor-pointer group space-x-2 sm:space-x-3 shrink-0" 
            onClick={() => onNavigate('home')}
          >
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 bg-sky-600">
              <i className="fa-solid fa-mountain text-white text-xs sm:text-base"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-xl font-black font-serif tracking-tight uppercase leading-none text-slate-900">
                Peak Stay
              </span>
              <span className="text-[5px] sm:text-[8px] font-sans tracking-[0.3em] font-extrabold uppercase opacity-60 mt-0.5 text-amber-500">
                DESTINATION
              </span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
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
              <div className="flex items-center gap-1.5 sm:gap-3 bg-slate-50 p-1 rounded-lg sm:rounded-xl border border-slate-100">
                {dashboardId && (
                  <button 
                    onClick={() => onNavigate(dashboardId)}
                    className={`px-2 sm:px-5 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${currentPage === dashboardId ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <i className={`fa-solid ${user.role === UserRole.ADMIN ? 'fa-user-shield' : 'fa-gauge-high'}`}></i>
                    <span className="hidden md:inline">{user.role === UserRole.ADMIN ? 'Admin' : 'Dashboard'}</span>
                  </button>
                )}
                {/* Fixed: Replaced undefined 'handleLogout' with the 'onLogout' prop */}
                <button 
                  onClick={onLogout}
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white transition-all"
                >
                  <i className="fa-solid fa-power-off text-[10px] sm:text-xs"></i>
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
              className="px-4 sm:px-10 py-2 sm:py-4 rounded-lg sm:rounded-xl text-[8px] sm:text-[11px] font-black uppercase tracking-widest text-white bg-sky-600 hover:bg-sky-700 transition-all shadow-xl shadow-sky-500/10 active:scale-95"
            >
              Book Stay
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Bar - Refined for high-density screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] pb-[calc(env(safe-area-inset-bottom)+0.5rem)] bg-white/95 backdrop-blur-3xl border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pt-2">
        <div className="flex justify-around items-center px-4">
          {navLinks.map((link) => (
            <button 
              key={link.id}
              onClick={() => handleLinkClick(link.id)} 
              className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 relative group min-w-[4rem] ${currentPage === link.id ? 'text-sky-600' : 'text-slate-400'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-all duration-300 ${currentPage === link.id ? 'bg-sky-50' : 'bg-transparent group-active:scale-90'}`}>
                <i className={`fa-solid ${link.icon} text-lg`}></i>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${currentPage === link.id ? 'opacity-100 transform translate-y-0' : 'opacity-60 transform'}`}>
                {link.label}
              </span>
              {currentPage === link.id && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-600 rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-grow pt-20 sm:pt-32 pb-24 lg:pb-0">
        {children}
      </main>

      <footer className="py-12 sm:py-32 bg-slate-900 border-t border-slate-800 mt-auto mb-16 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24">
            <div className="md:col-span-5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 bg-sky-600">
                   <i className="fa-solid fa-mountain text-white text-lg"></i>
                </div>
                <span className="text-xl sm:text-3xl font-bold font-serif tracking-tight uppercase text-white">Peak Stay</span>
              </div>
              <p className="text-sm sm:text-xl text-slate-400 font-medium leading-relaxed italic opacity-80 mb-8 max-w-md mx-auto md:mx-0">
                Discover the height of luxury and comfort with our curated selection of breathtaking private retreats.
              </p>
              <div className="flex justify-center md:justify-start gap-4">
                {['instagram', 'facebook-f', 'linkedin-in', 'whatsapp'].map(social => (
                  <a key={social} href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-sky-600 hover:border-sky-600 transition-all">
                    <i className={`fa-brands fa-${social} text-sm`}></i>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
              <div className="text-left">
                <h4 className="font-black mb-6 uppercase text-[8px] tracking-[0.4em] text-slate-500">Navigation</h4>
                <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {navLinks.map(link => (
                    <li key={link.id}><button onClick={() => handleLinkClick(link.id)} className="hover:text-sky-400 transition-colors">{link.label}</button></li>
                  ))}
                  <li><button onClick={() => onNavigate('admin')} className="hover:text-amber-400 transition-colors">Admin Portal</button></li>
                </ul>
              </div>
              <div className="col-span-1 sm:col-span-2 text-left">
                <h4 className="font-black mb-6 uppercase text-[8px] tracking-[0.4em] text-slate-500">Concierge Desk</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[7px] font-black uppercase opacity-40 tracking-widest mb-1 text-white">Email Reservation</p>
                    <a href={`mailto:${settings.contactEmail}`} className="text-xs sm:text-lg font-bold text-slate-100 hover:text-sky-400 transition-colors break-all">{settings.contactEmail}</a>
                  </div>
                  <div>
                    <p className="text-[7px] font-black uppercase opacity-40 tracking-widest mb-1 text-white">24/7 Priority Support</p>
                    <a href={`tel:${settings.contactPhone}`} className="text-xs sm:text-lg font-bold text-slate-100 hover:text-sky-400 transition-colors">{settings.contactPhone}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[8px] uppercase tracking-[0.3em] font-black text-slate-500 text-center">
              &copy; {new Date().getFullYear()} {BRAND_NAME}. Luxury Redefined.
            </p>
            <div className="flex gap-2 opacity-30">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
