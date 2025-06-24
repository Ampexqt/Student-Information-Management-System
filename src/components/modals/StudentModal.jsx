import React, { useState, useEffect } from 'react';
import '../../pages/loginPage/Login.css';
import { db } from '../../utils/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import StudentImageUpload from '../StudentImageUpload';
import { generateStudentId } from '../../utils/firebase';

const initialForm = {
  address: '',
  birthdate: '',
  classId: '',
  contactNumber: '',
  email: '',
  firstName: '',
  gender: '',
  lastName: '',
  grade: '',
};

const StudentModal = ({ open, onClose, onSubmit, initialData, loading, mode, classStudentCounts, students = [] }) => {
  const [form, setForm] = useState(initialForm);
  const [grades, setGrades] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [birthdateInputType, setBirthdateInputType] = useState('text');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [studentIdLoading, setStudentIdLoading] = useState(false);

  // Add a style object for compact, centered input fields
  const studentInputStyle = {
    height: '44px',
    fontSize: '1rem',
    padding: '0 14px',
    border: 'none',
    background: 'transparent',
    fontWeight: 400,
    color: '#222',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border 0.2s',
  };
  const studentSelectStyle = {
    ...studentInputStyle,
    paddingRight: '32px',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    background: 'transparent',
  };
  // Add placeholder style globally for this modal
  const placeholderStyle = `
    .student-modal-overlay .login-input::placeholder {
      color: #8a8f98;
      opacity: 1;
      font-size: 1rem;
      font-weight: 400;
      letter-spacing: 0.01em;
      vertical-align: middle;
      line-height: 44px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  // Fetch all classes and extract unique grades on modal open
  useEffect(() => {
    if (open) {
      setLoadingGrades(true);
      getDocs(collection(db, 'Class'))
        .then(snapshot => {
          const classArr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('Loaded classes from Firestore:', classArr); // Debug log
          setAllClasses(classArr);
          // Extract unique grades from classGrade field as they appear in Firestore
          const uniqueGrades = Array.from(new Set(classArr.map(cls => cls.classGrade))).filter(Boolean);
          setGrades(uniqueGrades);
        })
        .catch(() => {
          setAllClasses([]);
          setGrades([]);
        })
        .finally(() => setLoadingGrades(false));
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialForm, ...initialData });
      setStudentId(initialData.studentId || '');
      setStudentIdLoading(false);
    } else if (open) {
      setForm(initialForm);
      setStudentId('');
      setStudentIdLoading(true);
      generateStudentId().then(id => {
        setStudentId(id);
        setStudentIdLoading(false);
      });
    } else {
      setForm(initialForm);
      setStudentId('');
      setStudentIdLoading(false);
    }
  }, [initialData, open]);

  // Filter classes for selected grade
  useEffect(() => {
    if (form.grade) {
      setLoadingClasses(true);
      let filtered = allClasses.filter(cls => {
        // Match the grade exactly as in Firestore
        const gradeMatch = String(cls.classGrade) === String(form.grade);
        // Use maxStudents (string) and treat as number, assume usedSlots is 0 if missing
        const max = Number(cls.maxStudents) || 0;
        const used = Number(cls.usedSlots) || 0;
        const hasSpace = max - used > 0;
        return gradeMatch && hasSpace;
      });
      // Always include the student's current class if editing
      if (form.classId && !filtered.some(cls => cls.id === form.classId)) {
        const currentClass = allClasses.find(cls => cls.id === form.classId);
        if (currentClass) {
          filtered = [...filtered, currentClass];
        }
      }
      setClasses(filtered);
      setLoadingClasses(false);
      // Only reset classId if not editing
      if (!form.classId) {
        setForm(f => ({ ...f, classId: '' }));
      }
    } else {
      setClasses([]);
      setForm(f => ({ ...f, classId: '' }));
    }
  }, [form.grade, allClasses]);

  const formatContactNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Format as ####-###-####
    let formatted = '';
    if (digits.length > 0) formatted += digits.substring(0, 4);
    if (digits.length > 4) formatted += '-' + digits.substring(4, 7);
    if (digits.length > 7) formatted += '-' + digits.substring(7, 11);
    return formatted;
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format.';
        break;
      case 'contactNumber':
        if (value) {
          // Should match ####-###-#### and be 11 digits
          if (!/^\d{4}-\d{3}-\d{4}$/.test(value)) return 'Contact number must be in the format eg. 0970-983-6509 and has 11 digits';
        }
        break;
      case 'birthdate':
        if (value) {
          const birth = new Date(value);
          const now = new Date();
          const min = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
          const max = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
          if (isNaN(birth.getTime()) || birth < min || birth > max) {
            return 'Birthdate must be a valid date.';
          }
        }
        break;
      case 'studentId':
        if (value) {
          const duplicate = students.some(
            s => s.studentId === value && (mode !== 'edit' || s.id !== form.id)
          );
          if (duplicate) return 'Student ID already exists.';
        }
        break;
      default:
        break;
    }
    return '';
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(form).forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) errors[key] = err;
    });
    return errors;
  };

  if (!open) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'contactNumber') {
      newValue = formatContactNumber(value);
    }
    setForm(f => ({ ...f, [name]: newValue }));
    if (submitted) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, newValue) }));
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    setSubmitted(true);
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    onSubmit({ ...form, studentId });
  };

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="student-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-card" style={{ minWidth: 400, maxWidth: '90vw', width: 'auto', position: 'relative', padding: '2.5rem 2rem 2rem 2rem' }}>
        <h3 className="login-title" style={{ marginBottom: 20 }}>
          {mode === 'edit' ? <span className="dashboard-highlight">Edit Student</span> : <span className="dashboard-highlight">Add Student</span>}
        </h3>
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          {submitted && Object.values(fieldErrors).some(Boolean) && (
            <div style={{ color: '#fff', background: '#ff4d4f', marginBottom: 16, borderRadius: 8, padding: '12px 16px', fontWeight: 'bold', fontSize: '1rem', width: '100%' }}>
              <ul style={{ margin: 0, paddingLeft: '1.2em', listStyle: 'disc', color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                {Object.values(fieldErrors).filter(Boolean).map((err, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="login-input-group" style={{ flex: '1 1 180px', minWidth: 180 }}>
            <input
              type="text"
              value={studentIdLoading ? 'Generating...' : studentId}
              readOnly
              tabIndex={-1}
              title="This field is auto-generated and cannot be edited."
              style={{
                border: 'none',
                background: '#f5f5f5',
                color: '#888',
                fontWeight: 600,
                fontSize: '1.1rem',
                outline: 'none',
                cursor: 'not-allowed',
                width: '100%',
                padding: 0,
                margin: 0,
              }}
              className="login-input"
            />
          </div>
          {studentIdLoading && <div className="spinner">Loading...</div>}
          <div className="login-input-group" style={{ flex: '1 1 180px', minWidth: 180 }}>
            <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" required className="login-input" style={studentInputStyle} />
          </div>
          <div className="login-input-group" style={{ flex: '1 1 180px', minWidth: 180 }}>
            <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" required className="login-input" style={studentInputStyle} />
          </div>
          <div className="login-input-group" style={{ flex: '1 1 220px', minWidth: 220 }}>
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required className="login-input" style={studentInputStyle} />
          </div>
          <div className="login-input-group" style={{ flex: '1 1 160px', minWidth: 160 }}>
            <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Contact Number (e.g. 0970-983-6509)" className="login-input" maxLength={13} style={studentInputStyle} />
          </div>
          <div className="login-input-group" style={{ flex: '2 1 260px', minWidth: 260 }}>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className="login-input" style={studentInputStyle} />
          </div>
          <div className="login-input-group" style={{ flex: '1 1 160px', minWidth: 160 }}>
            <input
              name="birthdate"
              value={form.birthdate}
              onChange={handleChange}
              placeholder="dd/mm/yyyy"
              type={birthdateInputType}
              className="login-input"
              style={studentInputStyle}
              onFocus={() => setBirthdateInputType('date')}
              onBlur={e => {
                if (!e.target.value) setBirthdateInputType('text');
              }}
            />
          </div>
          <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
            <select name="gender" value={form.gender} onChange={handleChange} required className="login-input" style={studentSelectStyle}>
              <option value="" disabled>Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
            <select name="grade" value={form.grade} onChange={handleChange} required className="login-input" style={studentSelectStyle}>
              <option value="" disabled>{loadingGrades ? 'Loading grades...' : 'Grade'}</option>
              {grades.map(grade => {
                // Remove 'Grade ' prefix if present for display
                const displayGrade = typeof grade === 'string' && grade.startsWith('Grade ') ? grade.replace('Grade ', '') : grade;
                return (
                  <option key={grade} value={grade}>{displayGrade}</option>
                );
              })}
            </select>
          </div>
          <div className="login-input-group" style={{ flex: '1 1 120px', minWidth: 120 }}>
            <select name="classId" value={form.classId} onChange={handleChange} required className="login-input" style={studentSelectStyle} disabled={!form.grade || loadingClasses || classes.length === 0}>
              <option value="" disabled>{!form.grade ? 'Select Grade First' : loadingClasses ? 'Loading classes...' : classes.length === 0 ? 'No Classes Available' : 'Class'}</option>
              {classes.map(cls => {
                let label = '';
                if (cls.classSection) {
                  label = `${cls.classSection}`;
                } else {
                  label = cls.id;
                }
                const max = Number(cls.maxStudents) || 0;
                const used = (classStudentCounts && classStudentCounts[cls.id]) || 0;
                const left = max - used;

                // Only show (left) count if NOT the currently selected class
                if (max > 0 && cls.id !== form.classId) {
                  if (left > 0) {
                    label += ` (${left} left)`;
                  } else {
                    label += ` (Full)`;
                  }
                }
                return (
                  <option key={cls.id} value={cls.id}>{label}</option>
                );
              })}
            </select>
          </div>
          <StudentImageUpload
            studentId={form.id || 'new'}
            currentImage={form.profileImage}
            onImageUpdate={(imageData) => {
              setForm(prev => ({ ...prev, profileImage: imageData.optimizedUrl }));
            }}
          >
            {/* Minimalist avatar circle, no icon or text, just the image if present */}
            <div style={{
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: '#f4f6f8',
              border: '2px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              margin: '0 auto',
            }}>
              {form.profileImage ? (
                <img src={form.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : null}
            </div>
          </StudentImageUpload>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, width: '100%', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={studentIdLoading || !studentId || loading}
              className="login-continue"
              style={{ width: 120, marginBottom: 0 }}
            >
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
        ${placeholderStyle}
      `}</style>
    </div>
  );
};

export default StudentModal; 