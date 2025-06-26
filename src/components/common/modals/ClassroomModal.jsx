import React, { useState, useEffect } from 'react';
// import '../../features/login/login.css';
import Toast from "../toast/Toast";

const initialForm = {
  buildingName: '',
  floor: '',
  roomNumber: '',
  morning: { grade: '', section: '', maxStudents: '' },
  afternoon: { grade: '', section: '', maxStudents: '' },
};

const buildingOptions = [
  'Main Building',
  'Annex',
  'West Wing',
  'East Wing',
  'Science Center',
];
const roomOptions = [
  'Room 101',
  'Room 102',
  'Room 103',
  'Room 104',
  'Room 105',
];
const floorOptions = [
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
];

const morningGradeOptions = ['Grade 7', 'Grade 8'];
const afternoonGradeOptions = ['Grade 9', 'Grade 10'];
const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F'];

const ClassroomModal = ({ open, onClose, onSubmit, initialData, loading, mode, classrooms = [] }) => {
  const [form, setForm] = useState(initialForm);
  const [errorMsg, setErrorMsg] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialForm,
        ...initialData,
        morning: initialData.morning || { grade: '', section: '', maxStudents: '' },
        afternoon: initialData.afternoon || { grade: '', section: '', maxStudents: '' },
      });
    } else {
      setForm(initialForm);
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    if (name.startsWith('morning-')) {
      const field = name.replace('morning-', '');
      setForm(f => ({ ...f, morning: { ...f.morning, [field]: value } }));
    } else if (name.startsWith('afternoon-')) {
      const field = name.replace('afternoon-', '');
      setForm(f => ({ ...f, afternoon: { ...f.afternoon, [field]: value } }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleToastClose = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message, type = 'error') => {
    setToasts((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), message, type },
    ]);
  };

  const handleSubmit = e => {
    e.preventDefault();
    setErrorMsg('');
    // Duplicate check for building+floor+room
    const duplicate = classrooms.find(c =>
      c.buildingName.trim().toLowerCase() === form.buildingName.trim().toLowerCase() &&
      c.floor.trim().toLowerCase() === form.floor.trim().toLowerCase() &&
      c.roomNumber.trim().toLowerCase() === form.roomNumber.trim().toLowerCase() &&
      (mode !== 'edit' || c.id !== (initialData && initialData.id))
    );
    if (duplicate) {
      setErrorMsg('A classroom with this building, floor, and room number already exists.');
      return;
    }
    // Duplicate grade-section in any building (across all rooms)
    const checkDup = (shift) => {
      return classrooms.some(c =>
        (mode !== 'edit' || c.id !== (initialData && initialData.id)) &&
        ((c.morning && c.morning.grade === form[shift].grade && c.morning.section === form[shift].section) ||
         (c.afternoon && c.afternoon.grade === form[shift].grade && c.afternoon.section === form[shift].section))
      );
    };
    if (checkDup('morning')) {
      showToast(`Grade ${form.morning.grade} - Section ${form.morning.section} already exists in this building!`, 'error');
      return;
    }
    if (checkDup('afternoon')) {
      showToast(`Grade ${form.afternoon.grade} - Section ${form.afternoon.section} already exists in this building!`, 'error');
      return;
    }
    // Validation for both shifts
    const { morning, afternoon } = form;
    if (!morning.grade || !morning.section || !morning.maxStudents ||
        !afternoon.grade || !afternoon.section || !afternoon.maxStudents) {
      setErrorMsg('All fields for both shifts are required.');
      return;
    }
    if (isNaN(morning.maxStudents) || morning.maxStudents <= 0 ||
        isNaN(afternoon.maxStudents) || afternoon.maxStudents <= 0) {
      setErrorMsg('Max students must be a positive number for both shifts.');
      return;
    }
    onSubmit({ ...form });
  };

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="student-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-card" style={{ minWidth: 400, maxWidth: '90vw', width: 'auto', position: 'relative', padding: '2.5rem 2rem 2rem 2rem' }}>
        <h3 className="login-title" style={{ marginBottom: 20 }}>{mode === 'edit' ? 'Edit Classroom' : 'Add Classroom'}</h3>
        <Toast toasts={toasts} onClose={handleToastClose} modal />
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
          {/* Only show errorMsg inline in the modal, not outside or as a global bar */}
          {errorMsg && (
            <div style={{ color: '#fff', background: '#ff4d4f', marginBottom: 12, borderRadius: 8, padding: '12px 16px', fontWeight: 'bold', fontSize: '1rem', textAlign: 'center', width: '100%' }}>
              {errorMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
            <div className="login-input-group" style={{ flex: '1 1 180px', minWidth: 180 }}>
              <select name="buildingName" value={form.buildingName} onChange={handleChange} required className="login-input" style={{ background: 'transparent', border: 'none', width: '100%' }}>
                <option value="" disabled>Building Name</option>
                {buildingOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
              <select name="floor" value={form.floor} onChange={handleChange} required className="login-input" style={{ background: 'transparent', border: 'none', width: '100%' }}>
                <option value="" disabled>Floor</option>
                {floorOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
              <select name="roomNumber" value={form.roomNumber} onChange={handleChange} required className="login-input" style={{ background: 'transparent', border: 'none', width: '100%' }}>
                <option value="" disabled>Room Number</option>
                {roomOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Morning Shift Section */}
          <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 8 }}>
            <h4 style={{ margin: 0, marginBottom: 12 }}>Morning Shift</h4>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
                <select
                  name="morning-grade"
                  value={form.morning.grade}
                  onChange={handleChange}
                  required
                  className="login-input"
                  style={{ background: 'transparent', border: 'none', width: '100%' }}
                >
                  <option value="" disabled>Grade (required)</option>
                  {morningGradeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
                <select
                  name="morning-section"
                  value={form.morning.section}
                  onChange={handleChange}
                  required
                  className="login-input"
                  style={{ background: 'transparent', border: 'none', width: '100%' }}
                >
                  <option value="" disabled>Section (required)</option>
                  {sectionOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
                <input
                  type="number"
                  name="morning-maxStudents"
                  value={form.morning.maxStudents}
                  onChange={handleChange}
                  required
                  min={1}
                  placeholder="Max Students"
                  className="login-input"
                  style={{ background: 'transparent', border: 'none', width: '100%' }}
                />
              </div>
            </div>
          </div>
          {/* Afternoon Shift Section */}
          <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
            <h4 style={{ margin: 0, marginBottom: 12 }}>Afternoon Shift</h4>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
                <select
                  name="afternoon-grade"
                  value={form.afternoon.grade}
                  onChange={handleChange}
                  required
                  className="login-input"
                  style={{ background: 'transparent', border: 'none', width: '100%' }}
                >
                  <option value="" disabled>Grade (required)</option>
                  {afternoonGradeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
                <select
                  name="afternoon-section"
                  value={form.afternoon.section}
                  onChange={handleChange}
                  required
                  className="login-input"
                  style={{ background: 'transparent', border: 'none', width: '100%' }}
                >
                  <option value="" disabled>Section (required)</option>
                  {sectionOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
                <input
                  type="number"
                  name="afternoon-maxStudents"
                  value={form.afternoon.maxStudents}
                  onChange={handleChange}
                  required
                  min={1}
                  placeholder="Max Students"
                  className="login-input"
                  style={{ background: 'transparent', border: 'none', width: '100%' }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, width: '100%', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={loading} className="login-continue" style={{ width: 120, marginBottom: 0 }}>
              {mode === 'edit' ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={onClose} className="login-continue" style={{ width: 120, background: '#eee', color: '#222', marginBottom: 0 }}>Cancel</button>
          </div>
        </form>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }} title="Close">×</button>
      </div>
      <style>{`
        .student-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.18);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          transition: backdrop-filter 0.2s;
        }
      `}</style>
    </div>
  );
};

export default ClassroomModal; 