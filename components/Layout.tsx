
import React from 'react';
import { User, UserRole } from '../types';
import { BRAND_NAME, CONTACT_EMAIL } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate, currentPage }) => {
  const navLinks = [
    { label: 'Home', id: 'home' },
    { label: 'Villas', id: 'villas' },
    { label: 'Services', id: 'services' },
    { label: 'Testimonials', id: 'testimonials' },
    { label: 'About', id: 'about' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500 glass-panel shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div 
              className="flex items-center cursor-pointer group" 
              onClick={() => onNavigate('home')}
            >
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mr-3 group-hover:bg-amber-600 transition-colors duration-500">
                <i className="fa-solid fa-hotel text-white text-lg"></i>
              </div>
              <span className="text-xl font-black font-serif tracking-tight uppercase leading-none">
                Peak Stay <br/> <span className="text-[10px] font-sans tracking-[0.4em] text-slate-400">Destination</span>
              </span>
            </div>
            
            <div className="hidden lg:flex space-x-10 items-center">
              {navLinks.map((link) => (
                <button 
                  key={link.id}
                  onClick={() => onNavigate(link.id)} 
                  className={`relative text-[11px] font-black uppercase tracking-[0.2em] transition-all py-2 group ${currentPage === link.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-amber-500 transition-all duration-500 ${currentPage === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </button>
              ))}
              {user?.role === UserRole.ADMIN && (
                <button 
                  onClick={() => onNavigate('admin')} 
                  className={`text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg border-2 border-slate-900 transition-all ${currentPage === 'admin' ? 'bg-slate-900 text-white' : 'text-slate-900 hover:bg-slate-900 hover:text-white'}`}
                >
                  Admin Panel
                </button>
              )}
            </div>

            <div className="flex items-center space-x-6">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Signed in as</span>
                    <span className="text-xs font-black text-slate-900">{user.username}</span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                  >
                    <i className="fa-solid fa-power-off"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onNavigate('login')}
                  className="px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 rounded-2xl hover:bg-amber-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                >
                  Agent Portal
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow mt-20">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-300 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center mr-4">
                   <i className="fa-solid fa-hotel text-slate-900 text-xl"></i>
                </div>
                <span className="text-3xl font-bold font-serif text-white tracking-tight uppercase">{BRAND_NAME}</span>
              </div>
              <p className="max-w-md mb-10 text-slate-400 leading-loose font-light text-lg">
                We bridge the gap between imagination and luxury, offering hand-curated villa stays managed with obsessive attention to detail for the modern traveler.
              </p>
              <div className="flex space-x-4">
                {['instagram', 'facebook-f', 'linkedin-in', 'twitter'].map(social => (
                  <a key={social} href="#" className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center hover:bg-amber-500 transition-all text-white group">
                    <i className={`fa-brands fa-${social} group-hover:scale-110 transition-transform`}></i>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-black mb-8 uppercase text-[10px] tracking-[0.3em]">Explore Peak Stay</h4>
              <ul className="space-y-5 text-sm font-medium">
                <li><button onClick={() => onNavigate('villas')} className="hover:text-amber-500 transition-colors">Browse Catalog</button></li>
                <li><button onClick={() => onNavigate('services')} className="hover:text-amber-500 transition-colors">Experience Concierge</button></li>
                <li><button onClick={() => onNavigate('testimonials')} className="hover:text-amber-500 transition-colors">Guest Stories</button></li>
                <li><button onClick={() => onNavigate('about')} className="hover:text-amber-500 transition-colors">Our Philosophy</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black mb-8 uppercase text-[10px] tracking-[0.3em]">Stay Connected</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-500">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Email Enquiries</p>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm font-bold text-white hover:text-amber-500 transition-colors">{CONTACT_EMAIL}</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500">
                  <i className="fa-brands fa-whatsapp"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Instant Support</p>
                  <a href="https://wa.me/+919157928471" className="text-sm font-bold text-white hover:text-emerald-500 transition-colors">+91 91579 28471</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-24 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-600">
              &copy; {new Date().getFullYear()} Peak Stay Destination Luxury Resorts
            </p>
            <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest text-slate-600">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
