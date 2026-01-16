
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import VillaListingPage from './pages/VillaListingPage';
import VillaDetailPage from './pages/VillaDetailPage';
import AboutPage from './pages/AboutPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import ServicesPage from './pages/ServicesPage';
import TestimonialsPage from './pages/TestimonialsPage';
import LoginPage from './pages/LoginPage';
import OfferPopup from './components/OfferPopup';
import { User, UserRole, Villa, VillaFilters, AppTheme, SiteSettings } from './types';
import { subscribeToVillas, createVilla, updateVillaById, deleteVillaById } from './services/villaService';
import { subscribeToSettings, DEFAULT_SETTINGS } from './services/settingsService';
import { isSupabaseAvailable } from './services/supabase';
import { INITIAL_VILLAS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('peak_stay_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [villas, setVillas] = useState<Villa[]>(isSupabaseAvailable ? [] : INITIAL_VILLAS);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);
  
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedVillaId, setSelectedVillaId] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<VillaFilters | undefined>(undefined);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const unsubscribeVillas = subscribeToVillas((updatedVillas) => {
      setVillas(updatedVillas);
      setLoading(false);
    });

    const unsubscribeSettings = subscribeToSettings((newSettings) => {
      setSettings(newSettings);
      document.body.className = `theme-${newSettings.activeTheme}`;
      if (newSettings.primaryColor) {
        document.documentElement.style.setProperty('--t-primary', newSettings.primaryColor);
        document.documentElement.style.setProperty('--t-marquee-bg', newSettings.primaryColor);
      }
      
      // Handle offer popup display logic (show once per session if enabled)
      const hasSeenOffer = sessionStorage.getItem('peak_stay_offer_seen');
      if (newSettings.offerPopup.enabled && !hasSeenOffer && currentPage === 'home') {
        setTimeout(() => setShowOffer(true), 3000);
      }
    });

    const timer = setTimeout(() => setLoading(false), 2000);
    return () => {
      unsubscribeVillas();
      unsubscribeSettings();
      clearTimeout(timer);
    };
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    if (currentPage === page && page !== 'villa-detail') return;
    setIsTransitioning(true);
    setTimeout(() => {
      if (page !== 'villas') setCurrentFilters(undefined);
      setCurrentPage(page);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 200);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('peak_stay_current_user', JSON.stringify(loggedInUser));
    handleNavigate(loggedInUser.role === UserRole.ADMIN ? 'admin' : 'user-dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('peak_stay_current_user');
    handleNavigate('home');
  };

  const handleViewDetails = (id: string) => {
    setSelectedVillaId(id);
    handleNavigate('villa-detail');
  };

  const handleExplore = (filters?: VillaFilters) => {
    setCurrentFilters(filters);
    handleNavigate('villas');
  };

  const closeOffer = () => {
    setShowOffer(false);
    sessionStorage.setItem('peak_stay_offer_seen', 'true');
  };

  const renderPage = () => {
    if (currentPage === 'villa-detail' && selectedVillaId) {
      const villa = villas.find(v => v.id === selectedVillaId);
      if (villa) return <VillaDetailPage villa={villa} settings={settings} user={user} onBack={() => handleNavigate('villas')} />;
    }

    switch (currentPage) {
      case 'home': return <HomePage villas={villas} settings={settings} onExplore={handleExplore} onViewDetails={handleViewDetails} />;
      case 'villas': return <VillaListingPage villas={villas} settings={settings} onViewDetails={handleViewDetails} initialFilters={currentFilters} />;
      case 'about': return <AboutPage />;
      case 'services': return <ServicesPage />;
      case 'testimonials': return <TestimonialsPage />;
      case 'login': return <LoginPage onLogin={handleLoginSuccess} />;
      case 'user-dashboard':
        if (!user) return <LoginPage onLogin={handleLoginSuccess} />;
        return <UserDashboard user={user} villas={villas} settings={settings} onViewVilla={handleViewDetails} />;
      case 'admin':
        if (!user || user.role !== UserRole.ADMIN) return <LoginPage onLogin={handleLoginSuccess} />;
        return (
          <AdminDashboard 
            villas={villas} 
            settings={settings}
            onRefreshData={async () => {}} 
            onAddVilla={async (v) => {
              const { id, ...payload } = v;
              await createVilla(payload as Omit<Villa, 'id'>);
            }} 
            onUpdateVilla={async (v) => { 
              await updateVillaById(v.id, v); 
            }} 
            onDeleteVilla={async (id) => { 
              await deleteVillaById(id); 
            }} 
          />
        );
      default: return <HomePage villas={villas} settings={settings} onExplore={handleExplore} onViewDetails={handleViewDetails} />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-8 z-[9999]">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-slate-200 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-24 h-24 border-t-2 border-slate-900 rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <p className="text-slate-900 font-serif text-3xl mb-2">Peak Stay</p>
          <p className="text-slate-400 font-bold tracking-[0.4em] uppercase text-[10px] animate-pulse">Syncing Sanctuary...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user}
      settings={settings}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      currentPage={currentPage}
    >
      <div className={`transition-all duration-300 transform ${isTransitioning ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        {renderPage()}
      </div>
      
      {showOffer && (
        <OfferPopup 
          offer={settings.offerPopup} 
          onClose={closeOffer} 
          onNavigate={handleNavigate} 
        />
      )}
    </Layout>
  );
};

export default App;
