import React from 'react';
import { User, UserRole, SiteSettings } from '../types';
import { BRAND_NAME, CONTACT_EMAIL } from '../constants';

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
    { label: 'Home', id: 'home' },
    { label: 'Villas', id: 'villas' },
    { label: 'Services', id: 'services' },
    { label: 'Testimonials', id: 'testimonials' },
    { label: 'About', id: 'about' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Dynamic Marquee - Themed via CSS Variables */}
      <div 
        className="fixed top-0 left-0 right-0 z-[110] overflow-hidden py-2 shadow-lg"
        style={{ backgroundColor: 'var(--t-marquee-bg)', color: 'var(--t-marquee-text)' }}
      >
        <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-[10px] font-black uppercase tracking-[0.3em] mx-10 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </span>
              {settings.promoText}
              <i className="fa-solid fa-sparkles"></i>
            </span>
          ))}
        </div>
      </div>

      <nav className="fixed top-8 left-0 right-0 z-[100] transition-all duration-500 glass-panel shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div 
              className="flex items-center cursor-pointer group" 
              onClick={() => onNavigate('home')}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-all duration-500 shadow-md"
                style={{ backgroundColor: 'var(--t-primary)' }}
              >
                <i className="fa-solid fa-hotel text-white text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black font-serif tracking-tight uppercase leading-none" style={{ color: 'var(--t-primary)' }}>
                  Peak Stay
                </span>
                <span className="text-[9px] font-sans tracking-[0.4em] font-bold uppercase opacity-60" style={{ color: 'var(--t-accent)' }}>
                  {settings.activeTheme.replace('_', ' ')} Collection
                </span>
              </div>
            </div>
            
            <div className="hidden lg:flex space-x-8 items-center">
              {navLinks.map((link) => (
                <button 
                  key={link.id}
                  onClick={() => onNavigate(link.id)} 
                  className={`relative text-[10px] font-black uppercase tracking-[0.2em] transition-all py-2 group ${currentPage === link.id ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                  style={{ color: currentPage === link.id ? 'var(--t-primary)' : 'inherit' }}
                >
                  {link.label}
                  <span 
                    className={`absolute bottom-0 left-0 h-0.5 transition-all duration-500 ${currentPage === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`}
                    style={{ backgroundColor: 'var(--t-primary)' }}
                  ></span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4 bg-white/50 p-1.5 rounded-2xl border border-white/20 shadow-sm">
                  <div 
                    className="flex flex-col items-end px-3 cursor-pointer group"
                    onClick={() => onNavigate(user.role === UserRole.ADMIN ? 'admin' : 'user-dashboard')}
                  >
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">
                      {user.role === UserRole.ADMIN ? 'Admin Center' : 'Guest Account'}
                    </span>
                    <span className="text-[11px] font-black leading-none">{user.username}</span>
                  </div>
                  {/* Fixed: Use onLogout prop instead of non-existent handleLogout */}
                  <button 
                    onClick={onLogout}
                    className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm transition-all border border-slate-50"
                  >
                    <i className="fa-solid fa-power-off text-sm"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onNavigate('login')}
                  className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 text-white"
                  style={{ backgroundColor: 'var(--t-primary)' }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow mt-28">
        {children}
      </main>

      <footer className="py-24 border-t" style={{ backgroundColor: 'rgba(var(--t-bg-rgb), 0.5)', borderColor: 'rgba(var(--t-primary-rgb), 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg" style={{ backgroundColor: 'var(--t-primary)' }}>
                   <i className="fa-solid fa-hotel text-white text-xl"></i>
                </div>
                <span className="text-3xl font-bold font-serif tracking-tight uppercase leading-none">
                  {BRAND_NAME}
                  <span className="block text-[10px] font-sans tracking-[0.4em] opacity-60">Indian Heritage Luxury</span>
                </span>
              </div>
              <p className="max-w-md mb-10 leading-loose font-light text-lg opacity-70">
                Crafting memories through a curated selection of India's most breathtaking private retreats.
              </p>
              <div className="flex space-x-4">
                {['instagram', 'facebook-f', 'linkedin-in'].map(social => (
                  <a key={social} href="#" className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center hover:text-white transition-all group border border-slate-100 shadow-sm" style={{ '--hover-bg': 'var(--t-primary)' } as any}>
                    <i className={`fa-brands fa-${social} group-hover:scale-110 transition-transform`}></i>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-black mb-8 uppercase text-[10px] tracking-[0.3em]" style={{ color: 'var(--t-accent)' }}>Quick Access</h4>
              <ul className="space-y-5 text-sm font-bold opacity-70">
                <li><button onClick={() => onNavigate('villas')} className="hover:opacity-100 transition-opacity">Villas</button></li>
                <li><button onClick={() => onNavigate('services')} className="hover:opacity-100 transition-opacity">Services</button></li>
                <li><button onClick={() => onNavigate('testimonials')} className="hover:opacity-100 transition-opacity">Reviews</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-8 uppercase text-[10px] tracking-[0.3em]" style={{ color: 'var(--t-secondary)' }}>Contact Hub</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Global Support</p>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm font-bold hover:opacity-70 transition-opacity">{CONTACT_EMAIL}</a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t mt-24 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 border-slate-100">
            <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-40">
              &copy; {new Date().getFullYear()} {BRAND_NAME}
            </p>
            <div className="flex gap-4">
               <div className="w-8 h-2 rounded-full opacity-40" style={{ backgroundColor: 'var(--t-primary)' }}></div>
               <div className="w-8 h-2 rounded-full opacity-40" style={{ backgroundColor: 'var(--t-accent)' }}></div>
               <div className="w-8 h-2 rounded-full opacity-40" style={{ backgroundColor: 'var(--t-secondary)' }}></div>
            </div>
          </div>
        </div>
      </footer>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        footer a:hover {
            color: var(--t-primary);
        }
      `}</style>
    </div>
  );
};

export default Layout;