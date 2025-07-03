/**
 * Sidebar Component - Navigation Menu
 * 
 * This component provides the main navigation interface for the application.
 * It displays a collapsible sidebar with navigation links to different sections
 * of the Student Information Management System.
 * 
 * Key Features:
 * - Collapsible sidebar with smooth animations
 * - Responsive design for mobile and desktop
 * - Icon-based navigation with tooltips
 * - Active page highlighting
 * - Hamburger menu for mobile devices
 * - Smooth transitions between collapsed and expanded states
 * 
 * Navigation Items:
 * - Dashboard: Main overview page
 * - Students: Student management section
 * - Classes: Class management section
 * - Classrooms: Classroom management section
 * - Logout: User logout functionality
 * 
 * Responsive Behavior:
 * - Desktop: Collapsible sidebar (60px collapsed, 220px expanded)
 * - Mobile: Overlay sidebar with backdrop
 * - Auto-collapse on navigation for mobile devices
 */

import React, { useEffect, useRef, useState } from 'react';
import { FaTachometerAlt, FaUserGraduate, FaChalkboardTeacher, FaDoorOpen, FaSignOutAlt } from 'react-icons/fa';
import './Sidebar.css';

/**
 * Sidebar navigation component
 * @param {Function} onNavigate - Callback function for navigation
 * @param {string} activePage - Currently active page
 * @param {boolean} collapsed - Whether sidebar is collapsed
 * @param {Function} setCollapsed - Function to toggle collapsed state
 * @param {boolean} sidebarOpen - Whether mobile sidebar is open
 * @param {Function} onToggle - Function to handle sidebar toggle
 */
const Sidebar = ({ onNavigate, activePage, collapsed = false, setCollapsed, sidebarOpen = false, onToggle }) => {
  // State for hamburger menu icon visibility
  const [showHamburger, setShowHamburger] = useState(collapsed);
  
  // Ref for managing collapse timeout
  const collapseTimeout = useRef();

  /**
   * Effect hook to manage hamburger icon visibility during transitions
   * Delays showing hamburger icon until collapse animation completes
   */
  useEffect(() => {
    if (collapsed) {
      // If collapsing, delay hamburger icon appearance
      collapseTimeout.current = setTimeout(() => {
        setShowHamburger(true);
      }, 600); // Match CSS transition duration
    } else {
      // If expanding, show X icon immediately
      setShowHamburger(false);
      if (collapseTimeout.current) clearTimeout(collapseTimeout.current);
    }
    
    // Cleanup timeout on unmount or dependency change
    return () => {
      if (collapseTimeout.current) clearTimeout(collapseTimeout.current);
    };
  }, [collapsed]);

  /**
   * Handles sidebar toggle functionality
   * Uses provided onToggle function or falls back to setCollapsed
   */
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setCollapsed(prev => !prev);
    }
  };

  /**
   * Handles navigation to different pages
   * Automatically collapses sidebar on mobile after navigation
   * @param {string} page - Page to navigate to
   */
  const handleNavigation = (page) => {
    // On mobile, collapse sidebar after navigation for better UX
    if (window.innerWidth <= 800) {
      setCollapsed(true);
    }
    onNavigate(page);
  };

  /**
   * Determines CSS classes for sidebar based on current state
   * @returns {string} - Space-separated CSS class names
   */
  const getSidebarClasses = () => {
    let classes = 'sidebar';
    if (collapsed) classes += ' sidebar-collapsed';
    if (window.innerWidth <= 800 && sidebarOpen) classes += ' sidebar-open';
    return classes;
  };

  return (
    <div className={getSidebarClasses()}>
      {/* Sidebar Toggle Button */}
      <button 
        className="sidebar-toggle-btn"
        onClick={handleToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {/* Close icon (X) - visible when expanded */}
        <span className={`toggle-icon toggle-close${collapsed ? '' : ' visible'}`}>×</span>
        
        {/* Hamburger icon (☰) - visible when collapsed */}
        <span className={`toggle-icon toggle-hamburger${showHamburger ? ' visible' : ''}`}>&#9776;</span>
      </button>
      
      {/* Sidebar Title */}
      <div className="sidebar-title">
        {!collapsed && 'Admin Panel'}
      </div>
      
      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {/* Dashboard Navigation Item */}
        <button 
          className={activePage === 'dashboard' ? 'active' : ''} 
          onClick={() => handleNavigation('dashboard')}
          title="Dashboard"
        >
          <FaTachometerAlt className="sidebar-icon" />
          {!collapsed && <span>Dashboard</span>}
        </button>
        
        {/* Students Navigation Item */}
        <button 
          className={activePage === 'students' ? 'active' : ''} 
          onClick={() => handleNavigation('students')}
          title="Students"
        >
          <FaUserGraduate className="sidebar-icon" />
          {!collapsed && <span>Students</span>}
        </button>
        
        {/* Classes Navigation Item */}
        <button 
          className={activePage === 'classes' ? 'active' : ''} 
          onClick={() => handleNavigation('classes')}
          title="Classes"
        >
          <FaChalkboardTeacher className="sidebar-icon" />
          {!collapsed && <span>Classes</span>}
        </button>
        
        {/* Classrooms Navigation Item */}
        <button 
          className={activePage === 'classrooms' ? 'active' : ''} 
          onClick={() => handleNavigation('classrooms')}
          title="Classrooms"
        >
          <FaDoorOpen className="sidebar-icon" />
          {!collapsed && <span>Classrooms</span>}
        </button>
        
        {/* Logout Navigation Item */}
        <button 
          className={`logout${activePage === 'logout' ? ' active' : ''}`} 
          onClick={() => handleNavigation('logout')}
          title="Logout"
        >
          <FaSignOutAlt className="sidebar-icon" />
          {!collapsed && <span>Logout</span>}
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;