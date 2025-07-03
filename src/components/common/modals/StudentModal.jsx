/**
 * Student Modal Component - Add/Edit Student Form
 * 
 * This component provides a comprehensive modal form for adding and editing
 * student information in the Student Information Management System.
 * 
 * Key Features:
 * - Add new student with auto-generated Student ID
 * - Edit existing student information
 * - Real-time form validation
 * - Profile image upload integration
 * - Dynamic class/section selection based on grade
 * - Contact number formatting
 * - Birthdate validation with age restrictions
 * - Responsive design for mobile and desktop
 * - Loading states and error handling
 * 
 * Form Fields:
 * - Student ID (auto-generated, read-only)
 * - Email (required, validated)
 * - First Name (required)
 * - Last Name (required)
 * - Contact Number (formatted as ####-###-####)
 * - Address
 * - Birthdate (required, minimum age validation)
 * - Gender (dropdown)
 * - Grade (required, 7-10)
 * - Section (required, filtered by grade)
 * 
 * Validation Rules:
 * - Email must be valid format
 * - Contact number must be 11 digits in ####-###-#### format
 * - Student must be at least 10 years old
 * - Student ID must be unique
 * - All required fields must be filled
 * 
 * Integration:
 * - Firebase Firestore for data persistence
 * - Student image upload component
 * - Class and classroom data integration
 * - Real-time student count tracking
 */

import React, { useState, useEffect } from 'react';
import '../../../features/login/login.css';
import { db } from '../../../utils/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import StudentImageUpload from '../StudentImageUpload';
import { generateStudentId } from '../../../utils/firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

/**
 * Initial form state for new student creation
 * All fields are empty strings by default
 */
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

/**
 * Static grade options available in the system
 * Grades 7-10 are supported
 */
const staticGrades = [7, 8, 9, 10];

/**
 * Student Modal component for adding and editing students
 * @param {boolean} open - Whether the modal is visible
 * @param {Function} onClose - Function to close the modal
 * @param {Function} onSubmit - Function to handle form submission
 * @param {Object} initialData - Initial data for edit mode
 * @param {boolean} loading - Loading state for form submission
 * @param {string} mode - 'add' or 'edit' mode
 * @param {Object} classStudentCounts - Student count per class
 * @param {Array} students - Array of existing students for validation
 */
const StudentModal = ({ open, onClose, onSubmit, initialData, loading, mode, classStudentCounts, students = [] }) => {
  // Form state management
  const [form, setForm] = useState(initialForm); // Current form data
  const [grades, setGrades] = useState([]); // Available grades from classrooms
  const [sections, setSections] = useState([]); // Available sections
  const [allClasses, setAllClasses] = useState([]); // All available classes
  const [classes, setClasses] = useState([]); // Filtered classes based on grade
  const [loadingGrades, setLoadingGrades] = useState(false); // Loading state for grade fetching
  const [loadingClasses, setLoadingClasses] = useState(false); // Loading state for class fetching
  const [birthdateInputType, setBirthdateInputType] = useState('text'); // Birthdate input type
  const [fieldErrors, setFieldErrors] = useState({}); // Field validation errors
  const [submitted, setSubmitted] = useState(false); // Whether form has been submitted
  const [studentId, setStudentId] = useState(''); // Auto-generated student ID
  const [studentIdLoading, setStudentIdLoading] = useState(false); // Loading state for student ID generation
  const [birthdate, setBirthdate] = useState(null); // Birthdate as Date object
  const [assignedClassroom, setAssignedClassroom] = useState(null); // Assigned classroom information

  // Style objects for consistent form styling
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
  
  // Global placeholder styling for the modal
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

  /**
   * Effect hook to fetch classroom data and extract grades/sections
   * Runs when modal opens to populate dropdown options
   */
  useEffect(() => {
    if (open) {
      setLoadingGrades(true);
      getDocs(collection(db, 'Classroom')).then(snapshot => {
        const classArr = [];
        
        // Process each classroom document
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // Add morning shift class if available
          if (data.morning) {
            classArr.push({
              id: doc.id + '_morning',
              firestoreId: doc.id,
              classGrade: data.morning.grade ? data.morning.grade.replace('Grade ', '') : '',
              classSection: data.morning.section,
              maxStudents: Number(data.morning.maxStudents),
              period: 'morning',
              ...data.morning
            });
          }
          
          // Add afternoon shift class if available
          if (data.afternoon) {
            classArr.push({
              id: doc.id + '_afternoon',
              firestoreId: doc.id,
              classGrade: data.afternoon.grade ? data.afternoon.grade.replace('Grade ', '') : '',
              classSection: data.afternoon.section,
              maxStudents: Number(data.afternoon.maxStudents),
              period: 'afternoon',
              ...data.afternoon
            });
          }
        });
        
        console.log('Flattened classrooms:', classArr);
        setAllClasses(classArr);
        
        // Extract unique grades and sort numerically
        const uniqueGrades = Array.from(new Set(classArr.map(cls => cls.classGrade)))
          .filter(Boolean)
          .sort((a, b) => Number(a) - Number(b));
        setGrades(uniqueGrades);
        
        // Extract unique sections
        const uniqueSections = Array.from(new Set(classArr.map(cls => cls.classSection)))
          .filter(Boolean);
        setSections(uniqueSections);
      }).catch(() => {
        // Handle errors by setting empty arrays
        setAllClasses([]);
        setGrades([]);
        setSections([]);
      }).finally(() => setLoadingGrades(false));
    }
  }, [open]);

  /**
   * Effect hook to handle form initialization and student ID generation
   * Sets up form data based on mode (add/edit) and generates student ID for new students
   */
  useEffect(() => {
    if (initialData) {
      // Edit mode: populate form with existing data
      setForm({ ...initialForm, ...initialData });
      setStudentId(initialData.studentId || '');
      setStudentIdLoading(false);
      setBirthdate(initialData.birthdate ? new Date(initialData.birthdate) : null);
    } else if (open) {
      // Add mode: reset form and generate new student ID
      setForm(initialForm);
      setStudentId('');
      setStudentIdLoading(true);
      generateStudentId().then(id => {
        setStudentId(id);
        setStudentIdLoading(false);
      });
      setBirthdate(null);
    } else {
      // Modal closed: reset all form state
      setForm(initialForm);
      setStudentId('');
      setStudentIdLoading(false);
      setBirthdate(null);
    }
  }, [initialData, open]);

  /**
   * Effect hook to filter classes based on selected grade
   * Updates available classes when grade selection changes
   */
  useEffect(() => {
    setLoadingClasses(true);
    let filtered;
    
    if (form.grade) {
      // Filter classes by selected grade
      filtered = allClasses.filter(cls => String(cls.classGrade) === String(form.grade));
    } else {
      // Show all classes if no grade selected
      filtered = allClasses;
    }
    
    setClasses(filtered);
    setLoadingClasses(false);
    
    // Reset class selection if grade changes
    if (!form.classId) {
      setForm(f => ({ ...f, classId: '' }));
    }
  }, [form.grade, allClasses]);

  /**
   * Computed value for recommended classroom
   * Suggests the classroom with the fewest students for better distribution
   */
  const recommendedClassroomId = React.useMemo(() => {
    if (form.grade && classes.length > 0) {
      let minCount = Infinity;
      let selectedClassroom = null;
      
      classes.forEach(cls => {
        const used = classStudentCounts[cls.id] || 0;
        if (used < minCount) {
          minCount = used;
          selectedClassroom = cls;
        }
      });
      
      return selectedClassroom ? selectedClassroom.id : null;
    }
    return null;
  }, [form.grade, classes, classStudentCounts]);

  /**
   * Formats contact number input to ####-###-#### format
   * @param {string} value - Raw input value
   * @returns {string} - Formatted contact number
   */
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

  /**
   * Validates individual form fields
   * @param {string} name - Field name
   * @param {string} value - Field value
   * @returns {string} - Error message or empty string if valid
   */
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        // Email format validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format.';
        break;
        
      case 'contactNumber':
        if (value) {
          // Contact number format validation (####-###-#### with 11 digits)
          if (!/^\d{4}-\d{3}-\d{4}$/.test(value)) return 'Contact number must be in the format eg. 0970-983-6509 and has 11 digits';
        }
        break;
        
      case 'birthdate':
        if (value) {
          const birth = new Date(value);
          const now = new Date();
          const minAge = 10;
          const tenYearsAgo = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
          
          // Check minimum age requirement
          if (birth > tenYearsAgo) {
            return 'Student must be at least 10 years old.';
          }
          
          // Check date validity (between 5 and 100 years ago)
          const min = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
          const max = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
          if (isNaN(birth.getTime()) || birth < min || birth > max) {
            return 'Birthdate must be a valid date.';
          }
        }
        break;
        
      case 'studentId':
        if (value) {
          // Check for duplicate student ID
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

  /**
   * Validates the entire form
   * @returns {Object} - Object containing field errors
   */
  const validateForm = () => {
    const errors = {};
    Object.keys(form).forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) errors[key] = err;
    });
    return errors;
  };

  // Don't render if modal is not open
  if (!open) return null;

  /**
   * Handles form field changes with validation
   * @param {Event} e - Change event
   */
  const handleChange = e => {
    const { name, value } = e.target;
    let newValue = value;
    
    // Format contact number if needed
    if (name === 'contactNumber') {
      newValue = formatContactNumber(value);
    }
    
    // Handle class selection with additional data
    if (name === 'classId') {
      const selectedClass = allClasses.find(cls => cls.id === value);
      console.log('Selected class:', selectedClass);
      setForm(f => ({
        ...f,
        [name]: newValue,
        firestoreId: selectedClass ? selectedClass.firestoreId : '',
        period: selectedClass ? selectedClass.period : '',
      }));
    } else {
      setForm(f => ({ ...f, [name]: newValue }));
    }
    
    // Validate field if form has been submitted
    if (submitted) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, newValue) }));
    }
  };

  /**
   * Handles input changes without special formatting
   * @param {Event} e - Change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  /**
   * Handles form submission with validation
   * @param {Event} e - Submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    let errors = validateForm();

    // Additional birthdate validation
    if (!birthdate) {
      errors.birthdate = 'Birthdate is required.';
    } else {
      const now = new Date();
      const minAge = 10;
      const tenYearsAgo = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
      if (birthdate > tenYearsAgo) {
        errors.birthdate = 'Student must be at least 10 years old.';
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    // Format birthdate as yyyy-MM-dd for storage
    const formattedBirthdate = birthdate ? format(birthdate, 'yyyy-MM-dd') : '';
    onSubmit({ 
      ...form, 
      birthdate: formattedBirthdate, 
      studentId, 
      firestoreId: form.firestoreId, 
      period: form.period 
    });
  };

  /**
   * Handles overlay click to close modal
   * @param {Event} e - Click event
   */
  const handleOverlayClick = e => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="student-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      {/* Responsive CSS styles */}
      <style>{`
        @media (max-width: 900px) {
          .modal-responsive { max-width: 99vw !important; padding: 0 !important; }
        }
        @media (max-width: 600px) {
          .modal-responsive { max-width: 100vw !important; border-radius: 0 !important; }
          .modal-header, .modal-content { padding-left: 1rem !important; padding-right: 1rem !important; }
        }
        @media (max-width: 600px) {
          .modal-content form > div[style*='grid'] { grid-template-columns: 1fr !important; gap: 0.5rem !important; }
        }
      ` + placeholderStyle}</style>
      
      {/* Modal Container */}
      <div className="modal-responsive" style={{
        background: '#fff',
        borderRadius: '16px',
        padding: 0,
        width: '95vw',
        maxWidth: '800px',
        maxHeight: '98vh',
        minHeight: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: '2px solid #212529',
        boxShadow: '0 10px 0 0 #181c22, 0 8px 24px 0 rgba(33,37,41,0.10)'
      }}>
        {/* Modal Header */}
        <div className="modal-header" style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 2,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          padding: '2rem 2rem 0.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#212529' }}>
            {mode === 'edit' ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#495057',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = '#f1f3f5'}
            onMouseLeave={e => e.target.style.background = 'none'}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        {/* Modal Content (scrollable if needed) */}
        <div className="modal-content" style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0 1.2rem 1.2rem 1.2rem',
          minHeight: 0,
          maxHeight: 'calc(98vh - 2.5rem)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'flex-start', justifyContent: 'center' }}>
            {/* Profile Image Upload Section */}
            <div style={{ minWidth: 120, maxWidth: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 0 }}>
              <StudentImageUpload
                studentId={form.id || 'new'}
                currentImage={form.profileImage}
                onImageUpdate={(imageData) => {
                  setForm(prev => ({ ...prev, profileImage: imageData.optimizedUrl }));
                }}
                style={{ width: 100, height: 100 }}
              />
            </div>
            
            {/* Form Fields Section */}
            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem 1rem',
                alignItems: 'start',
                marginBottom: '0.2rem',
              }}>
                {/* Student ID Field (Auto-generated, Read-only) */}
                <div style={{ gridColumn: '1/2' }}>
                  <label style={{ display: 'block', marginBottom: '0.15rem', fontWeight: '600', color: '#495057', fontSize: '1rem' }}>
                    Student ID *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f4f6f8',
                    border: '1.5px solid #bfc3c9',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    transition: 'border 0.2s'
                  }}>
                    <input
                      type="text"
                      value={studentIdLoading ? 'Generating...' : studentId}
                      className="login-input"
                      style={{ ...studentInputStyle, background: '#f4f6f8', color: '#888', fontWeight: 600, cursor: 'not-allowed', height: '36px', fontSize: '0.98rem' }}
                      readOnly
                      disabled
                      tabIndex={-1}
                      aria-label="Student ID (auto-generated)"
                    />
                  </div>
                </div>
                
                {/* Email Field */}
                <div style={{ gridColumn: '2/3' }}>
                  <label style={{ display: 'block', marginBottom: '0.15rem', fontWeight: '600', color: '#495057', fontSize: '1rem' }}>
                    Email *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f4f6f8',
                    border: '1.5px solid #bfc3c9',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    transition: 'border 0.2s'
                  }}>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      style={{ ...studentInputStyle, height: '36px', fontSize: '0.98rem' }}
                      placeholder="Email Address"
                      required
                    />
                  </div>
                  {submitted && fieldErrors.email && (
                    <div style={{ color: '#e53935', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                      {fieldErrors.email}
                    </div>
                  )}
                </div>
                
                {/* First Name Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.15rem', fontWeight: '600', color: '#495057', fontSize: '1rem' }}>
                    First Name *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f4f6f8',
                    border: '1.5px solid #bfc3c9',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    transition: 'border 0.2s'
                  }}>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      style={{ ...studentInputStyle, height: '36px', fontSize: '0.98rem' }}
                      placeholder="First Name"
                      required
                    />
                  </div>
                  {submitted && fieldErrors.firstName && (
                    <div style={{ color: '#e53935', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                      {fieldErrors.firstName}
                    </div>
                  )}
                </div>
                
                {/* Last Name Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.15rem', fontWeight: '600', color: '#495057', fontSize: '1rem' }}>
                    Last Name *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f4f6f8',
                    border: '1.5px solid #bfc3c9',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    transition: 'border 0.2s'
                  }}>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      style={{ ...studentInputStyle, height: '36px', fontSize: '0.98rem' }}
                      placeholder="Last Name"
                      required
                    />
                  </div>
                  {submitted && fieldErrors.lastName && (
                    <div style={{ color: '#e53935', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                      {fieldErrors.lastName}
                    </div>
                  )}
                </div>
                
                {/* Contact Number Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.15rem', fontWeight: '600', color: '#495057', fontSize: '1rem' }}>
                    Contact Number
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f4f6f8',
                    border: '1.5px solid #bfc3c9',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    transition: 'border 0.2s'
                  }}>
                    <input
                      type="text"
                      name="contactNumber"
                      value={form.contactNumber}
                      onChange={handleChange}
                      style={{ ...studentInputStyle, height: '36px', fontSize: '0.98rem' }}
                      placeholder="e.g., 0970-983-6509"
                    />
                  </div>
                  {submitted && fieldErrors.contactNumber && (
                    <div style={{ color: '#e53935', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                      {fieldErrors.contactNumber}
                    </div>
                  )}
                </div>
                
                {/* Address Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.15rem', fontWeight: '600', color: '#495057', fontSize: '1rem' }}>
                    Address
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f4f6f8',
                    border: '1.5px solid #bfc3c9',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    transition: 'border 0.2s'
                  }}>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      style={{ ...studentInputStyle, height: '36px', fontSize: '0.98rem' }}
                      placeholder="Complete Address"
                    />
                  </div>
                </div>
                
                {/* Birthdate Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.15rem', fontWeight: '600', color: '#495057', fontSize: '1rem' }}>
                    Birthdate *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f4f6f8',
                    border: '1.5px solid #bfc3c9',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    transition: 'border 0.2s'
                  }}>
                    <DatePicker
                      selected={birthdate}
                      onChange={date => setBirthdate(date)}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select birthdate"
                      className="login-input"
                      maxDate={new Date()}
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      isClearable
                      style={{ height: '36px', fontSize: '0.98rem' }}
                    />
                  </div>
                  {submitted && fieldErrors.birthdate && (
                    <div style={{ color: '#e53935', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                      {fieldErrors.birthdate}
                    </div>
                  )}
                </div>
                
                {/* Gender Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.15rem', fontWeight: '600', color: '#495057', fontSize: '1rem' }}>
                    Gender
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f4f6f8',
                    border: '1.5px solid #bfc3c9',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    transition: 'border 0.2s',
                    position: 'relative'
                  }}>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      style={{ ...studentSelectStyle, height: '36px', fontSize: '0.98rem' }}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <div style={{
                      position: 'absolute',
                      right: '1rem',
                      pointerEvents: 'none',
                      color: '#495057'
                    }}>
                      ▼
                    </div>
                  </div>
                </div>
                
                {/* Grade Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.15rem', fontWeight: '600', color: '#495057', fontSize: '1rem' }}>
                    Grade *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f4f6f8',
                    border: '1.5px solid #bfc3c9',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    transition: 'border 0.2s',
                    position: 'relative'
                  }}>
                    <select
                      name="grade"
                      value={form.grade}
                      onChange={handleChange}
                      style={studentInputStyle}
                      required
                    >
                      <option value="">Select Grade</option>
                      {staticGrades.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                    <div style={{
                      position: 'absolute',
                      right: '1rem',
                      pointerEvents: 'none',
                      color: '#495057'
                    }}>
                      ▼
                    </div>
                  </div>
                  {loadingGrades && (
                    <div style={{ color: '#8a8f98', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                      Loading grades...
                    </div>
                  )}
                </div>
                
                {/* Section Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.15rem', fontWeight: '600', color: '#495057', fontSize: '1rem' }}>
                    Section *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f4f6f8',
                    border: '1.5px solid #bfc3c9',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    transition: 'border 0.2s',
                    position: 'relative'
                  }}>
                    <select
                      name="classId"
                      value={form.classId}
                      onChange={handleChange}
                      style={{ ...studentSelectStyle, height: '36px', fontSize: '0.98rem' }}
                      required
                      disabled={!form.grade}
                    >
                      <option value="">{form.grade ? 'Select Section' : 'Select Grade First'}</option>
                      {form.grade &&
                        allClasses
                          .filter(cls => String(cls.classGrade) === String(form.grade))
                          .map(cls => {
                            const used = classStudentCounts[cls.id] || 0;
                            const remaining = (cls.maxStudents || 0) - used;
                            const isFull = remaining <= 0;
                            return (
                              <option
                                key={cls.id}
                                value={cls.id}
                                disabled={isFull}
                                style={isFull ? { background: '#ffeaea', color: '#b91c1c', fontWeight: 600 } : {}}
                              >
                                {cls.classSection} ({remaining} slots left){isFull ? ' - No slots available' : ''}
                              </option>
                            );
                          })}
                    </select>
                    <div style={{
                      position: 'absolute',
                      right: '1rem',
                      pointerEvents: 'none',
                      color: '#495057'
                    }}>
                      ▼
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '0.3rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#d3d6db' : '#868e96',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '2rem',
                    padding: '0.5rem 0',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
                    width: '200px',
                    minWidth: '120px',
                    maxWidth: '220px',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.background = '#495057';
                      e.target.style.boxShadow = '0 6px 0 0 #181c22';
                      e.target.style.transform = 'translateY(-2px) scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.background = '#868e96';
                      e.target.style.boxShadow = 'none';
                      e.target.style.transform = 'none';
                    }
                  }}
                >
                  {loading ? 'Saving...' : (mode === 'edit' ? 'Update Student' : 'Add Student')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentModal; 