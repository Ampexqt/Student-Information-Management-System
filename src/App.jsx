/**
 * Main Application Component - Student Information Management System
 * 
 * This is the root component that manages the overall application state,
 * authentication flow, and navigation between different pages.
 * 
 * Key Responsibilities:
 * - Manage authentication state and user sessions
 * - Handle login/logout functionality
 * - Control navigation between different pages
 * - Render appropriate components based on authentication status
 * - Manage loading states during authentication checks
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './features/login/Login';
import Dashboard from './features/dashboard/Dashboard';
import { sessionManager } from './utils/config';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';

function App() {
  // State management for application-wide data
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Tracks if user is logged in
  const [activePage, setActivePage] = useState('dashboard'); // Current active page/section
  const [isLoading, setIsLoading] = useState(true); // Loading state during auth checks
  const [userInfo, setUserInfo] = useState(null); // Stores authenticated user information

  /**
   * Effect hook to check for existing authentication on component mount
   * This runs once when the app starts to restore user session from localStorage
   */
  useEffect(() => {
    const checkAuthentication = () => {
      // Get stored session data from localStorage
      const session = sessionManager.getSession();
      if (session) {
        // If valid session exists, authenticate the user
        setIsAuthenticated(true);
        setUserInfo(session);
      }
      // Mark loading as complete regardless of authentication status
      setIsLoading(false);
    };

    checkAuthentication();
  }, []);

  /**
   * Effect hook to re-check session and handle session expiration
   * This ensures the app redirects to login if session is missing or expired
   */
  useEffect(() => {
    if (!sessionManager.getSession()) {
      // Clear authentication state if no valid session found
      setIsAuthenticated(false);
      setUserInfo(null);
    }
  }, []);

  /**
   * Handler for successful login
   * Called by the Login component when user successfully authenticates
   */
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setActivePage('dashboard'); // Redirect to dashboard after login
  };

  /**
   * Handler for sidebar navigation
   * Manages navigation between different pages and logout functionality
   * @param {string} page - The page to navigate to or 'logout' for logout action
   */
  const handleNavigate = (page) => {
    if (page === 'logout') {
      // Handle logout: clear all authentication state and session data
      setIsAuthenticated(false);
      setActivePage('dashboard');
      setUserInfo(null);
      sessionManager.clearSession();
    } else {
      // Navigate to the specified page
      setActivePage(page);
    }
  };

  // Show loading spinner while checking authentication status
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  // Render login page if user is not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render main dashboard with navigation for authenticated users
  // Currently only Dashboard is implemented, but this structure allows for easy expansion
  return (
    <Dashboard 
      onNavigate={handleNavigate} 
      activePage={activePage} 
      userInfo={userInfo} 
    />
  );
}

export default App;
