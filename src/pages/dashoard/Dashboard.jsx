import React, { useEffect, useState } from 'react';
import { db } from '../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Sidebar from '../../components/sidebar/Sidebar';
import Student from '../student/Student';
import LogoutModal from '../../components/modals/logoutModal';
import Classes from '../Class/Class';
import Classroom from '../classroom/Classroom';
import './Dashboard.css';

const getGreeting = (hour, minute) => {
  // Convert hour and minute to a decimal for precise range checks
  const time = hour + minute / 60;
  if (time >= 0 && time < 1) return 'Good Midnight, Admin'; // 12:00am - 12:59am
  if (time >= 1.0167 && time < 6) return 'Early Morning, Admin'; // 1:01am - 5:59am
  if (time >= 6 && time < 12) return 'Good Morning, Admin'; // 6:00am - 11:59am
  if (time >= 12 && time < 13) return 'Good Noon, Admin'; // 12:00pm - 12:59pm
  if (time >= 13.0167 && time < 18) return 'Good Afternoon, Admin'; // 1:01pm - 5:59pm
  if (time >= 18 && time < 24) return 'Good Evening, Admin'; // 6:00pm - 11:59pm
  return 'Hello, Admin';
};

const Dashboard = ({ onNavigate, activePage }) => {
  const [counts, setCounts] = useState({ students: 0, classes: 0, classrooms: 0 });
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize based on screen size
    return window.innerWidth <= 800;
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      try {
        const studentsSnap = await getDocs(collection(db, 'students'));
        const classesSnap = await getDocs(collection(db, 'Class'));
        const classroomsSnap = await getDocs(collection(db, 'Classroom'));
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 800) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate sidebar width and margin based on state
  const getSidebarWidth = () => {
    if (window.innerWidth <= 800) {
      return sidebarCollapsed ? 0 : 60;
    }
    return sidebarCollapsed ? 60 : 220;
  };
  const sidebarWidth = getSidebarWidth();

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      <Sidebar 
        onNavigate={(page) => {
          if (page === 'logout') {
            setShowLogoutModal(true);
          } else {
            onNavigate(page);
          }
        }} 
        activePage={activePage} 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="student-page-container" style={{ flex: 1, position: 'relative' }}>
        {activePage === 'students' ? (
          <Student />
        ) : activePage === 'classes' ? (
          <Classes />
        ) : activePage === 'classrooms' ? (
          <Classroom />
        ) : (
          <>
            <div className="dashboard-header-row">
              <h2 className="dashboard-title"><span className="dashboard-highlight">Dashboard Overview</span></h2>
              <div className="dashboard-greeting-time">
                <span className="dashboard-greeting">{getGreeting(currentTime.getHours(), currentTime.getMinutes())}</span>
                <span className="dashboard-time">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Total Students</h3>
                <div className="stat-number">{loading ? '...' : counts.students}</div>
              </div>
              <div className="stat-card">
                <h3>Total Classes</h3>
                <div className="stat-number">{loading ? '...' : counts.classes}</div>
              </div>
              <div className="stat-card">
                <h3>Total Classrooms</h3>
                <div className="stat-number">{loading ? '...' : counts.classrooms}</div>
              </div>
            </div>
          </>
        )}
      </div>
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