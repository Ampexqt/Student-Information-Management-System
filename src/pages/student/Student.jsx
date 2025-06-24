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
import StudentModal from '../../components/modals/StudentModal';
import { DeleteModal } from '../../components/modals/logoutModal';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { FaEye } from 'react-icons/fa';
import { FaSearch } from 'react-icons/fa';
import ViewStudentModal from '../../components/modals/viewStudentModals';
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
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        // Increment usedSlots in the class
        if (form.classId) {
          const classRef = doc(db, 'Class', form.classId);
          await updateDoc(classRef, {
            usedSlots: increment(1)
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
      await deleteDoc(doc(db, 'students', deleteId));
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

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );
  // Reset to page 1 if search/filter changes and current page is out of range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [searchQuery, filteredStudents.length, totalPages]);

  return (
    <>
      <h2 className="student-page-title"><span className="dashboard-highlight">Student Management</span></h2>
      <button onClick={openAddModal} className="student-add-btn">Add</button>
      {/* Minimalist Search Bar - Improved Visibility and Contrast */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '8px 0 4px 0',
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
      />
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
            ) : filteredStudents.length === 0 ? (
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
                      const cls = classes.find(c => c.id === student.classId);
                      if (!cls) return student.classId;
                      return `Grade ${cls.classGrade} - Section ${cls.classSection}`;
                    })()}
                  </td>
                  <td>
                    {(() => {
                      const cls = classes.find(c => c.id === student.classId);
                      if (!cls) return '';
                      const classroom = classrooms.find(r => r.id === cls.classroomId);
                      return classroom ? `${classroom.buildingName}, Room ${classroom.roomNumber}` : '';
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
      {/* Pagination Controls */}
      {filteredStudents.length > 3 && (
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