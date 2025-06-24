import React, { useEffect, useRef, useState } from 'react';
import { FaTachometerAlt, FaUserGraduate, FaChalkboardTeacher, FaDoorOpen, FaSignOutAlt } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ onNavigate, activePage, collapsed = false, setCollapsed }) => {
  const [showHamburger, setShowHamburger] = useState(collapsed);
  const collapseTimeout = useRef();

  useEffect(() => {
    // If collapsing, delay hamburger icon
    if (collapsed) {
      collapseTimeout.current = setTimeout(() => {
        setShowHamburger(true);
      }, 600); // match CSS transition duration
    } else {
      // If expanding, show X immediately
      setShowHamburger(false);
      if (collapseTimeout.current) clearTimeout(collapseTimeout.current);
    }
    return () => {
      if (collapseTimeout.current) clearTimeout(collapseTimeout.current);
    };
  }, [collapsed]);

  const handleToggle = () => {
    setCollapsed(prev => !prev);
  };

  const handleNavigation = (page) => {
    // On mobile, collapse sidebar after navigation
    if (window.innerWidth <= 800) {
      setCollapsed(true);
    }
    onNavigate(page);
  };

  return (
    <div className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <button 
        className="sidebar-toggle-btn"
        onClick={handleToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className={`toggle-icon toggle-close${collapsed ? '' : ' visible'}`}>×</span>
        <span className={`toggle-icon toggle-hamburger${showHamburger ? ' visible' : ''}`}>&#9776;</span>
      </button>
      <div className="sidebar-title">
        {!collapsed && 'Admin Panel'}
      </div>
      <nav className="sidebar-nav">
        <button 
          className={activePage === 'dashboard' ? 'active' : ''} 
          onClick={() => handleNavigation('dashboard')}
          title="Dashboard"
        >
          <FaTachometerAlt className="sidebar-icon" />
          {!collapsed && <span>Dashboard</span>}
        </button>
        <button 
          className={activePage === 'students' ? 'active' : ''} 
          onClick={() => handleNavigation('students')}
          title="Students"
        >
          <FaUserGraduate className="sidebar-icon" />
          {!collapsed && <span>Students</span>}
        </button>
        <button 
          className={activePage === 'classes' ? 'active' : ''} 
          onClick={() => handleNavigation('classes')}
          title="Classes"
        >
          <FaChalkboardTeacher className="sidebar-icon" />
          {!collapsed && <span>Classes</span>}
        </button>
        <button 
          className={activePage === 'classrooms' ? 'active' : ''} 
          onClick={() => handleNavigation('classrooms')}
          title="Classrooms"
        >
          <FaDoorOpen className="sidebar-icon" />
          {!collapsed && <span>Classrooms</span>}
        </button>
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