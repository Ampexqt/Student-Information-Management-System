import React, { useEffect, useState } from 'react';
import { db } from '../../utils/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';
import ClassroomModal from '../../components/modals/ClassroomModal';
import '../student/Student.css';
import { DeleteModal } from '../../components/modals/logoutModal';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';

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

  // Real-time fetch classrooms
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'Classroom'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClassrooms(data);
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

  const handleModalSubmit = async (form) => {
    setLoading(true);
    setErrorMsg('');
    // Prevent duplicate buildingName + roomNumber
    const duplicate = classrooms.find(c =>
      c.buildingName.trim().toLowerCase() === form.buildingName.trim().toLowerCase() &&
      c.roomNumber.trim().toLowerCase() === form.roomNumber.trim().toLowerCase() &&
      (modalMode !== 'edit' || c.id !== editingId)
    );
    if (duplicate) {
      setErrorMsg('A classroom with this building and room number already exists.');
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

  return (
    <div className="student-page-container" style={{ width: '100%' }}>
      <h2 className="student-page-title" style={{ textAlign: 'left', marginTop: '2.5rem', marginBottom: '0.5rem', width: '100%' }}>
        <span className="dashboard-highlight">Classroom Management</span>
      </h2>
      <button onClick={openAddModal} className="student-add-btn" style={{ marginBottom: '1.5rem' }}>Add</button>
      <ClassroomModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        initialData={modalData}
        loading={loading}
        mode={modalMode}
        classrooms={classrooms}
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
      <div className="student-table-wrapper" style={{ margin: '0 auto', width: '90%', maxWidth: '1100px' }}>
        <table className="student-table" style={{ margin: '0 auto', width: '100%' }}>
          <thead>
            <tr>
              <th>Building Name</th>
              <th>Floor</th>
              <th>Room Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24 }}>No classrooms found.</td></tr>
            )}
            {classrooms.map(classroom => (
              <tr key={classroom.id}>
                <td>{classroom.buildingName}</td>
                <td>{classroom.floor}</td>
                <td>{classroom.roomNumber}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <button
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
                      disabled
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
  );
};

export default Classroom; 