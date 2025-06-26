import React, { useEffect, useState } from 'react';
import './viewStudentModals.css';
import { getShiftForGrade } from '../../../utils/schedule';
import { fetchStudentsByClassId } from '../../../utils/firebase';

function to12Hour(time) {
  if (!time) return '';
  if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) return time;
  const [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
}

const ViewClassroomModal = ({ open, onClose, data, classrooms = [] }) => {
  if (!open || !data) return null;

  // Find classroom info
  const classroom = classrooms.find(room => room.id === data.classroomId);
  const classroomDisplay = classroom ? `${classroom.buildingName} - ${classroom.roomNumber}` : data.classroomId;

  // Format schedule (reuse logic from Class.jsx)
  const formatSchedule = (schedule, grade) => {
    if (!Array.isArray(schedule) || schedule.length === 0) {
      const shift = getShiftForGrade(grade);
      return shift ? `No schedule set (${shift.displayName})` : 'No schedule set';
    }
    const shift = getShiftForGrade(grade);
    const shiftInfo = shift ? ` (${shift.displayName})` : '';
    const formattedSlots = schedule.map(slot => {
      const timeRange = `${slot.start} - ${slot.end}`;
      const subjectInfo = slot.subject ? ` - ${slot.subject}` : '';
      const teacherInfo = slot.teacher ? ` (${slot.teacher})` : '';
      return `${slot.day} ${timeRange}${subjectInfo}${teacherInfo}`;
    });
    return formattedSlots.join(', ') + shiftInfo;
  };

  return (
    <div className="student-modal-overlay view-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="view-modal-card minimalist" style={{ maxWidth: '900px', width: '98vw', padding: '2.5rem 2.5rem 2rem 2.5rem' }}>
        <button onClick={onClose} className="view-modal-close big" title="Close">×</button>
        <h3 className="view-modal-title minimalist" style={{ marginBottom: '1.5rem', fontSize: '1.5rem', textAlign: 'left', width: '100%' }}>View Class Details</h3>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit', fontSize: '1.08rem', background: 'white' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#222', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>Teacher ID</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#222', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>Teacher Name</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#222', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>Grade</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#222', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>Section</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#222', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>Classroom</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#222', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>Schedule</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#222', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>School Year</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#222', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>Quarter</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #e9ecef' }}>{data.teacherId || '-'}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #e9ecef' }}>{data.adviserName || '-'}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #e9ecef' }}>{data.classGrade || '-'}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #e9ecef' }}>{data.classSection || '-'}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #e9ecef' }}>{classroomDisplay}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #e9ecef' }}>{formatSchedule(data.schedule, data.classGrade)}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #e9ecef' }}>{data.schoolYear || '-'}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #e9ecef' }}>{data.quarter ? `Quarter ${data.quarter}` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewClassroomModal; 