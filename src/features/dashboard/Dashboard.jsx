/**
 * Dashboard Component - Main Application Interface
 * 
 * This is the main dashboard component that serves as the central hub
 * for the Student Information Management System after user authentication.
 * 
 * Key Features:
 * - Responsive sidebar navigation with mobile support
 * - Real-time greeting based on current time
 * - Live clock display
 * - Statistics overview (students, classes, classrooms count)
 * - Dynamic page content rendering based on active page
 * - Logout confirmation modal
 * - Mobile-responsive design with overlay support
 * 
 * Component Structure:
 * - Sidebar: Navigation menu with collapsible functionality
 * - Header: Greeting and live clock
 * - Content Area: Dynamic content based on selected page
 * - Logout Modal: Confirmation dialog for logout action
 * 
 * Responsive Behavior:
 * - Desktop: Collapsible sidebar (60px collapsed, 220px expanded)
 * - Mobile: Overlay sidebar with backdrop
 * - Auto-collapse on small screens
 */

import React, { useEffect, useState } from 'react';
import { db } from '../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Sidebar from '../../components/common/sidebar/Sidebar';
import Student from '../student/Student';
import LogoutModal from '../../components/common/modals/logoutModal.jsx';
import Classes from '../Class/Class';
import Classroom from '../classroom/Classroom';
import './Dashboard.css';

/**
 * Generates a contextual greeting based on the current time
 * 
 * This function provides different greetings throughout the day:
 * - Midnight (12:00 AM - 12:59 AM): "Good Midnight, Admin"
 * - Early Morning (1:01 AM - 5:59 AM): "Early Morning, Admin"
 * - Morning (6:00 AM - 11:59 AM): "Good Morning, Admin"
 * - Noon (12:00 PM - 12:59 PM): "Good Noon, Admin"
 * - Afternoon (1:01 PM - 5:59 PM): "Good Afternoon, Admin"
 * - Evening (6:00 PM - 11:59 PM): "Good Evening, Admin"
 * 
 * @param {number} hour - Current hour (0-23)
 * @param {number} minute - Current minute (0-59)
 * @returns {string} - Contextual greeting message
 */
const getGreeting = (hour, minute) => {
  // Convert hour and minute to a decimal for precise range checks
  const time = hour + minute / 60;
  
  if (time >= 0 && time < 1) return 'Good Midnight, Admin'; // 12:00am - 12:59am
  if (time >= 1.0167 && time < 6) return 'Early Morning, Admin'; // 1:01am - 5:59am
  if (time >= 6 && time < 12) return 'Good Morning, Admin'; // 6:00am - 11:59am
  if (time >= 12 && time < 13) return 'Good Noon, Admin'; // 12:00pm - 12:59pm
  if (time >= 13.0167 && time < 18) return 'Good Afternoon, Admin'; // 1:01pm - 5:59pm
  if (time >= 18 && time < 24) return 'Good Evening, Admin'; // 6:00pm - 11:59pm
  
  return 'Hello, Admin'; // Fallback greeting
};

/**
 * Main Dashboard component
 * @param {Function} onNavigate - Callback function for navigation
 * @param {string} activePage - Currently active page/section
 */
const Dashboard = ({ onNavigate, activePage }) => {
  // State management for dashboard functionality
  const [counts, setCounts] = useState({ students: 0, classes: 0, classrooms: 0 }); // Statistics counts
  const [loading, setLoading] = useState(true); // Loading state for data fetching
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize sidebar state based on screen size
    return window.innerWidth <= 800;
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Logout modal visibility
  const [currentTime, setCurrentTime] = useState(new Date()); // Current time for greeting and clock
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar open state

  /**
   * Effect hook to fetch statistics from Firebase
   * Fetches counts of students, classes, and classrooms
   */
  useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      try {
        // Fetch documents from all three collections
        const studentsSnap = await getDocs(collection(db, 'students'));
        const classesSnap = await getDocs(collection(db, 'Class'));
        const classroomsSnap = await getDocs(collection(db, 'Classroom'));
        
        // Update counts state with document sizes
        setCounts({
          students: studentsSnap.size,
          classes: classesSnap.size,
          classrooms: classroomsSnap.size,
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  /**
   * Effect hook to update current time every second
   * Creates a live clock and updates greeting based on time
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Cleanup timer on component unmount
    return () => clearInterval(timer);
  }, []);

  /**
   * Effect hook to handle responsive behavior
   * Adjusts sidebar state based on window resize events
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 800) {
        // Mobile view: collapse sidebar and close mobile overlay
        setSidebarCollapsed(true);
        setSidebarOpen(false);
      } else {
        // Desktop view: close mobile overlay
        setSidebarOpen(false);
      }
    };

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Calculates the appropriate sidebar width based on current state and screen size
   * @returns {number} - Sidebar width in pixels
   */
  const getSidebarWidth = () => {
    if (window.innerWidth <= 800) {
      // Mobile: 0 when collapsed, 60 when open
      return sidebarCollapsed ? 0 : 60;
    }
    // Desktop: 60 when collapsed, 220 when expanded
    return sidebarCollapsed ? 60 : 220;
  };
  const sidebarWidth = getSidebarWidth();

  /**
   * Handles sidebar toggle functionality
   * Different behavior for mobile vs desktop
   */
  const handleSidebarToggle = () => {
    if (window.innerWidth <= 800) {
      // Mobile: toggle overlay sidebar
      setSidebarOpen(!sidebarOpen);
    } else {
      // Desktop: toggle collapsed state
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  /**
   * Handles click on mobile overlay backdrop
   * Closes the mobile sidebar when backdrop is clicked
   */
  const handleMobileOverlayClick = () => {
    setSidebarOpen(false);
  };

  /**
   * Handles navigation between different pages
   * Shows logout modal for logout action, otherwise navigates directly
   * @param {string} page - Page to navigate to or 'logout'
   */
  const handleNavigation = (page) => {
    if (page === 'logout') {
      // Show logout confirmation modal
      setShowLogoutModal(true);
    } else {
      // Navigate to the specified page
      onNavigate(page);
      // Close sidebar on mobile after navigation
      if (window.innerWidth <= 800) {
        setSidebarOpen(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      {/* Mobile Overlay - Backdrop for mobile sidebar */}
      {window.innerWidth <= 800 && sidebarOpen && (
        <div 
          className="sidebar-mobile-overlay active"
          onClick={handleMobileOverlayClick}
        />
      )}
      
      {/* Sidebar Navigation Component */}
      <Sidebar 
        onNavigate={handleNavigation}
        activePage={activePage} 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        sidebarOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />
      
      {/* Main Content Area */}
      <div className="student-page-container" style={{ flex: 1, position: 'relative' }}>
        {/* Global Header with Greeting and Timer */}
        <div className="global-header">
          <div className="global-greeting-time">
            <span className="global-greeting">
              {getGreeting(currentTime.getHours(), currentTime.getMinutes())}
            </span>
            <span className="global-time">
              {currentTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}
            </span>
          </div>
        </div>

        {/* Dynamic Page Content Based on Active Page */}
        {activePage === 'students' ? (
          <Student />
        ) : activePage === 'classes' ? (
          <Classes />
        ) : activePage === 'classrooms' ? (
          <Classroom />
        ) : (
          // Default Dashboard Overview
          <>
            <div className="dashboard-header-row">
              <h2 className="dashboard-title">
                <span className="dashboard-highlight">Dashboard Overview</span>
              </h2>
            </div>
            
            {/* Statistics Cards */}
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Total Students</h3>
                <div className="stat-number">
                  {loading ? '...' : counts.students}
                </div>
              </div>
              <div className="stat-card">
                <h3>Total Classes</h3>
                <div className="stat-number">
                  {loading ? '...' : counts.classes}
                </div>
              </div>
              <div className="stat-card">
                <h3>Total Classrooms</h3>
                <div className="stat-number">
                  {loading ? '...' : counts.classrooms}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Logout Confirmation Modal */}
      <LogoutModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onLogout={() => {
          setShowLogoutModal(false);
          onNavigate('logout');
        }}
      />
    </div>
  );
};

export default Dashboard;