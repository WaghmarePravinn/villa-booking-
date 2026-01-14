
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
    <div className="min-h-screen flex flex-col bg-[#f0f9ff]">
      {/* Festive Marquee - Tri-color themed */}
      <div className="fixed top-0 left-0 right-0 z-[110] bg-orange-500 text-white overflow-hidden py-2 border-b border-orange-400/20 shadow-lg">
        <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-[10px] font-black uppercase tracking-[0.3em] mx-10 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
              </span>
              {settings.promoText}
              <i className="fa-solid fa-flag"></i>
            </span>
          ))}
        </div>
      </div>

      <nav className="fixed top-8 left-0 right-0 z-[100] transition-all duration-500 glass-panel shadow-sm border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div 
              className="flex items-center cursor-pointer group" 
              onClick={() => onNavigate('home')}
            >
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mr-3 group-hover:bg-orange-600 transition-all duration-500 shadow-md">
                <i className="fa-solid fa-hotel text-white text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black font-serif tracking-tight uppercase leading-none text-sky-900">
                  Peak Stay
                </span>
                <span className="text-[9px] font-sans tracking-[0.4em] text-green-600 font-bold uppercase">Patriotic Collection</span>
              </div>
            </div>
            
            <div className="hidden lg:flex space-x-8 items-center">
              {navLinks.map((link) => (
                <button 
                  key={link.id}
                  onClick={() => onNavigate(link.id)} 
                  className={`relative text-[10px] font-black uppercase tracking-[0.2em] transition-all py-2 group ${currentPage === link.id ? 'text-orange-500' : 'text-sky-400 hover:text-orange-500'}`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-orange-500 transition-all duration-500 ${currentPage === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4 bg-sky-50 p-1.5 rounded-2xl border border-sky-100 shadow-sm">
                  <div 
                    className="flex flex-col items-end px-3 cursor-pointer group"
                    onClick={() => onNavigate(user.role === UserRole.ADMIN ? 'admin' : 'user-dashboard')}
                  >
                    <span className="text-[7px] font-black text-green-600 uppercase tracking-[0.2em]">
                      {user.role === UserRole.ADMIN ? 'Admin Center' : 'Guest Account'}
                    </span>
                    <span className="text-[11px] font-black text-sky-900 leading-none">{user.username}</span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sky-300 hover:text-orange-500 shadow-sm transition-all border border-sky-50"
                  >
                    <i className="fa-solid fa-power-off text-sm"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onNavigate('login')}
                  className="px-8 py-3 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95"
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

      <footer className="bg-sky-100/50 text-sky-900 py-24 border-t border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                   <i className="fa-solid fa-hotel text-white text-xl"></i>
                </div>
                <span className="text-3xl font-bold font-serif text-sky-900 tracking-tight uppercase leading-none">
                  {BRAND_NAME}
                  <span className="block text-[10px] text-green-600 font-sans tracking-[0.4em]">Indian Heritage Luxury</span>
                </span>
              </div>
              <p className="max-w-md mb-10 text-sky-700 leading-loose font-light text-lg">
                Proudly celebrating Indian hospitality. Your premier partner for exclusive villa retreats.
              </p>
              <div className="flex space-x-4">
                {['instagram', 'facebook-f', 'linkedin-in'].map(social => (
                  <a key={social} href="#" className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all text-sky-400 group border border-sky-100 shadow-sm">
                    <i className={`fa-brands fa-${social} group-hover:scale-110 transition-transform`}></i>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-orange-600 font-black mb-8 uppercase text-[10px] tracking-[0.3em]">Quick Access</h4>
              <ul className="space-y-5 text-sm font-bold text-sky-700">
                <li><button onClick={() => onNavigate('villas')} className="hover:text-orange-500 transition-colors">Republic Collection</button></li>
                <li><button onClick={() => onNavigate('services')} className="hover:text-orange-500 transition-colors">Premium Concierge</button></li>
                <li><button onClick={() => onNavigate('testimonials')} className="hover:text-orange-500 transition-colors">Guest Memoirs</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-green-600 font-black mb-8 uppercase text-[10px] tracking-[0.3em]">Contact Hub</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-sky-400 tracking-widest">Global Support</p>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm font-bold text-sky-900 hover:text-orange-500 transition-colors">{CONTACT_EMAIL}</a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-sky-100 mt-24 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-sky-400">
              &copy; {new Date().getFullYear()} {BRAND_NAME} | Jai Hind
            </p>
            <div className="flex gap-4">
               <div className="w-8 h-2 bg-orange-500 rounded-full"></div>
               <div className="w-8 h-2 bg-white border border-gray-100 rounded-full"></div>
               <div className="w-8 h-2 bg-green-500 rounded-full"></div>
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
