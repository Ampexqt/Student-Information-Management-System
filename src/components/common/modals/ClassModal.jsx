import React, { useState, useEffect } from 'react';
import { db } from '../../../utils/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import '../../../features/login/login.css';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import { 
  checkScheduleConflict, 
  normalizeSchedule, 
  getShiftForGrade, 
  validateScheduleForGrade,
  getAvailableTimeSlots,
  toMinutes
} from '../../../utils/schedule';
import Toast from '../toast/Toast';

const initialForm = {
  adviserName: '',
  teacherId: '',
  classGrade: '',
  classSection: '',
  classroomId: '',
  subject: '',
  schedule: '',
  schoolYear: '',
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
  'Technology and Livelihood Education',
];

const teacherOptions = [
  'Mr. Santos',
  'Ms. Garcia',
  'Mrs. Rodriguez',
  'Mr. Cruz',
  'Ms. Lopez',
  'Mr. Martinez',
  'Mrs. Hernandez',
  'Ms. Gonzalez',
  'Mr. Perez',
  'Mrs. Torres',
  'Ms. Ramirez',
  'Mr. Reyes',
  'Mrs. Morales',
  'Ms. Rivera',
  'Mr. Diaz',
];

// Helper to get min/max time string for TimePicker
function getTimeString(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

const ClassModal = ({ open, onClose, onSubmit, initialData, mode }) => {
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
  const [shiftInfo, setShiftInfo] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [quarter, setQuarter] = useState('1');
  const [loading, setLoading] = useState(false);
  const [globalToast, setGlobalToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialForm, ...initialData, teacherId: initialData.teacherId || 'T-' });
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
        teacherId: 'T-',
        classGrade: '',
        classSection: '',
        classroomId: '',
      });
      setSchedule([]);
      setStartYear('');
      setEndYear('');
    }
  }, [initialData, open]);

  // Update shift info when grade changes
  useEffect(() => {
    if (form.classGrade) {
      const shift = getShiftForGrade(form.classGrade);
      setShiftInfo(shift);
    } else {
      setShiftInfo(null);
    }
  }, [form.classGrade]);

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

  // Filter classrooms by grade, section, and shift, auto-select if only one match
  useEffect(() => {
    console.log('DEBUG: allClassrooms', allClassrooms);
    console.log('DEBUG: form.classGrade', form.classGrade, 'form.classSection', form.classSection, 'shiftInfo', shiftInfo);
    if (form.classGrade && form.classSection && shiftInfo?.name) {
      const filtered = allClassrooms.filter(room => {
        let match = false;
        if (shiftInfo.name === 'morning') {
          const grade = String(room.morning?.grade || '').replace('Grade ', '').trim();
          const section = String(room.morning?.section || '').trim().toUpperCase();
          match = grade === String(form.classGrade).trim() && section === String(form.classSection).trim().toUpperCase();
          console.log('DEBUG: Morning match', grade, section, match);
        } else if (shiftInfo.name === 'afternoon') {
          const grade = String(room.afternoon?.grade || '').replace('Grade ', '').trim();
          const section = String(room.afternoon?.section || '').trim().toUpperCase();
          match = grade === String(form.classGrade).trim() && section === String(form.classSection).trim().toUpperCase();
          console.log('DEBUG: Afternoon match', grade, section, match);
        }
        return match;
      });
      console.log('DEBUG: Filtered classrooms', filtered);
      setClassrooms(filtered);
      if (filtered.length === 1) {
        setForm(f => ({ ...f, classroomId: filtered[0].id }));
      } else {
        setForm(f => ({ ...f, classroomId: '' }));
      }
    } else {
      setClassrooms([]);
      setForm(f => ({ ...f, classroomId: '' }));
    }
  }, [form.classGrade, form.classSection, shiftInfo, allClassrooms]);

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
        return [...prev, { day, start: '', end: '', subject: '', teacher: '' }];
      }
    });
  };

  const handleTimeChange = (day, type, value) => {
    setSchedule(prev => prev.map(s => s.day === day ? { ...s, [type]: value } : s));
  };

  const handleSubjectChange = (day, value) => {
    setSchedule(prev => prev.map(s => s.day === day ? { ...s, subject: value } : s));
  };

  const handleTeacherIdChange = (day, value) => {
    setSchedule(prev => prev.map(s => s.day === day ? { ...s, teacherId: value } : s));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast({ show: false, message: '', type: '' });

    // Required field validation (specific toasts)
    if (!form.adviserName || form.adviserName.trim() === '') {
      setToast({
        show: true,
        message: 'Adviser Name is required.',
        type: 'error'
      });
      setLoading(false);
      return;
    }
    if (!form.teacherId || form.teacherId.trim() === 'T-' || !/^T-\d+$/.test(form.teacherId.trim())) {
      setToast({
        show: true,
        message: 'Teacher ID is required and must be in the format T-0001.',
        type: 'error'
      });
      setLoading(false);
      return;
    }
    if (!form.classGrade) {
      setToast({
        show: true,
        message: 'Grade is required.',
        type: 'error'
      });
      setLoading(false);
      return;
    }
    if (!form.classSection) {
      setToast({
        show: true,
        message: 'Section is required.',
        type: 'error'
      });
      setLoading(false);
      return;
    }
    if (!form.subject) {
      setToast({
        show: true,
        message: 'Subject is required.',
        type: 'error'
      });
      setLoading(false);
      return;
    }

    // Year validation
    if (!startYear || !endYear || parseInt(startYear) >= parseInt(endYear)) {
      console.log('Validation failed: startYear or endYear invalid', { startYear, endYear });
      setToast({ show: true, message: 'Start year must be less than end year.', type: 'error' });
      setLoading(false);
      return;
    }

    // Schedule validation
    const normalizedSchedule = normalizeSchedule(schedule);
    if (normalizedSchedule.length === 0) {
      console.log('Validation failed: schedule empty', schedule);
      setToast({ show: true, message: 'Please set at least one schedule slot.', type: 'error' });
      setLoading(false);
      return;
    }

    // Adviser/shift logic: all schedule slots must be within the allowed shift for the selected grade
    const shift = getShiftForGrade(form.classGrade);
    if (shift) {
      const anyInvalid = normalizedSchedule.some(slot => {
        const startMinutes = toMinutes(slot.start);
        const endMinutes = toMinutes(slot.end);
        return (
          startMinutes < shift.startMinutes ||
          endMinutes > shift.endMinutes ||
          startMinutes >= endMinutes
        );
      });
      if (anyInvalid) {
        setToast({ show: true, message: `All class times must be within the allowed shift for Grade ${form.classGrade}: ${shift.start} - ${shift.end}.`, type: 'error' });
        setLoading(false);
        return;
      }
    }

    // Schedule overlap validation
    if (form.classroomId && normalizedSchedule.length > 0) {
      const conflictMsg = checkScheduleConflict(
        normalizedSchedule,
        classes,
        form.classroomId,
        form.classGrade,
        initialData ? initialData.id : undefined
      );
      if (conflictMsg) {
        console.log('Validation failed: schedule conflict', conflictMsg);
        setToast({ show: true, message: conflictMsg, type: 'error' });
        setLoading(false);
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
          const teacherIdMsg = cls.teacherId ? ` (ID: ${cls.teacherId})` : '';
          setToast({ show: true, message: `Teacher '${cls.adviserName}'${teacherIdMsg} is already assigned to Grade ${form.classGrade} Section ${form.classSection}. Only one teacher is allowed per grade and section.`, type: 'error' });
          setLoading(false);
          return;
        }
      }
    }

    const submitData = {
      ...form,
      schedule: normalizedSchedule,
      quarter,
      schoolYear: form.schoolYear || `${startYear}–${endYear}`
    };
    console.log('Submitting class form:', submitData);
    await onSubmit(submitData);
    console.log('onSubmit finished');
    setLoading(false);
    if (mode === 'add') {
      // Show success toast globally (outside modal)
      setGlobalToast({ show: true, message: 'Class successfully added!', type: 'success' });
      setForm(initialForm);
      setSchedule([]);
      setStartYear('');
      setEndYear('');
      setQuarter('1');
      onClose(); // Close modal after successful add
    }
  };

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget) onClose();
  };

  // Show loading state if classrooms are not loaded yet
  if (open && allClassrooms.length === 0) {
    return (
      <div className="student-modal-overlay">
        <div className="login-card" style={{ minWidth: 320, maxWidth: 480, width: '96vw', maxHeight: '90vh', overflow: 'visible', position: 'relative', padding: '1.2rem 1rem 1rem 1rem', borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.16)', background: '#fff', fontFamily: 'Poppins, Inter, Arial, sans-serif', fontSize: '0.98rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="login-title" style={{ marginBottom: 12, fontSize: '1.3rem', fontWeight: 700, color: '#222', background: '#faffd7', display: 'inline-block', padding: '0.15em 0.5em', borderRadius: 7 }}>Loading classrooms...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="student-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-card" style={{
        minWidth: 420,
        maxWidth: 650,
        width: '98vw',
        maxHeight: '92vh',
        overflow: 'hidden',
        position: 'relative',
        padding: '0.8rem 1.2rem 1.2rem 1.2rem',
        borderRadius: 14,
        boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
        background: '#fff',
        fontFamily: 'Poppins, Inter, Arial, sans-serif',
        fontSize: '0.98rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }} title="Close">×</button>
        <h3 className="login-title" style={{ marginBottom: 12, fontSize: '1.3rem', fontWeight: 700, color: '#222', background: '#faffd7', display: 'inline-block', padding: '0.15em 0.5em', borderRadius: 7 }}>
          {mode === 'edit' ? 'Edit Class' : 'Add Class'}
        </h3>
        {shiftInfo && (
          <div style={{
            background: shiftInfo.name === 'morning' ? '#fff3cd' : '#d1ecf1',
            border: `1px solid ${shiftInfo.name === 'morning' ? '#ffeaa7' : '#bee5eb'}`,
            borderRadius: 7,
            padding: '7px 10px',
            marginBottom: 10,
            textAlign: 'center',
            fontWeight: 600,
            color: shiftInfo.name === 'morning' ? '#856404' : '#0c5460',
            fontSize: '0.95rem'
          }}>
            📅 {shiftInfo.name}: {shiftInfo.start} - {shiftInfo.end}
          </div>
        )}
        <div style={{ width: '100%', flex: 1, overflowY: 'auto', overflowX: 'hidden', maxHeight: '62vh', marginBottom: 0 }}>
          <form onSubmit={handleSubmit} noValidate style={{ width: '100%', maxWidth: 540, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px #0001', padding: 24, position: 'relative', zIndex: 10 }}>
            {/* Row 1: Teacher Name, Teacher ID */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 8, width: '100%' }}>
              <input
                name="adviserName"
                value={form.adviserName}
                onChange={handleChange}
                placeholder="Teacher Name"
                className="login-input"
                style={{ flex: 2, minWidth: 0, fontSize: '0.98rem', padding: '4px 8px', borderRadius: 5, height: 32, border: '2px solid #bfc3c9', background: '#fff', color: '#222' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #bfc3c9', borderRadius: 5, background: '#fff', height: 32, minWidth: 100, maxWidth: 140, flex: 1, padding: 0 }}>
                <span style={{ fontWeight: 600, color: '#222', fontSize: '1rem', padding: '0 6px' }}>T-</span>
                <input
                  type="text"
                  name="teacherIdSuffix"
                  value={form.teacherId ? form.teacherId.replace(/^T-/, '') : ''}
                  onChange={e => {
                    let value = e.target.value.replace(/[^0-9]/g, '');
                    setForm(f => ({ ...f, teacherId: 'T-' + value }));
                  }}
                  className="login-input"
                  placeholder="e.g. 0001"
                  style={{ border: 'none', outline: 'none', background: 'transparent', color: '#222', fontSize: '0.95rem', flex: 1, padding: 0, height: 28, minWidth: 0, fontWeight: 500, '::placeholder': { fontSize: '0.85rem', color: '#aaa' } }}
                  maxLength={8}
                />
              </div>
            </div>
            {/* Row 2: Grade, Section */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 8, width: '100%' }}>
              <select name="classGrade" value={form.classGrade} onChange={handleChange} className="login-input" style={{ flex: 1, minWidth: 0, fontSize: '0.95rem', padding: '4px 8px', borderRadius: 6, border: '2px solid #bfc3c9', background: '#fff', color: '#222', height: 32 }}>
                <option value="" disabled>Grade</option>
                {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select name="classSection" value={form.classSection} onChange={handleChange} className="login-input" style={{ flex: 1, minWidth: 0, fontSize: '0.95rem', padding: '4px 8px', borderRadius: 6, border: '2px solid #bfc3c9', background: '#fff', color: '#222', height: 32 }}>
                <option value="" disabled>Section</option>
                {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Classroom info row, immediately after grade/section */}
            {form.classGrade && form.classSection && classrooms.length > 0 && (
              <div
                style={{
                  width: '100%',
                  background: '#e3f0ff',
                  border: '1.5px solid #b3c6e7',
                  borderRadius: 6,
                  padding: '6px 10px',
                  color: '#234',
                  fontWeight: 500,
                  fontSize: '0.97rem',
                  margin: '6px 0 4px 0',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  boxShadow: '0 1px 4px rgba(44, 120, 220, 0.06)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  whiteSpace: 'normal'
                }}
              >
                <b>{classrooms[0].buildingName || 'N/A'}</b>, {classrooms[0].floor || 'N/A'}, {classrooms[0].roomNumber || 'N/A'}
              </div>
            )}
            {/* Row 3: Subject */}
            <div style={{ width: '100%' }}>
              <select name="subject" value={form.subject} onChange={handleChange} className="login-input" style={{ width: '100%', fontSize: '0.95rem', padding: '4px 8px', borderRadius: 6, border: '2px solid #bfc3c9', background: '#fff', color: '#222', height: 32 }}>
                <option value="" disabled>Subject</option>
                {subjectOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            {/* Row 4: Compact Class Schedule */}
            <div className="login-input-group" style={{ width: '100%', marginTop: 4, marginBottom: 4 }}>
              <div style={{ marginBottom: 4, fontWeight: 600, color: '#333', fontSize: '0.93rem' }}>
                Class Schedule (Select days and set times within your shift)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f7f8fa', borderRadius: 4, overflow: 'hidden', fontSize: '0.92rem' }}>
                <thead>
                  <tr style={{ background: '#f0f1f3' }}>
                    <th style={{ textAlign: 'left', padding: '2px 4px', fontWeight: 600, fontSize: '0.92rem', borderBottom: '1px solid #e5e7eb' }}>Day</th>
                    <th style={{ textAlign: 'left', padding: '2px 12px 2px 4px', fontWeight: 600, fontSize: '0.92rem', borderBottom: '1px solid #e5e7eb' }}>Start</th>
                    <th style={{ textAlign: 'left', padding: '2px 4px 2px 12px', fontWeight: 600, fontSize: '0.92rem', borderBottom: '1px solid #e5e7eb' }}>End</th>
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
                        <td style={{ padding: '2px 12px 2px 4px', minWidth: 110 }}>
                          {selected && (
                            <TimePicker
                              onChange={value => handleTimeChange(day.key, 'start', value)}
                              value={dayObj.start || null}
                              disableClock={true}
                              format="hh:mm a"
                              clearIcon={null}
                              clockIcon={null}
                              className="schedule-time-picker"
                              amPmAriaLabel="Select AM/PM"
                              minWidth={110}
                              style={{ fontSize: '0.92rem', width: 110, minWidth: 110 }}
                              placeholder={`Start (${form.schoolYear || 'School Year'})`}
                              minTime={shiftInfo ? getTimeString(shiftInfo.startMinutes) : undefined}
                              maxTime={shiftInfo ? getTimeString(shiftInfo.endMinutes) : undefined}
                            />
                          )}
                        </td>
                        <td style={{ padding: '2px 4px 2px 12px', minWidth: 110 }}>
                          {selected && (
                            <TimePicker
                              onChange={value => handleTimeChange(day.key, 'end', value)}
                              value={dayObj.end || null}
                              disableClock={true}
                              format="hh:mm a"
                              clearIcon={null}
                              clockIcon={null}
                              className="schedule-time-picker"
                              amPmAriaLabel="Select AM/PM"
                              minWidth={110}
                              style={{ fontSize: '0.92rem', width: 110, minWidth: 110 }}
                              placeholder={`End (${form.schoolYear || 'School Year'})`}
                              minTime={shiftInfo ? getTimeString(shiftInfo.startMinutes) : undefined}
                              maxTime={shiftInfo ? getTimeString(shiftInfo.endMinutes) : undefined}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Row 5: School Year and Quarter */}
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 500, color: '#7a7f87', fontSize: '0.98rem', minWidth: 80 }}>School Year</span>
                <div className="login-input-group" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={startYear} onChange={e => setStartYear(e.target.value)} className="login-input" style={{ width: 70, fontSize: '0.93rem', textAlign: 'center', borderRadius: 6 }}>
                    <option value="" disabled>Start</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <span style={{ fontWeight: 600, color: '#888', fontSize: '1.1rem' }}>–</span>
                  <select value={endYear} onChange={e => setEndYear(e.target.value)} className="login-input" style={{ width: 70, fontSize: '0.93rem', textAlign: 'center', borderRadius: 6 }}>
                    <option value="" disabled>End</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="login-input-group" style={{ flex: '0 0 110px', minWidth: 90, display: 'flex', justifyContent: 'center' }}>
                  <select value={quarter} onChange={e => setQuarter(e.target.value)} className="login-input" style={{ width: 90, fontSize: '0.93rem', textAlign: 'center', borderRadius: 6 }}>
                    <option value="1">Quarter 1</option>
                    <option value="2">Quarter 2</option>
                    <option value="3">Quarter 3</option>
                    <option value="4">Quarter 4</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Row 6: Action Buttons */}
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 12,
              marginTop: 18,
              marginBottom: 0,
              background: 'transparent',
              paddingBottom: 0,
              position: 'sticky',
              bottom: 0,
              zIndex: 2,
              boxShadow: '0 -2px 8px -4px #e9ecef',
              backgroundColor: '#fff',
            }}>
              <button
                type="submit"
                className="login-btn modal-btn add-btn"
                style={{ padding: '7px 28px', fontSize: '1.08rem', borderRadius: 7, fontWeight: 600, background: '#7a7f87', color: '#fff', border: 'none', margin: 0, cursor: 'pointer' }}
                disabled={loading}
              >
                {loading ? 'Saving...' : mode === 'edit' ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                className="login-btn modal-btn cancel-btn"
                style={{ borderRadius: '2rem', background: '#f4f6f8', color: '#222', border: 'none', margin: 0, cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem', padding: '0.8rem 0', width: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        {/* Toast notification inside modal, left top corner */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 20, width: 'auto', maxWidth: 320 }}>
          <Toast
            toasts={toast.show ? [{ id: 1, message: toast.message, type: toast.type }] : []}
            onClose={() => setToast({ ...toast, show: false })}
            modal
          />
        </div>
      </div>
      {globalToast.show && (
        <Toast
          toasts={[{ id: 1, message: globalToast.message, type: globalToast.type }]}
          onClose={() => setGlobalToast({ ...globalToast, show: false })}
          modal={false}
        />
      )}
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
        .modal-btn {
          transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
          cursor: pointer;
        }
        .modal-btn.add-btn:hover:enabled {
          background: #495057 !important;
          box-shadow: 0 6px 0 0 #181c22;
          transform: translateY(-2px) scale(1.02);
        }
        .modal-btn.cancel-btn {
          background: #f4f6f8 !important;
          color: #222 !important;
          border-radius: 2rem !important;
          font-weight: 600;
          border: none;
          padding: 0.8rem 0;
          font-size: 1.1rem;
          margin: 0;
          width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: none;
        }
        .modal-btn.cancel-btn:hover:enabled {
          background: #e2e6ea !important;
          color: #222 !important;
          box-shadow: 0 6px 0 0 #bfc3c9;
          transform: translateY(-2px) scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default ClassModal; 