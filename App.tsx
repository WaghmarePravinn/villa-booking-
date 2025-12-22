
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import VillaListingPage from './pages/VillaListingPage';
import VillaDetailPage from './pages/VillaDetailPage';
import AboutPage from './pages/AboutPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import ServicesPage from './pages/ServicesPage';
import TestimonialsPage from './pages/TestimonialsPage';
import { User, UserRole, Villa, VillaFilters } from './types';
import { getVillas, createVilla, updateVillaById, deleteVillaById, seedDatabase } from './services/villaService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedVillaId, setSelectedVillaId] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<VillaFilters | undefined>(undefined);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    fetchVillas();
  }, []);

  const fetchVillas = async () => {
    setLoading(true);
    const data = await getVillas();
    setVillas(data);
    setLoading(false);
  };

  const handleNavigate = (page: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (page !== 'villas') setCurrentFilters(undefined);
      setCurrentPage(page);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 300);
  };

  const handleLogin = (username: string, role: UserRole) => {
    setUser({ id: Date.now().toString(), username, role });
    handleNavigate('home');
  };

  const handleLogout = () => {
    setUser(null);
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
      case 'admin':
        return user?.role === UserRole.ADMIN ? (
          <AdminDashboard 
            villas={villas} 
            onRefreshData={fetchVillas}
            onAddVilla={async (v) => {
              const { id: _, ...payload } = v;
              const newId = await createVilla(payload);
              setVillas(prev => [...prev, { ...v, id: newId }]);
            }} onUpdateVilla={async (v) => {
              await updateVillaById(v.id, v);
              setVillas(villas.map(item => item.id === v.id ? v : item));
            }} onDeleteVilla={async (id) => {
              if (window.confirm("Delete permanently?")) {
                await deleteVillaById(id);
                setVillas(villas.filter(v => v.id !== id));
              }
            }} 
          />
        ) : <LoginPage onLogin={handleLogin} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
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
          <p className="text-white font-serif text-2xl mb-2 animate-reveal">Peak Stay Destination</p>
          <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-[10px] animate-pulse">Syncing Cloud Luxury...</p>
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
