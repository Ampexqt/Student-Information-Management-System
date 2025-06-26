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
  increment
} from 'firebase/firestore';
import StudentModal from '../../components/common/modals/StudentModal';
import { DeleteModal } from '../../components/common/modals/logoutModal';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { FaEye } from 'react-icons/fa';
import { FaSearch, FaFilter } from 'react-icons/fa';
import ViewStudentModal from '../../components/common/modals/viewStudentModals';
import './Student.css';

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

const Student = () => {
  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [classStudentCounts, setClassStudentCounts] = useState({});
  const [tableLoading, setTableLoading] = useState(true); // New loading state for table
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 3;
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const sortOptions = [
    { value: 'studentId', label: 'Student ID' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'class', label: 'Class' },
    { value: 'room', label: 'Room' },
  ];

  // Reset modal and editing state on mount
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

  // Real-time fetch students and classes in a single effect
  useEffect(() => {
    setTableLoading(true);
    // Listen to students in real-time
    const unsubStudents = onSnapshot(collection(db, 'students'), async (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      // Fetch all classes and count students per class
      const classSnap = await getDocs(collection(db, 'Class'));
      const allClasses = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Count students per class
      const classCounts = {};
      data.forEach(stu => {
        if (stu.classId) {
          classCounts[stu.classId] = (classCounts[stu.classId] || 0) + 1;
        }
      });
      setClassStudentCounts(classCounts);
      // Filter classes with available slots and add slot info
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
    return () => unsubStudents();
  }, []);

  // Fetch classrooms for mapping
  useEffect(() => {
    async function fetchClassrooms() {
      const snap = await getDocs(collection(db, 'Classroom'));
      setClassrooms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchClassrooms();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setModalData(null);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setModalMode('edit');
    setModalData(student);
    setEditingId(student.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData(null);
    setEditingId(null);
  };

  const handleModalSubmit = async (form) => {
    setLoading(true);
    try {
      if (modalMode === 'edit' && editingId) {
        await updateDoc(doc(db, 'students', editingId), {
          ...form,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, 'students'), {
          ...form,
          firestoreId: form.firestoreId,
          period: form.period,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        // Increment usedSlots in the correct classroom period
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

  const handleDelete = async id => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      // Find the student to be deleted
      const student = students.find(s => s.id === deleteId);
      let firestoreId = student?.firestoreId;
      let period = student?.period;
      // Delete the student
      await deleteDoc(doc(db, 'students', deleteId));
      // Decrement usedSlots in the correct classroom period if possible
      if (firestoreId && period) {
        const classroomRef = doc(db, 'Classroom', firestoreId);
        await updateDoc(classroomRef, {
          [`${period}.usedSlots`]: increment(-1)
        });
      }
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const openViewModal = (student) => {
    setViewStudent(student);
    setViewModalOpen(true);
  };

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

  // Sorting logic
  let sortedStudents = [...filteredStudents];
  if (sortField) {
    sortedStudents.sort((a, b) => {
      let aValue = '';
      let bValue = '';
      if (sortField === 'class') {
        aValue = a.classId || '';
        bValue = b.classId || '';
      } else if (sortField === 'room') {
        const aRoom = classrooms.find(r => r.id === a.firestoreId);
        const bRoom = classrooms.find(r => r.id === b.firestoreId);
        aValue = aRoom ? `${aRoom.buildingName}, ${aRoom.roomNumber}, ${aRoom.floor}` : '';
        bValue = bRoom ? `${bRoom.buildingName}, ${bRoom.roomNumber}, ${bRoom.floor}` : '';
      } else {
        aValue = (a[sortField] || '').toString();
        bValue = (b[sortField] || '').toString();
      }
      const cmp = aValue.localeCompare(bValue, undefined, { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }

  // Pagination logic (use sortedStudents)
  const totalPages = Math.ceil(sortedStudents.length / studentsPerPage);
  const paginatedStudents = sortedStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [searchQuery, sortedStudents.length, totalPages]);

  return (
    <>
      <h2 className="student-page-title"><span className="dashboard-highlight">Student Management</span></h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={openAddModal} className="student-add-btn">Add</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
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
          {/* Filter/Sort Icon and Dropdown */}
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
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '6px 0' }} />
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
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Student"
        message={<>Are you sure you want to delete this student?</>}
        confirmText="Delete"
        confirmClass="logout-modal-logout"
      />
      <ViewStudentModal
        open={viewModalOpen}
        onClose={closeViewModal}
        student={viewStudent}
        classes={classes}
        classrooms={classrooms}
      />
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
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24 }}>Loading...</td></tr>
              ) : sortedStudents.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24 }}>No students found.</td></tr>
              ) : (
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
                      {(() => {
                        const classroom = classrooms.find(r => r.id === student.firestoreId);
                        if (!classroom) return student.classId;
                        const periodData = classroom[student.period];
                        if (!periodData) return '';
                        // Highlight shift
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
                      {(() => {
                        const classroom = classrooms.find(r => r.id === student.firestoreId);
                        if (!classroom) return '';
                        // Use root-level fields for room info
                        return `${classroom.buildingName}, ${classroom.roomNumber}, ${classroom.floor}`;
                      })()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
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