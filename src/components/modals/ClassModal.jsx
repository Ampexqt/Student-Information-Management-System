import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import '../../pages/loginPage/Login.css';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import { checkScheduleConflict, normalizeSchedule } from '../../utils/schedule';

const initialForm = {
  adviserName: '',
  classGrade: '',
  classSection: '',
  classroomId: '',
  schedule: '',
  schoolYear: '',
  maxStudents: '',
  subject: '',
};

const gradeOptions = ['7', '8', '9', '10'];
const sectionOptions = ['A', 'B', 'C', 'D'];

const scheduleOptions = [
  'Mon–Fri 8:00 AM – 3:00 PM',
  'Mon–Fri 7:30 AM – 2:30 PM',
  'Sat 8:00 AM – 12:00 PM',
  'Custom',
];

const daysOfWeek = [
  { key: 'Mon', label: 'Mon' },
  { key: 'Tue', label: 'Tue' },
  { key: 'Wed', label: 'Wed' },
  { key: 'Thu', label: 'Thu' },
  { key: 'Fri', label: 'Fri' },
];

const subjectOptions = [
  'Mathematics',
  'English',
  'Science',
  'Filipino',
  'Araling Panlipunan',
  'MAPEH (Music, Arts, PE, Health)',
  'Values Education',
];

const ClassModal = ({ open, onClose, onSubmit, initialData, loading, mode }) => {
  const [form, setForm] = useState(initialForm);
  const [classrooms, setClassrooms] = useState([]);
  const [allClassrooms, setAllClassrooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showCustomSchedule, setShowCustomSchedule] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialForm, ...initialData });
      setSchedule(normalizeSchedule(initialData.schedule));
      if (initialData.schoolYear && initialData.schoolYear.includes('–')) {
        const [start, end] = initialData.schoolYear.split('–');
        setStartYear(start);
        setEndYear(end);
      } else {
        setStartYear('');
        setEndYear('');
      }
    } else {
      setForm({
        ...initialForm,
        classGrade: '',
        classSection: '',
        classroomId: '',
      });
      setSchedule([]);
      setStartYear('');
      setEndYear('');
    }
  }, [initialData, open]);

  useEffect(() => {
    if (open) {
      const unsubClassrooms = onSnapshot(collection(db, 'Classroom'), (snapshot) => {
        const allRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllClassrooms(allRooms);
      });
      const unsubClasses = onSnapshot(collection(db, 'Class'), (snapshot) => {
        setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => {
        unsubClassrooms();
        unsubClasses();
      };
    }
  }, [open]);

  useEffect(() => {
    // Count how many classes are assigned to each classroom
    const classroomCounts = {};
    for (const cls of classes) {
      if (cls.classroomId) {
        classroomCounts[cls.classroomId] = (classroomCounts[cls.classroomId] || 0) + 1;
      }
    }
    setClassrooms(allClassrooms);
  }, [allClassrooms, classes, form.classroomId]);

  useEffect(() => {
    if (startYear && endYear) {
      setForm(f => ({ ...f, schoolYear: `${startYear}–${endYear}` }));
    }
  }, [startYear, endYear]);

  if (!open) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'schedule') {
      setShowCustomSchedule(value === 'Custom');
    }
  };

  const handleDayChange = (day) => {
    setSchedule(prev => {
      if (prev.some(s => s.day === day)) {
        return prev.filter(s => s.day !== day);
      } else {
        return [...prev, { day, start: '', end: '' }];
      }
    });
  };

  const handleTimeChange = (day, type, value) => {
    setSchedule(prev => prev.map(s => s.day === day ? { ...s, [type]: value } : s));
  };

  const handleSubmit = e => {
    e.preventDefault();
    setErrorMsg('');
    // Year validation
    if (!startYear || !endYear || parseInt(startYear) >= parseInt(endYear)) {
      setErrorMsg('Start year must be less than end year.');
      return;
    }
    // Schedule normalization
    const normalizedSchedule = normalizeSchedule(schedule);
    // Schedule overlap validation
    if (form.classroomId && normalizedSchedule.length > 0) {
      const conflictMsg = checkScheduleConflict(
        normalizedSchedule,
        classes,
        form.classroomId,
        initialData ? initialData.id : undefined
      );
      if (conflictMsg) {
        setErrorMsg(conflictMsg);
        return;
      }
    }
    // Adviser per grade-section validation
    if (form.adviserName && form.classGrade && form.classSection) {
      for (const cls of classes) {
        if (
          cls.adviserName &&
          cls.adviserName.trim().toLowerCase() === form.adviserName.trim().toLowerCase() &&
          cls.classGrade === form.classGrade &&
          cls.classSection === form.classSection &&
          (!initialData || cls.id !== initialData.id)
        ) {
          setErrorMsg(`Adviser '${form.adviserName}' is already assigned to Grade ${form.classGrade} Section ${form.classSection}. Only one adviser is allowed per grade and section.`);
          return;
        }
      }
    }
    onSubmit({ ...form, schedule: normalizedSchedule });
  };

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="student-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-card" style={{ minWidth: 400, maxWidth: '95vw', width: 'auto', position: 'relative', padding: '2.5rem 2rem 2rem 2rem', borderRadius: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', background: '#fff', fontFamily: 'Poppins, Inter, Arial, sans-serif' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }} title="Close">×</button>
        <h3 className="login-title" style={{ marginBottom: 20, fontSize: '2rem', fontWeight: 700, color: '#222', background: '#faffd7', display: 'inline-block', padding: '0.2em 0.7em', borderRadius: 8 }}>{mode === 'edit' ? 'Edit Class' : 'Add Class'}</h3>
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {errorMsg && (
            <div style={{ color: '#fff', background: '#ff4d4f', marginBottom: 12, borderRadius: 8, padding: '12px 16px', fontWeight: 'bold', fontSize: '1rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}
          {/* Row 1: Adviser, Grade, Section, Classroom */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%' }}>
            <div className="login-input-group" style={{ flex: '1 1 180px', minWidth: 160 }}>
              <input name="adviserName" value={form.adviserName} onChange={handleChange} placeholder="Adviser Name" required className="login-input" disabled={classrooms.length === 0} style={{ background: classrooms.length === 0 ? '#f5f5f5' : undefined }} />
            </div>
            <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 110 }}>
              <select name="classGrade" value={form.classGrade} onChange={handleChange} required className="login-input" style={{ background: classrooms.length === 0 ? '#f5f5f5' : 'transparent', border: 'none', width: '100%' }} disabled={classrooms.length === 0}>
                <option value="" disabled>Grade Select...</option>
                {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 110 }}>
              <select name="classSection" value={form.classSection} onChange={handleChange} required className="login-input" style={{ background: classrooms.length === 0 ? '#f5f5f5' : 'transparent', border: 'none', width: '100%' }} disabled={classrooms.length === 0}>
                <option value="" disabled>Section Select...</option>
                {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 110 }}>
              <select name="subject" value={form.subject} onChange={handleChange} required className="login-input" style={{ background: classrooms.length === 0 ? '#f5f5f5' : 'transparent', border: 'none', width: '100%' }} disabled={classrooms.length === 0}>
                <option value="" disabled>Subject</option>
                {subjectOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div className="login-input-group" style={{ flex: '1 1 220px', minWidth: 160, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
              <select name="classroomId" value={form.classroomId} onChange={handleChange} required className="login-input" style={{ background: classrooms.length === 0 ? '#f5f5f5' : 'transparent', border: 'none', width: '100%' }} disabled={classrooms.length === 0}>
                <option value="" disabled>Classroom Select...</option>
                {classrooms.map(room => {
                  // Count how many classes are assigned to this classroom
                  const count = classes.filter(cls => cls.classroomId === room.id).length;
                  const isCurrent = form.classroomId === room.id;
                  const isFull = count >= 10 && !isCurrent;
                  let label = room.buildingName ? `${room.buildingName} - ${room.roomNumber}` : room.id;
                  if (isFull) label += ' (Full)';
                  return (
                    <option key={room.id} value={room.id} disabled={isFull}>{label}</option>
                  );
                })}
              </select>
              {classrooms.length === 0 && (
                <div style={{ color: '#fff', background: '#ff4d4f', marginTop: 12, fontWeight: 'bold', textAlign: 'center', borderRadius: 8, padding: '16px 12px', fontSize: '1.1rem', minWidth: 180, boxShadow: '0 2px 8px rgba(255,77,79,0.08)' }}>
                  No classrooms available.<br/>Please add a classroom first.
                </div>
              )}
            </div>
          </div>
          {/* Row 2: Class Schedule (full width) */}
          <div className="login-input-group" style={{ width: '100%', marginTop: 2, marginBottom: 2 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f7f8fa', borderRadius: 4, overflow: 'hidden', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ background: '#f0f1f3' }}>
                  <th style={{ textAlign: 'left', padding: '2px 4px', fontWeight: 600, fontSize: '0.92rem', borderBottom: '1px solid #e5e7eb' }}>Day</th>
                  <th style={{ textAlign: 'left', padding: '2px 4px', fontWeight: 600, fontSize: '0.92rem', borderBottom: '1px solid #e5e7eb' }}>Start</th>
                  <th style={{ textAlign: 'left', padding: '2px 4px', fontWeight: 600, fontSize: '0.92rem', borderBottom: '1px solid #e5e7eb' }}>End</th>
                </tr>
              </thead>
              <tbody>
                {daysOfWeek.map(day => {
                  const selected = schedule.some(s => s.day === day.key);
                  const dayObj = schedule.find(s => s.day === day.key) || {};
                  return (
                    <tr key={day.key} style={{ borderBottom: '1px solid #f0f1f3' }}>
                      <td style={{ padding: '2px 4px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.92rem' }}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleDayChange(day.key)}
                            id={`day-${day.key}`}
                            style={{ marginRight: 3, width: 14, height: 14 }}
                          />
                          {day.label}
                        </label>
                      </td>
                      <td style={{ padding: '2px 4px', minWidth: 90 }}>
                        {selected && (
                          <TimePicker
                            onChange={value => handleTimeChange(day.key, 'start', value)}
                            value={dayObj.start || null}
                            disableClock={true}
                            format="hh:mm a"
                            clearIcon={null}
                            clockIcon={null}
                            required
                            className="schedule-time-picker"
                            amPmAriaLabel="Select AM/PM"
                            minWidth={70}
                            style={{ fontSize: '0.92rem', width: 70, minWidth: 45 }}
                            placeholder="Select start time..."
                          />
                        )}
                      </td>
                      <td style={{ padding: '2px 4px', minWidth: 90 }}>
                        {selected && (
                          <TimePicker
                            onChange={value => handleTimeChange(day.key, 'end', value)}
                            value={dayObj.end || null}
                            disableClock={true}
                            format="hh:mm a"
                            clearIcon={null}
                            clockIcon={null}
                            required
                            className="schedule-time-picker"
                            amPmAriaLabel="Select AM/PM"
                            minWidth={70}
                            style={{ fontSize: '0.92rem', width: 70, minWidth: 45 }}
                            placeholder="Select end time..."
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Row 3: School Year | Max Students */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <div className="login-input-group" style={{ flex: '1 1 220px', minWidth: 180, display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', width: '100%' }}>
                <select value={startYear} onChange={e => setStartYear(e.target.value)} required className="login-input" style={{ width: 110, fontSize: '0.93rem', textAlign: 'center' }}>
                  <option value="" disabled>Select Start Year...</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span style={{ alignSelf: 'center', fontWeight: 600 }}>–</span>
                <select value={endYear} onChange={e => setEndYear(e.target.value)} required className="login-input" style={{ width: 110, fontSize: '0.93rem', textAlign: 'center' }}>
                  <option value="" disabled>Select End Year...</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120, display: 'flex', justifyContent: 'center' }}>
              <input name="maxStudents" value={form.maxStudents} onChange={handleChange} placeholder="Max Students" required type="number" min="1" max="70" className="login-input" disabled={classrooms.length === 0} style={{ background: classrooms.length === 0 ? '#f5f5f5' : undefined, textAlign: 'center' }} />
            </div>
          </div>
          {/* Row 4: Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button type="submit" disabled={loading || classrooms.length === 0} className="login-continue" style={{ width: 120, marginBottom: 0 }}>
              {mode === 'edit' ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={onClose} className="login-continue" style={{ width: 120, background: '#eee', color: '#222', marginBottom: 0 }}>Cancel</button>
          </div>
        </form>
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

export default ClassModal; 