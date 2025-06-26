import React, { useEffect, useState } from 'react';
import { db } from '../../utils/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import ClassroomModal from '../../components/common/modals/ClassroomModal';
import ViewClassroomModal from '../../components/common/modals/viewClassroomModal';
import '../student/Student.css';
import { DeleteModal } from '../../components/common/modals/logoutModal';
import { FaEdit, FaTrash, FaEye, FaSearch, FaFilter } from 'react-icons/fa';

const initialForm = {
  buildingName: '',
  floor: '',
  roomNumber: '',
};

const Classroom = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewClassroom, setViewClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterField, setFilterField] = useState('');
  const [filterOrder, setFilterOrder] = useState('asc');
  const classroomsPerPage = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const filterOptions = [
    { value: 'roomNumber', label: 'Room Number' },
    { value: 'floor', label: 'Floor' },
    { value: 'buildingName', label: 'Building Name' },
  ];

  // Real-time fetch classrooms
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'Classroom'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClassrooms(data);
    });
    return () => unsub();
  }, []);

  // One-time fix: Ensure all classrooms have both 'morning' and 'afternoon' fields
  useEffect(() => {
    async function fixClassroomDocs() {
      const snap = await getDocs(collection(db, 'Classroom'));
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        let needsUpdate = false;
        const updateObj = {};
        if (!data.morning) {
          updateObj.morning = { grade: '', section: '', maxStudents: '' };
          needsUpdate = true;
        }
        if (!data.afternoon) {
          updateObj.afternoon = { grade: '', section: '', maxStudents: '' };
          needsUpdate = true;
        }
        if (needsUpdate) {
          await updateDoc(doc(db, 'Classroom', docSnap.id), updateObj);
          console.log('Fixed classroom doc:', docSnap.id, updateObj);
        }
      }
    }
    fixClassroomDocs();
  }, []);

  // Real-time fetch students for classroom view modal
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'students'), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setModalData(null);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (classroom) => {
    setModalMode('edit');
    setModalData(classroom);
    setEditingId(classroom.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData(null);
    setEditingId(null);
  };

  const openViewModal = (classroom) => {
    setViewClassroom(classroom);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewClassroom(null);
  };

  const handleModalSubmit = async (form) => {
    setLoading(true);
    setErrorMsg('');
    // Prevent duplicate buildingName + floor + roomNumber
    const duplicate = classrooms.find(c =>
      c.buildingName.trim().toLowerCase() === form.buildingName.trim().toLowerCase() &&
      c.floor.trim().toLowerCase() === form.floor.trim().toLowerCase() &&
      c.roomNumber.trim().toLowerCase() === form.roomNumber.trim().toLowerCase() &&
      (modalMode !== 'edit' || c.id !== editingId)
    );
    if (duplicate) {
      setErrorMsg('A classroom with this building, floor, and room number already exists.');
      setLoading(false);
      return;
    }
    try {
      if (modalMode === 'edit' && editingId) {
        await updateDoc(doc(db, 'Classroom', editingId), {
          ...form,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, 'Classroom'), {
          ...form,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
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
      await deleteDoc(doc(db, 'Classroom', deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  // Filtering
  const filteredClassrooms = classrooms.filter(room => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (room.roomNumber && room.roomNumber.toLowerCase().includes(query)) ||
      (room.floor && room.floor.toLowerCase().includes(query)) ||
      (room.buildingName && room.buildingName.toLowerCase().includes(query))
    );
  });

  // Sorting
  const sortFields = {
    roomNumber: (a, b) => (a.roomNumber || '').localeCompare(b.roomNumber || ''),
    floor: (a, b) => (a.floor || '').localeCompare(b.floor || ''),
    buildingName: (a, b) => (a.buildingName || '').localeCompare(b.buildingName || ''),
  };
  let sortedClassrooms = [...filteredClassrooms];
  if (filterField && sortFields[filterField]) {
    sortedClassrooms.sort((a, b) => {
      const cmp = sortFields[filterField](a, b);
      return filterOrder === 'asc' ? cmp : -cmp;
    });
  }

  // Pagination
  const totalPages = Math.ceil(sortedClassrooms.length / classroomsPerPage);
  const paginatedClassrooms = sortedClassrooms.slice(
    (currentPage - 1) * classroomsPerPage,
    currentPage * classroomsPerPage
  );
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [sortedClassrooms.length, totalPages]);

  return (
    <div className="student-page-container" style={{ width: '100%' }}>
      <h2 className="student-page-title" style={{ textAlign: 'left', marginTop: '2.5rem', marginBottom: '0.5rem', width: '100%' }}>
        <span className="dashboard-highlight">Classroom Management</span>
      </h2>
      {/* Controls above table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={openAddModal} className="student-add-btn">Add</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          <button
            onClick={() => setShowFilterDropdown(v => !v)}
            style={{ background: '#e5e7eb', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, marginLeft: 2 }}
            title="Sort/Filter"
          >
            <FaFilter />
          </button>
          {showFilterDropdown && (
            <div style={{ position: 'absolute', top: 44, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 100, minWidth: 180, padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFilterField(opt.value); setShowFilterDropdown(false); }}
                  style={{ background: filterField === opt.value ? '#e5e7eb' : 'none', border: 'none', textAlign: 'left', padding: '10px 18px', fontSize: '1rem', color: '#222', fontWeight: 500, cursor: 'pointer', width: '100%' }}
                >
                  {opt.label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid #e5e7eb', margin: '6px 0' }} />
              <button
                onClick={() => setFilterOrder(o => o === 'asc' ? 'desc' : 'asc')}
                style={{ background: 'none', border: 'none', textAlign: 'left', padding: '10px 18px', fontSize: '1rem', color: '#222', fontWeight: 500, cursor: 'pointer', width: '100%' }}
              >
                Order: {filterOrder === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
          )}
        </div>
      </div>
      <ClassroomModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        initialData={modalData}
        loading={loading}
        mode={modalMode}
        classrooms={classrooms}
      />
      <ViewClassroomModal
        open={viewModalOpen}
        onClose={closeViewModal}
        data={viewClassroom}
        students={students}
      />
      {errorMsg && (
        <div style={{ color: '#fff', background: '#ff4d4f', margin: '12px 0', borderRadius: 8, padding: '12px 16px', fontWeight: 'bold', fontSize: '1rem', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Classroom"
        message={<>Are you sure you want to delete this classroom?</>}
        confirmText="Delete"
        confirmClass="logout-modal-logout"
      />
      <div className="table-responsive">
        <div className="student-table-wrapper" style={{ margin: '0 auto', width: '90%', maxWidth: '1100px' }}>
          <table className="student-table" style={{ margin: '0 auto', width: '100%' }}>
            <thead>
              <tr>
                <th>Building Name</th>
                <th>Floor</th>
                <th>Room Number</th>
                <th>Assignments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClassrooms.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>No classrooms found.</td></tr>
              )}
              {paginatedClassrooms.map(classroom => (
                <tr key={classroom.id}>
                  <td>{classroom.buildingName}</td>
                  <td>{classroom.floor}</td>
                  <td>{classroom.roomNumber}</td>
                  <td>{classroom.morning && classroom.afternoon ? (
                    <div>
                      <div>
                        <span style={{background:'#f7fcbf',color:'#222',fontWeight:'bold',borderRadius:4,padding:'2px 8px',marginRight:6}}>Morning</span>
                        <span style={{fontWeight:'bold'}}>{classroom.morning.grade}-{classroom.morning.section}</span>
                        {(() => {
                          const slots = (classroom.morning.maxStudents || 0) - (classroom.morning.usedSlots || 0);
                          if (slots === 0) {
                            return <span style={{background:'#e5e7eb',color:'#374151',fontWeight:'bold',borderRadius:4,padding:'2px 8px',marginLeft:8}}>Full</span>;
                          } else {
                            return <span style={{background:'#d1fae5',color:'#065f46',fontWeight:'bold',borderRadius:4,padding:'2px 8px',marginLeft:8}}>Slots: {slots}</span>;
                          }
                        })()}
                      </div>
                      <div style={{marginTop:4}}>
                        <span style={{background:'#c7d2fe',color:'#1e40af',fontWeight:'bold',borderRadius:4,padding:'2px 8px',marginRight:6}}>Afternoon</span>
                        <span style={{fontWeight:'bold'}}>{classroom.afternoon.grade}-{classroom.afternoon.section}</span>
                        {(() => {
                          const slots = (classroom.afternoon.maxStudents || 0) - (classroom.afternoon.usedSlots || 0);
                          if (slots === 0) {
                            return <span style={{background:'#e5e7eb',color:'#374151',fontWeight:'bold',borderRadius:4,padding:'2px 8px',marginLeft:8}}>Full</span>;
                          } else {
                            return <span style={{background:'#fee2e2',color:'#991b1b',fontWeight:'bold',borderRadius:4,padding:'2px 8px',marginLeft:8}}>Slots: {slots}</span>;
                          }
                        })()}
                      </div>
                    </div>
                  ) : ''}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => openViewModal(classroom)}
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
                        onClick={() => openEditModal(classroom)}
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
                        onClick={() => handleDelete(classroom.id)}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination Controls */}
      {sortedClassrooms.length > 3 && (
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
    </div>
  );
};

export default Classroom; 