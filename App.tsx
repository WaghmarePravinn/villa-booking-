
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import VillaListingPage from './pages/VillaListingPage';
import VillaDetailPage from './pages/VillaDetailPage';
import AboutPage from './pages/AboutPage';
import AdminDashboard from './pages/AdminDashboard';
import ServicesPage from './pages/ServicesPage';
import TestimonialsPage from './pages/TestimonialsPage';
import LoginPage from './pages/LoginPage';
import { User, UserRole, Villa, VillaFilters } from './types';
import { subscribeToVillas, createVilla, updateVillaById, deleteVillaById } from './services/villaService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('peak_stay_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedVillaId, setSelectedVillaId] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<VillaFilters | undefined>(undefined);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // REAL-TIME SYNC: Subscribe to the villas collection
    const unsubscribe = subscribeToVillas((updatedVillas) => {
      setVillas(updatedVillas);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleNavigate = (page: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (page !== 'villas') setCurrentFilters(undefined);
      setCurrentPage(page);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 300);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('peak_stay_current_user', JSON.stringify(loggedInUser));
    if (loggedInUser.role === UserRole.ADMIN) {
      handleNavigate('admin');
    } else {
      handleNavigate('home');
    }
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

  const renderPage = () => {
    if (currentPage === 'villa-detail' && selectedVillaId) {
      const villa = villas.find(v => v.id === selectedVillaId);
      if (villa) return <VillaDetailPage villa={villa} onBack={() => handleNavigate('villas')} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage villas={villas} onExplore={handleExplore} onViewDetails={handleViewDetails} />;
      case 'villas':
        return <VillaListingPage villas={villas} onViewDetails={handleViewDetails} initialFilters={currentFilters} />;
      case 'about':
        return <AboutPage />;
      case 'services':
        return <ServicesPage />;
      case 'testimonials':
        return <TestimonialsPage />;
      case 'login':
        return <LoginPage onLogin={handleLoginSuccess} />;
      case 'admin':
        if (!user || user.role !== UserRole.ADMIN) {
          return <LoginPage onLogin={handleLoginSuccess} />;
        }
        return (
          <AdminDashboard 
            villas={villas} 
            onRefreshData={async () => { /* Logic handled by subscriber */ }}
            onAddVilla={async (v) => {
              const { id: _, ...payload } = v;
              await createVilla(payload);
            }} 
            onUpdateVilla={async (v) => {
              await updateVillaById(v.id, v);
            }} 
            onDeleteVilla={async (id) => {
              if (window.confirm("Delete permanently from cloud?")) {
                await deleteVillaById(id);
              }
            }} 
          />
        );
      default:
        return <HomePage villas={villas} onExplore={handleExplore} onViewDetails={handleViewDetails} />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center space-y-8 z-[9999]">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-amber-500/20 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-24 h-24 border-t-2 border-amber-500 rounded-full animate-spin"></div>
          <i className="fa-solid fa-hotel text-4xl text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></i>
        </div>
        <div className="text-center">
          <p className="text-white font-serif text-2xl mb-2">Peak Stay Destination</p>
          <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-[10px] animate-pulse">Syncing with Cloud Nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      currentPage={currentPage}
    >
      <div className={`transition-all duration-300 transform ${isTransitioning ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
        {renderPage()}
      </div>
    </Layout>
  );
};

export default App;
