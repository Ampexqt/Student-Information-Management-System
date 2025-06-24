import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './pages/loginPage/Login';
import Dashboard from './pages/dashoard/Dashboard';
import { sessionManager } from './utils/config';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuthentication = () => {
      const session = sessionManager.getSession();
      if (session) {
        setIsAuthenticated(true);
        setUserInfo(session);
      }
      setIsLoading(false);
    };

    checkAuthentication();
  }, []);

  // Handler for login success
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  // Handler for sidebar navigation
  const handleNavigate = (page) => {
    if (page === 'logout') {
      setIsAuthenticated(false);
      setActivePage('dashboard');
      setUserInfo(null);
      sessionManager.clearSession();
    } else {
      setActivePage(page);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Only Dashboard is implemented for now
  return (
    <Dashboard onNavigate={handleNavigate} activePage={activePage} userInfo={userInfo} />
  );
}

export default App;
