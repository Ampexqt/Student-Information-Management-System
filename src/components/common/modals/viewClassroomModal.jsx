import React, { useState } from 'react';
import './viewStudentModals.css';
import { FaFilter } from 'react-icons/fa';

const ViewClassroomModal = ({ open, onClose, data, students = [] }) => {
  if (!open || !data) return null;

  // Gender filter state
  const [morningGender, setMorningGender] = useState('all');
  const [afternoonGender, setAfternoonGender] = useState('all');
  const [showMorningFilter, setShowMorningFilter] = useState(false);
  const [showAfternoonFilter, setShowAfternoonFilter] = useState(false);

  // Filter students for this classroom and shift
  const getStudentsForShift = (shift, gender) =>
    students.filter(
      s => s.firestoreId === data.id && s.period === shift && (gender === 'all' || (s.gender || '').toLowerCase() === gender)
    );

  const morningStudents = getStudentsForShift('morning', morningGender);
  const afternoonStudents = getStudentsForShift('afternoon', afternoonGender);

  // Calculate available slots for each shift
  const morningMax = parseInt(data.morning?.maxStudents, 10) || 0;
  const morningAvailable = morningMax ? morningMax - morningStudents.length : '-';
  const afternoonMax = parseInt(data.afternoon?.maxStudents, 10) || 0;
  const afternoonAvailable = afternoonMax ? afternoonMax - afternoonStudents.length : '-';

  return (
    <div className="student-modal-overlay view-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="view-modal-card minimalist" style={{ maxWidth: '750px', width: '98vw', padding: '1.5rem 1rem 1.2rem 1rem', minWidth: 0 }}>
        <button onClick={onClose} className="view-modal-close big" title="Close">×</button>
        <h3 className="view-modal-title minimalist" style={{ marginBottom: '1.2rem', fontSize: '1.35rem', textAlign: 'left', width: '100%' }}>View Classroom Details</h3>
        <div style={{ fontSize: '1.08rem', color: '#222', marginBottom: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div><b>Building Name:</b> {data.buildingName || '-'}</div>
          <div><b>Floor:</b> {data.floor || '-'}</div>
          <div><b>Room Number:</b> {data.roomNumber || '-'}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', marginTop: 6, flexWrap: 'wrap' }}>
          {/* Morning Shift */}
          <div style={{ width: '48%', minWidth: 180, maxWidth: 350, boxSizing: 'border-box' }}>
            <div style={{ background:'#f7fcbf', color:'#222', fontWeight:'bold', borderRadius:4, padding:'2px 8px', display:'inline-block', marginBottom:8 }}>Morning</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {data.morning?.grade || '-'} <span style={{fontWeight:400}}>-</span> {data.morning?.section || '-'}
              <span style={{ background:'#d1fae5', color:'#065f46', fontWeight:'bold', borderRadius:4, padding:'2px 8px', marginLeft:8 }}>
                Slots: {morningAvailable}
              </span>
            </div>
            <div style={{ fontWeight: 500, marginBottom: 6, color: '#495057', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
              Students:
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4, color: '#6b7280', fontSize: '1.1em' }}
                onClick={() => setShowMorningFilter(v => !v)}
                title="Filter by gender"
                tabIndex={0}
              >
                <FaFilter />
              </button>
              {showMorningFilter && (
                <div style={{ position: 'absolute', top: 28, left: 70, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 10, minWidth: 90 }}>
                  <div style={{ padding: '6px 12px', cursor: 'pointer', color: morningGender === 'all' ? '#2563eb' : '#222', fontWeight: morningGender === 'all' ? 600 : 400 }} onClick={() => { setMorningGender('all'); setShowMorningFilter(false); }}>All</div>
                  <div style={{ padding: '6px 12px', cursor: 'pointer', color: morningGender === 'male' ? '#2563eb' : '#222', fontWeight: morningGender === 'male' ? 600 : 400 }} onClick={() => { setMorningGender('male'); setShowMorningFilter(false); }}>Male</div>
                  <div style={{ padding: '6px 12px', cursor: 'pointer', color: morningGender === 'female' ? '#2563eb' : '#222', fontWeight: morningGender === 'female' ? 600 : 400 }} onClick={() => { setMorningGender('female'); setShowMorningFilter(false); }}>Female</div>
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="student-table" style={{ fontSize: '0.98em', width: '100%', minWidth: 0, maxWidth: '100%' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {morningStudents.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: '#aaa' }}>No students</td></tr>
                  ) : morningStudents.map(s => (
                    <tr key={s.id}>
                      <td>{s.studentId}</td>
                      <td>{s.firstName} {s.lastName}</td>
                      <td>{s.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Afternoon Shift */}
          <div style={{ width: '48%', minWidth: 180, maxWidth: 350, boxSizing: 'border-box', borderLeft: '2px solid #e9ecef', paddingLeft: 12, marginTop: 0 }}>
            <div style={{ background:'#c7d2fe', color:'#1e40af', fontWeight:'bold', borderRadius:4, padding:'2px 8px', display:'inline-block', marginBottom:8 }}>Afternoon</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {data.afternoon?.grade || '-'} <span style={{fontWeight:400}}>-</span> {data.afternoon?.section || '-'}
              <span style={{ background:'#fee2e2', color:'#991b1b', fontWeight:'bold', borderRadius:4, padding:'2px 8px', marginLeft:8 }}>
                Slots: {afternoonAvailable}
              </span>
            </div>
            <div style={{ fontWeight: 500, marginBottom: 6, color: '#495057', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
              Students:
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4, color: '#6b7280', fontSize: '1.1em' }}
                onClick={() => setShowAfternoonFilter(v => !v)}
                title="Filter by gender"
                tabIndex={0}
              >
                <FaFilter />
              </button>
              {showAfternoonFilter && (
                <div style={{ position: 'absolute', top: 28, left: 70, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 10, minWidth: 90 }}>
                  <div style={{ padding: '6px 12px', cursor: 'pointer', color: afternoonGender === 'all' ? '#2563eb' : '#222', fontWeight: afternoonGender === 'all' ? 600 : 400 }} onClick={() => { setAfternoonGender('all'); setShowAfternoonFilter(false); }}>All</div>
                  <div style={{ padding: '6px 12px', cursor: 'pointer', color: afternoonGender === 'male' ? '#2563eb' : '#222', fontWeight: afternoonGender === 'male' ? 600 : 400 }} onClick={() => { setAfternoonGender('male'); setShowAfternoonFilter(false); }}>Male</div>
                  <div style={{ padding: '6px 12px', cursor: 'pointer', color: afternoonGender === 'female' ? '#2563eb' : '#222', fontWeight: afternoonGender === 'female' ? 600 : 400 }} onClick={() => { setAfternoonGender('female'); setShowAfternoonFilter(false); }}>Female</div>
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="student-table" style={{ fontSize: '0.98em', width: '100%', minWidth: 0, maxWidth: '100%' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {afternoonStudents.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: '#aaa' }}>No students</td></tr>
                  ) : afternoonStudents.map(s => (
                    <tr key={s.id}>
                      <td>{s.studentId}</td>
                      <td>{s.firstName} {s.lastName}</td>
                      <td>{s.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 900px) {
            .view-modal-card {
              max-width: 99vw !important;
            }
          }
          @media (max-width: 700px) {
            .view-modal-card {
              max-width: 99vw !important;
              padding: 1rem 2vw !important;
            }
            .view-modal-title {
              font-size: 1.1rem !important;
            }
          }
          @media (max-width: 600px) {
            .view-modal-card {
              flex-direction: column !important;
              padding: 0.7rem 1vw !important;
            }
            .view-modal-title {
              font-size: 1rem !important;
            }
            .view-modal-card > div[style*='display: flex'] {
              flex-direction: column !important;
              gap: 8px !important;
            }
            .view-modal-card > div[style*='display: flex'] > div {
              width: 100% !important;
              max-width: 100% !important;
              border-left: none !important;
              padding-left: 0 !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ViewClassroomModal; 