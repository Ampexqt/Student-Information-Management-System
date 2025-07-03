/**
 * Student Management Component
 * 
 * This component provides comprehensive student management functionality for the
 * Student Information Management System. It handles CRUD operations for students,
 * real-time data synchronization, search, filtering, sorting, and pagination.
 * 
 * Key Features:
 * - Real-time student data synchronization with Firebase
 * - Add, edit, delete, and view student operations
 * - Search functionality (Student ID, first name, last name)
 * - Advanced sorting and filtering options
 * - Pagination for large datasets
 * - Class and classroom integration
 * - Student count tracking per class
 * - Responsive table design
 * - Modal-based forms and confirmations
 * 
 * Data Management:
 * - Firebase Firestore integration
 * - Real-time updates using onSnapshot
 * - Optimistic updates for better UX
 * - Error handling and validation
 * 
 * UI Components:
 * - Student table with sortable columns
 * - Search and filter controls
 * - Add/Edit/Delete action buttons
 * - Pagination controls
 * - Loading states and empty states
 * - Modal dialogs for forms and confirmations
 */

import React, { useEffect, useState } from 'react';
import { db } from '../../utils/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  increment,
  getDoc
} from 'firebase/firestore';
import StudentModal from '../../components/common/modals/StudentModal';
import { DeleteModal } from '../../components/common/modals/logoutModal';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { FaEye } from 'react-icons/fa';
import { FaSearch, FaFilter } from 'react-icons/fa';
import ViewStudentModal from '../../components/common/modals/viewStudentModals';
import './Student.css';

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
};

/**
 * Main Student management component
 * Handles all student-related operations and UI
 */
const Student = () => {
  // State management for student data and UI
  const [students, setStudents] = useState([]); // All students data
  const [modalOpen, setModalOpen] = useState(false); // Modal visibility
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit' mode
  const [modalData, setModalData] = useState(null); // Data for edit mode
  const [loading, setLoading] = useState(false); // Loading state for operations
  const [editingId, setEditingId] = useState(null); // ID of student being edited
  const [classes, setClasses] = useState([]); // Available classes
  const [classrooms, setClassrooms] = useState([]); // Classroom data
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Delete confirmation modal
  const [deleteId, setDeleteId] = useState(null); // ID of student to delete
  const [classStudentCounts, setClassStudentCounts] = useState({}); // Student count per class
  const [tableLoading, setTableLoading] = useState(true); // Table loading state
  const [viewModalOpen, setViewModalOpen] = useState(false); // View modal visibility
  const [viewStudent, setViewStudent] = useState(null); // Student data for view modal
  
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState(''); // Search input value
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const studentsPerPage = 3; // Students per page for pagination
  
  // Sorting state
  const [showSortDropdown, setShowSortDropdown] = useState(false); // Sort dropdown visibility
  const [sortField, setSortField] = useState(''); // Field to sort by
  const [sortOrder, setSortOrder] = useState('asc'); // Sort order (asc/desc)
  
  // Available sorting options
  const sortOptions = [
    { value: 'studentId', label: 'Student ID' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'class', label: 'Class' },
    { value: 'room', label: 'Room' },
  ];

  /**
   * Effect hook to reset modal and editing state on component mount
   * Ensures clean state when component is first loaded
   */
  useEffect(() => {
    setModalOpen(false);
    setModalMode('add');
    setModalData(null);
    setEditingId(null);
    setShowDeleteModal(false);
    setDeleteId(null);
    setViewModalOpen(false);
    setViewStudent(null);
  }, []);

  /**
   * Effect hook for real-time student data synchronization
   * Listens to changes in the students collection and updates state accordingly
   * Also fetches class data and calculates student counts per class
   */
  useEffect(() => {
    setTableLoading(true);
    
    // Listen to students collection in real-time
    const unsubStudents = onSnapshot(collection(db, 'students'), async (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      
      // Fetch all classes and count students per class
      const classSnap = await getDocs(collection(db, 'Class'));
      const allClasses = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate student count per class
      const classCounts = {};
      data.forEach(stu => {
        if (stu.classId) {
          classCounts[stu.classId] = (classCounts[stu.classId] || 0) + 1;
        }
      });
      setClassStudentCounts(classCounts);
      
      // Filter classes with available slots and add slot information
      const availableClasses = allClasses.map(cls => {
        const used = classCounts[cls.id] || 0;
        const max = parseInt(cls.maxStudents, 10) || 0;
        return {
          ...cls,
          usedSlots: used,
          maxSlots: max,
          available: max > used,
        };
      }).filter(cls => cls.available);
      
      setClasses(availableClasses);
      setTableLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubStudents();
  }, []);

  /**
   * Effect hook to fetch classroom data
   * Fetches all classrooms for mapping student room information
   */
  useEffect(() => {
    async function fetchClassrooms() {
      const snap = await getDocs(collection(db, 'Classroom'));
      setClassrooms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchClassrooms();
  }, []);

  /**
   * Opens the add student modal
   * Resets form data and sets modal to add mode
   */
  const openAddModal = () => {
    setModalMode('add');
    setModalData(null);
    setEditingId(null);
    setModalOpen(true);
  };

  /**
   * Opens the edit student modal
   * Sets form data with existing student information
   * @param {Object} student - Student object to edit
   */
  const openEditModal = (student) => {
    setModalMode('edit');
    setModalData(student);
    setEditingId(student.id);
    setModalOpen(true);
  };

  /**
   * Closes the student modal
   * Resets modal state and form data
   */
  const closeModal = () => {
    setModalOpen(false);
    setModalData(null);
    setEditingId(null);
  };

  /**
   * Handles form submission for add/edit operations
   * Creates or updates student data in Firebase
   * @param {Object} form - Form data from modal
   */
  const handleModalSubmit = async (form) => {
    setLoading(true);
    try {
      if (modalMode === 'edit' && editingId) {
        // Update existing student
        await updateDoc(doc(db, 'students', editingId), {
          ...form,
          updatedAt: new Date(),
        });
      } else {
        // Add new student
        await addDoc(collection(db, 'students'), {
          ...form,
          firestoreId: form.firestoreId,
          period: form.period,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Increment used slots in the classroom period
        if (form.firestoreId && form.period) {
          const classroomRef = doc(db, 'Classroom', form.firestoreId);
          await updateDoc(classroomRef, {
            [`${form.period}.usedSlots`]: increment(1)
          });
        }
      }
      closeModal();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  /**
   * Initiates delete process for a student
   * Shows confirmation modal before deletion
   * @param {string} id - Student ID to delete
   */
  const handleDelete = async id => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  /**
   * Confirms and executes student deletion
   * Deletes student and updates classroom slot count
   */
  const confirmDelete = async () => {
    setLoading(true);
    try {
      // Find the student to be deleted
      const student = students.find(s => s.id === deleteId);
      let firestoreId = student?.firestoreId;
      let period = student?.period;
      
      // Delete the student document
      await deleteDoc(doc(db, 'students', deleteId));
      
      // Decrement used slots in the classroom period if possible
      if (firestoreId && period) {
        const classroomRef = doc(db, 'Classroom', firestoreId);
        const classroomSnap = await getDoc(classroomRef);
        if (classroomSnap.exists()) {
          await updateDoc(classroomRef, {
            [`${period}.usedSlots`]: increment(-1)
          });
        }
        // If classroom doesn't exist, do nothing
      }
      
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      // Handle specific error for missing classroom document
      if (err.message && err.message.includes('No document to update')) {
        console.warn('Classroom document missing, but student deleted successfully.');
      } else {
        alert('Error: ' + err.message);
      }
    }
    setLoading(false);
  };

  /**
   * Opens the view student modal
   * @param {Object} student - Student object to view
   */
  const openViewModal = (student) => {
    setViewStudent(student);
    setViewModalOpen(true);
  };

  /**
   * Closes the view student modal
   */
  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewStudent(null);
  };

  // Filter students by search query (Student ID, first name, last name)
  const filteredStudents = students.filter(student => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (student.studentId && student.studentId.toLowerCase().includes(query)) ||
      (student.firstName && student.firstName.toLowerCase().includes(query)) ||
      (student.lastName && student.lastName.toLowerCase().includes(query))
    );
  });

  // Sorting logic for filtered students
  let sortedStudents = [...filteredStudents];
  if (sortField) {
    sortedStudents.sort((a, b) => {
      let aValue = '';
      let bValue = '';
      
      if (sortField === 'class') {
        // Sort by class ID
        aValue = a.classId || '';
        bValue = b.classId || '';
      } else if (sortField === 'room') {
        // Sort by room information
        const aRoom = classrooms.find(r => r.id === a.firestoreId);
        const bRoom = classrooms.find(r => r.id === b.firestoreId);
        aValue = aRoom ? `${aRoom.buildingName}, ${aRoom.roomNumber}, ${aRoom.floor}` : '';
        bValue = bRoom ? `${bRoom.buildingName}, ${bRoom.roomNumber}, ${bRoom.floor}` : '';
      } else {
        // Sort by direct field value
        aValue = (a[sortField] || '').toString();
        bValue = (b[sortField] || '').toString();
      }
      
      const cmp = aValue.localeCompare(bValue, undefined, { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }

  // Pagination logic
  const totalPages = Math.ceil(sortedStudents.length / studentsPerPage);
  const paginatedStudents = sortedStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );
  
  // Reset to first page if current page is invalid
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [searchQuery, sortedStudents.length, totalPages]);

  return (
    <>
      {/* Page Title */}
      <h2 className="student-page-title">
        <span className="dashboard-highlight">Student Management</span>
      </h2>
      
      {/* Action Bar with Add Button and Search/Filter Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: '20px', 
        flexWrap: 'wrap' 
      }}>
        {/* Add Student Button */}
        <button onClick={openAddModal} className="student-add-btn">Add</button>
        
        {/* Search and Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          {/* Search Input */}
          <div className="student-search-container" style={{
            display: 'flex',
            alignItems: 'center',
            maxWidth: 340,
            background: '#e5e7eb',
            borderRadius: 18,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            padding: '2px 10px'
          }}>
            <FaSearch style={{ color: '#555', marginRight: 8, fontSize: '1.2rem' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Student ID or Name..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                borderRadius: 18,
                padding: '8px 0',
                fontSize: '1rem',
                outline: 'none',
                color: '#222',
                boxShadow: 'none',
                transition: 'background 0.2s',
                fontWeight: 500,
                letterSpacing: '0.01em',
              }}
            />
          </div>
          
          {/* Filter/Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSortDropdown(v => !v)}
              style={{
                background: '#e5e7eb',
                border: 'none',
                borderRadius: '50%',
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 18,
                marginLeft: 2
              }}
              title="Sort/Filter"
            >
              <FaFilter />
            </button>
            
            {/* Sort Options Dropdown */}
            {showSortDropdown && (
              <div style={{
                position: 'absolute',
                top: 44,
                right: 0,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                zIndex: 100,
                minWidth: 180,
                padding: '10px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 0
              }}>
                {/* Sort Field Options */}
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortField(opt.value);
                      setShowSortDropdown(false);
                    }}
                    style={{
                      background: sortField === opt.value ? '#e5e7eb' : 'none',
                      border: 'none',
                      textAlign: 'left',
                      padding: '10px 18px',
                      fontSize: '1rem',
                      color: '#222',
                      fontWeight: 500,
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
                
                {/* Separator */}
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '6px 0' }} />
                
                {/* Sort Order Toggle */}
                <button
                  onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    padding: '10px 18px',
                    fontSize: '1rem',
                    color: '#222',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Order: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Student Modal for Add/Edit */}
      <StudentModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        initialData={modalData}
        loading={loading}
        mode={modalMode}
        classes={classes}
        classStudentCounts={classStudentCounts}
        students={students}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Student"
        message={<>Are you sure you want to delete this student?</>}
        confirmText="Delete"
        confirmClass="logout-modal-logout"
      />
      
      {/* View Student Modal */}
      <ViewStudentModal
        open={viewModalOpen}
        onClose={closeViewModal}
        student={viewStudent}
        classes={classes}
        classrooms={classrooms}
      />
      
      {/* Student Data Table */}
      <div className="table-responsive">
        <div className="student-table-wrapper" style={{ marginTop: 8 }}>
          <table className="student-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Birthdate</th>
                <th>Gender</th>
                <th>Class</th>
                <th>Room</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                // Loading state
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24 }}>Loading...</td></tr>
              ) : sortedStudents.length === 0 ? (
                // Empty state
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24 }}>No students found.</td></tr>
              ) : (
                // Student data rows
                paginatedStudents.map(student => (
                  <tr key={student.id}>
                    <td>{student.studentId || '-'}</td>
                    <td>{student.firstName}</td>
                    <td>{student.lastName}</td>
                    <td>{student.email}</td>
                    <td>{student.contactNumber}</td>
                    <td>{student.address}</td>
                    <td>{student.birthdate}</td>
                    <td>{student.gender}</td>
                    <td>
                      {/* Class information with shift highlighting */}
                      {(() => {
                        const classroom = classrooms.find(r => r.id === student.firestoreId);
                        if (!classroom) return student.classId;
                        const periodData = classroom[student.period];
                        if (!periodData) return '';
                        
                        // Highlight shift with color coding
                        const shiftLabel = student.period.charAt(0).toUpperCase() + student.period.slice(1);
                        const shiftColor = student.period === 'morning' ? '#f7fcbf' : '#c7d2fe';
                        const shiftTextColor = student.period === 'morning' ? '#222' : '#1e40af';
                        
                        return (
                          <span>
                            {`Grade ${periodData.grade.replace('Grade ', '')} - ${periodData.section} `}
                            <span style={{
                              background: shiftColor,
                              color: shiftTextColor,
                              fontWeight: 'bold',
                              borderRadius: 4,
                              padding: '2px 8px',
                              marginLeft: 6,
                              fontSize: '0.98em',
                            }}>{shiftLabel}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      {/* Room information */}
                      {(() => {
                        const classroom = classrooms.find(r => r.id === student.firestoreId);
                        if (!classroom) return '';
                        return `${classroom.buildingName}, ${classroom.roomNumber}, ${classroom.floor}`;
                      })()}
                    </td>
                    <td>
                      {/* Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {/* View button */}
                        <button
                          onClick={() => openViewModal(student)}
                          className="student-view-btn"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#10b981',
                            fontSize: '1.7rem',
                            width: '2.2rem',
                            height: '2.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            margin: 0
                          }}
                          title="View"
                        >
                          <FaEye />
                        </button>
                        
                        {/* Edit button */}
                        <button
                          onClick={() => openEditModal(student)}
                          className="student-edit-btn"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#2563eb',
                            fontSize: '1.7rem',
                            width: '2.2rem',
                            height: '2.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            margin: 0
                          }}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="student-delete-btn"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            fontSize: '1.7rem',
                            width: '2.2rem',
                            height: '2.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            margin: 0
                          }}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Controls */}
      {sortedStudents.length > 3 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >Prev</button>
          
          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`pagination-btn${page === currentPage ? ' active' : ''}`}
            >{page}</button>
          ))}
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >Next</button>
        </div>
      )}
    </>
  );
};

export default Student; 