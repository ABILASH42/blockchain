import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandDetailPage from './components/LandDetailPage';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import MarketplacePreview from './components/MarketplacePreview';

function AppContent() {
  const { auth } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [landId, setLandId] = useState('');
  const [chatNavigation, setChatNavigation] = useState<{landId: string, sellerId: string, isFirstChat?: boolean, activeTab?: string} | null>(null);

  // Show loading spinner while authentication is being checked
  if (auth.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect unauthenticated users to the login route
  if (!auth.isAuthenticated || !auth.user) {
    return <Navigate to="/login" replace />;
  }

  // Handle navigation once authenticated
  const navigateToLandDetails = (id: string) => {
    setLandId(id);
    setCurrentPage('land-details');
  };

  const navigateToDashboard = (tab?: string, landId?: string, sellerId?: string) =>{
    setCurrentPage('dashboard');
    // If coming from land details with specific chat info
    if (tab && landId && sellerId) {
      setChatNavigation({ landId, sellerId, activeTab: tab });
    } else if (tab) {
      setChatNavigation({ landId: '', sellerId: '', activeTab: tab });
    } else {
      // When navigating back without a specific tab, default to marketplace
      setChatNavigation({ landId: '', sellerId: '', activeTab: 'marketplace' });
    }
  };

  const navigateToChat = (landId: string, sellerId: string, isFirstChat?: boolean) => {
    setChatNavigation({ landId, sellerId, isFirstChat });
    setCurrentPage('dashboard');
  };

  // Clear chat navigation after it's been used
  const clearChatNavigation = () => {
    setChatNavigation(null);
  };

  // Show different pages based on current page state
  if (currentPage === 'land-details') {
    return <LandDetailPage 
      landId={landId} 
      onBack={navigateToDashboard} 
      onNavigateToChat={navigateToChat}
    />;
  }

  // Show dashboard with navigation capability
  return <Dashboard 
    onNavigateToLand={navigateToLandDetails}
    initialTab={chatNavigation?.activeTab || undefined}
    chatNavigation={chatNavigation || undefined}
    onClearChatNavigation={clearChatNavigation}
  />;
}

const LoginRoute: React.FC = () => {
  const { auth } = useAuth();

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (auth.isAuthenticated && auth.user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell-inner app-shell">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/marketplace-preview" element={<MarketplacePreview />} />
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/dashboard" element={<AppContent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
