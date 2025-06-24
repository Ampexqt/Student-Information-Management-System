import React, { useState, useEffect } from 'react';
import '../../pages/loginPage/Login.css';

const initialForm = {
  buildingName: '',
  floor: '',
  roomNumber: '',
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

const ClassroomModal = ({ open, onClose, onSubmit, initialData, loading, mode, classrooms = [] }) => {
  const [form, setForm] = useState(initialForm);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialForm, ...initialData });
    } else {
      setForm(initialForm);
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    setErrorMsg('');
    // Duplicate check
    const duplicate = classrooms.find(c =>
      c.buildingName.trim().toLowerCase() === form.buildingName.trim().toLowerCase() &&
      c.roomNumber.trim().toLowerCase() === form.roomNumber.trim().toLowerCase() &&
      (mode !== 'edit' || c.id !== (initialData && initialData.id))
    );
    if (duplicate) {
      setErrorMsg('A classroom with this building and room number already exists.');
      return;
    }
    onSubmit(form);
  };

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="student-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-card" style={{ minWidth: 400, maxWidth: '90vw', width: 'auto', position: 'relative', padding: '2.5rem 2rem 2rem 2rem' }}>
        <h3 className="login-title" style={{ marginBottom: 20 }}>{mode === 'edit' ? 'Edit Classroom' : 'Add Classroom'}</h3>
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          {errorMsg && (
            <div style={{ color: '#fff', background: '#ff4d4f', marginBottom: 12, borderRadius: 8, padding: '12px 16px', fontWeight: 'bold', fontSize: '1rem', textAlign: 'center', width: '100%' }}>
              {errorMsg}
            </div>
          )}
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