import React from 'react';
import './viewStudentModals.css';

function to12Hour(time) {
  if (!time) return '';
  if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) return time;
  const [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
}

const ViewClassModal = ({ open, onClose, classData, classroom }) => {
  if (!open || !classData) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="student-modal-overlay view-modal-overlay" onClick={handleOverlayClick}>
      <div className="view-modal-card minimalist">
        <button onClick={onClose} className="view-modal-close big" title="Close">×</button>
        <h3 className="view-modal-title minimalist">View Class</h3>
        <div className="view-modal-content minimalist" style={{alignItems: 'flex-start'}}>
          <div className="view-modal-info minimalist">
            <div><span className="view-label">Adviser Name</span>{classData.adviserName}</div>
            <div><span className="view-label">Grade</span>{classData.classGrade}</div>
            <div><span className="view-label">Section</span>{classData.classSection}</div>
            <div><span className="view-label">Classroom</span>{classroom ? `${classroom.buildingName} - ${classroom.roomNumber}` : classData.classroomId}</div>
            <div><span className="view-label">Schedule</span>{Array.isArray(classData.schedule) ? classData.schedule.map(s => `${s.day} ${to12Hour(s.start)} - ${to12Hour(s.end)}`).join(', ') : classData.schedule}</div>
            <div><span className="view-label">School Year</span>{classData.schoolYear}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewClassModal; 