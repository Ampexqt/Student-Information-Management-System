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
import ClassModal from '../../components/modals/ClassModal';
import '../student/Student.css';
import { DeleteModal } from '../../components/modals/logoutModal';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import ViewClassModal from '../../components/modals/viewClassModal';

const initialForm = {
  adviserName: '',
  classGrade: '',
  classSection: '',
  classroomId: '',
  schedule: '',
  schoolYear: '',
};

function to12Hour(time) {
  if (!time) return '';
  if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) return time;
  const [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
}

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewClass, setViewClass] = useState(null);

  // Real-time fetch classes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'Class'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(data);
    });
    return () => unsub();
  }, []);

  // Fetch all classrooms for mapping
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

  const openEditModal = (cls) => {
    setModalMode('edit');
    setModalData(cls);
    setEditingId(cls.id);
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
        await updateDoc(doc(db, 'Class', editingId), {
          ...form,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, 'Class'), {
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
      await deleteDoc(doc(db, 'Class', deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const openViewModal = (cls) => {
    setViewClass(cls);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewClass(null);
  };

  return (
    <div className="student-page-container">
      <h2 className="student-page-title"><span className="dashboard-highlight">Class Management</span></h2>
      <button onClick={openAddModal} className="student-add-btn">Add</button>
      <ClassModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        initialData={modalData}
        loading={loading}
        mode={modalMode}
      />
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Class"
        message={<>Are you sure you want to delete this class?</>}
        confirmText="Delete"
        confirmClass="logout-modal-logout"
      />
      <ViewClassModal
        open={viewModalOpen}
        onClose={closeViewModal}
        classData={viewClass}
        classroom={viewClass ? classrooms.find(room => room.id === viewClass.classroomId) : null}
      />
      <div className="student-table-wrapper">
        <table className="student-table">
          <thead>
            <tr>
              <th>Adviser Name</th>
              <th>Grade</th>
              <th>Section</th>
              <th>Subject</th>
              <th>Classroom</th>
              <th>Schedule</th>
              <th>School Year</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>No classes found.</td></tr>
            )}
            {classes.map(cls => {
              const classroom = classrooms.find(room => room.id === cls.classroomId);
              const classroomDisplay = classroom ? `${classroom.buildingName} - ${classroom.roomNumber}` : cls.classroomId;
              return (
                <tr key={cls.id}>
                  <td>{cls.adviserName}</td>
                  <td>{cls.classGrade}</td>
                  <td>{cls.classSection}</td>
                  <td>{cls.subject}</td>
                  <td>{classroomDisplay}</td>
                  <td>{Array.isArray(cls.schedule)
                    ? cls.schedule.map(s => `${s.day} ${to12Hour(s.start)} - ${to12Hour(s.end)}`).join(', ')
                    : cls.schedule}
                  </td>
                  <td>{cls.schoolYear}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <button
                        onClick={() => openViewModal(cls)}
                        className="student-view-btn"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#10b981',
                          fontSize: '1.7rem',
                          width: '2.2rem',
                          height: '2.2rem',
                          display: 'inline-flex',
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
                        onClick={() => openEditModal(cls)}
                        className="student-edit-btn"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#2563eb',
                          fontSize: '1.7rem',
                          width: '2.2rem',
                          height: '2.2rem',
                          display: 'inline-flex',
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
                        onClick={() => handleDelete(cls.id)}
                        className="student-delete-btn"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                          fontSize: '1.7rem',
                          width: '2.2rem',
                          height: '2.2rem',
                          display: 'inline-flex',
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Classes; 