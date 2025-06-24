import React from 'react';
import './viewStudentModals.css';

const getClassDisplay = (classId, classes) => {
  if (!classId || !classes) return '';
  const cls = classes.find(c => c.id === classId);
  if (!cls) return classId;
  return `${cls.classGrade || ''}${cls.classSection ? ' - ' + cls.classSection : ''}`;
};

const ViewStudentModal = ({ open, onClose, student, classes }) => {
  if (!open || !student) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="student-modal-overlay view-modal-overlay" onClick={handleOverlayClick}>
      <div className="view-modal-card minimalist">
        <button onClick={onClose} className="view-modal-close big" title="Close">×</button>
        <h3 className="view-modal-title minimalist">View Student</h3>
        <div className="view-modal-content minimalist">
          <div className="view-modal-avatar minimalist">
            {student.profileImage ? (
              <img src={student.profileImage} alt="Profile" />
            ) : student.gender === 'Female' ? (
              // Simple female SVG avatar
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="#F9D5E5"/>
                <ellipse cx="24" cy="20" rx="10" ry="10" fill="#F7CAC9"/>
                <ellipse cx="24" cy="36" rx="13" ry="8" fill="#F7CAC9"/>
                <ellipse cx="24" cy="22" rx="6" ry="7" fill="#fff"/>
                <ellipse cx="24" cy="24" rx="3" ry="4" fill="#F7CAC9"/>
                <ellipse cx="18" cy="18" rx="2" ry="3" fill="#fff"/>
                <ellipse cx="30" cy="18" rx="2" ry="3" fill="#fff"/>
                <ellipse cx="24" cy="28" rx="2" ry="1" fill="#E57373"/>
              </svg>
            ) : (
              // Simple male SVG avatar
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="#B3C6E7"/>
                <ellipse cx="24" cy="20" rx="10" ry="10" fill="#A2B9BC"/>
                <ellipse cx="24" cy="36" rx="13" ry="8" fill="#A2B9BC"/>
                <ellipse cx="24" cy="22" rx="6" ry="7" fill="#fff"/>
                <ellipse cx="24" cy="24" rx="3" ry="4" fill="#A2B9BC"/>
                <ellipse cx="18" cy="18" rx="2" ry="3" fill="#fff"/>
                <ellipse cx="30" cy="18" rx="2" ry="3" fill="#fff"/>
                <ellipse cx="24" cy="28" rx="2" ry="1" fill="#1976D2"/>
              </svg>
            )}
          </div>
          <div className="view-modal-info minimalist">
            <div><span className="view-label">Student ID</span>{student.studentId || '-'}</div>
            <div><span className="view-label">First Name</span>{student.firstName}</div>
            <div><span className="view-label">Last Name</span>{student.lastName}</div>
            <div><span className="view-label">Email</span>{student.email}</div>
            <div><span className="view-label">Contact</span>{student.contactNumber}</div>
            <div><span className="view-label">Address</span>{student.address}</div>
            <div><span className="view-label">Birthdate</span>{student.birthdate}</div>
            <div><span className="view-label">Gender</span>{student.gender}</div>
            <div><span className="view-label">Class</span>{getClassDisplay(student.classId, classes)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStudentModal;
