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
import ClassModal from '../../components/common/modals/ClassModal';
import '../student/Student.css';
import { DeleteModal } from '../../components/common/modals/logoutModal';
import { FaEye, FaEdit, FaTrash, FaCalendarAlt, FaSearch, FaFilter } from 'react-icons/fa';
import ViewClassModal from '../../components/common/modals/viewClassModal';
import { formatScheduleDisplay, getShiftForGrade } from '../../utils/schedule';
import Toast from '../../components/common/toast/Toast';

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
  const [showScheduleOverview, setShowScheduleOverview] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const classesPerPage = 3;
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortOptions = [
    { value: 'teacherId', label: 'Teacher ID' },
    { value: 'adviserName', label: 'Teacher Name' },
    { value: 'classSection', label: 'Section' },
    { value: 'classroom', label: 'Classroom' },
    { value: 'schoolYear', label: 'School Year' },
    { value: 'quarter', label: 'Quarter' },
  ];
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

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

  // Search filter
  const filteredClasses = classes.filter(cls => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (cls.teacherId && cls.teacherId.toLowerCase().includes(query)) ||
      (cls.adviserName && cls.adviserName.toLowerCase().includes(query))
    );
  });

  // Sorting
  const sortFields = {
    classGrade: (a, b) => (a.classGrade || '').localeCompare(b.classGrade || '', undefined, { numeric: true }),
    classSection: (a, b) => (a.classSection || '').localeCompare(b.classSection || ''),
    classroom: (a, b) => {
      const aRoom = classrooms.find(room => room.id === a.classroomId);
      const bRoom = classrooms.find(room => room.id === b.classroomId);
      const aDisplay = aRoom ? `${aRoom.buildingName} - ${aRoom.roomNumber}` : a.classroomId || '';
      const bDisplay = bRoom ? `${bRoom.buildingName} - ${bRoom.roomNumber}` : b.classroomId || '';
      return aDisplay.localeCompare(bDisplay);
    },
    adviserName: (a, b) => (a.adviserName || '').localeCompare(b.adviserName || ''),
    schoolYear: (a, b) => (a.schoolYear || '').localeCompare(b.schoolYear || ''),
    quarter: (a, b) => ((a.quarter || '').toString()).localeCompare((b.quarter || '').toString(), undefined, { numeric: true }),
  };
  let sortedClasses = [...filteredClasses];
  if (sortField && sortFields[sortField]) {
    sortedClasses.sort((a, b) => {
      const cmp = sortFields[sortField](a, b);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }

  // Pagination logic
  const totalPages = Math.ceil(sortedClasses.length / classesPerPage);
  const paginatedClasses = sortedClasses.slice(
    (currentPage - 1) * classesPerPage,
    currentPage * classesPerPage
  );
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [sortedClasses.length, totalPages]);

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
        setToast({ show: true, message: 'Class successfully added!', type: 'success' });
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

  // Function to format schedule display with shift information
  const formatSchedule = (schedule, grade) => {
    if (!Array.isArray(schedule) || schedule.length === 0) {
      const shift = getShiftForGrade(grade);
      return shift ? `No schedule set (${shift.displayName})` : 'No schedule set';
    }

    const shift = getShiftForGrade(grade);
    const shiftInfo = shift ? ` (${shift.displayName})` : '';
    
    const formattedSlots = schedule.map(slot => {
      const timeRange = `${slot.start} - ${slot.end}`;
      const subjectInfo = slot.subject ? ` - ${slot.subject}` : '';
      const teacherInfo = slot.teacher ? ` (${slot.teacher})` : '';
      return `${slot.day} ${timeRange}${subjectInfo}${teacherInfo}`;
    });

    return formattedSlots.join(', ') + shiftInfo;
  };

  // Organize classes by shift
  const morningClasses = classes.filter(cls => {
    const shift = getShiftForGrade(cls.classGrade);
    return shift && shift.name === 'morning';
  });

  const afternoonClasses = classes.filter(cls => {
    const shift = getShiftForGrade(cls.classGrade);
    return shift && shift.name === 'afternoon';
  });

  // Modal overlay for schedule overview
  const ScheduleOverviewModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.18)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: '32px 24px 24px 24px',
        minWidth: 340,
        maxWidth: 900,
        width: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        fontFamily: 'Poppins, Inter, Arial, sans-serif'
      }}>
        <button
          onClick={() => setShowScheduleOverview(false)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 28,
            color: '#888',
            cursor: 'pointer',
            fontWeight: 700
          }}
          title="Close"
        >×</button>
        <h3 style={{
          marginBottom: '24px',
          color: '#495057',
          fontSize: '1.35rem',
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '0.01em'
        }}>
          Schedule Overview
        </h3>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Morning Shift */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: '12px',
              textAlign: 'center',
              fontWeight: 600,
              color: '#856404'
            }}>
              Morning Shift (6:30 AM - 12:00 PM) - Grades 7 & 8
            </div>
            {morningClasses.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic' }}>
                No morning classes scheduled
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {morningClasses.map(cls => {
                  const classroom = classrooms.find(room => room.id === cls.classroomId);
                  return (
                    <div key={cls.id} style={{
                      background: 'white',
                      border: '1px solid #e9ecef',
                      borderRadius: 6,
                      padding: '12px',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ fontWeight: 600, color: '#495057', marginBottom: '4px' }}>
                        Grade {cls.classGrade} Section {cls.classSection} - {cls.adviserName}
                      </div>
                      <div style={{ color: '#6c757d', marginBottom: '4px' }}>
                        {classroom ? `${classroom.buildingName} - ${classroom.roomNumber}` : 'No classroom'}
                      </div>
                      <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                        {formatSchedule(cls.schedule, cls.classGrade)}
                      </div>
                      <div style={{ color: '#888', fontSize: '0.85rem', marginTop: 2 }}>
                        <span>Quarter: <b>{cls.quarter ? `Quarter ${cls.quarter}` : '-'}</b></span> | <span>School Year: <b>{cls.schoolYear || '-'}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Afternoon Shift */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <div style={{
              background: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: '12px',
              textAlign: 'center',
              fontWeight: 600,
              color: '#0c5460'
            }}>
              Afternoon Shift (12:30 PM - 6:00 PM) - Grades 9 & 10
            </div>
            {afternoonClasses.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic' }}>
                No afternoon classes scheduled
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {afternoonClasses.map(cls => {
                  const classroom = classrooms.find(room => room.id === cls.classroomId);
                  return (
                    <div key={cls.id} style={{
                      background: 'white',
                      border: '1px solid #e9ecef',
                      borderRadius: 6,
                      padding: '12px',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ fontWeight: 600, color: '#495057', marginBottom: '4px' }}>
                        Grade {cls.classGrade} Section {cls.classSection} - {cls.adviserName}
                      </div>
                      <div style={{ color: '#6c757d', marginBottom: '4px' }}>
                        {classroom ? `${classroom.buildingName} - ${classroom.roomNumber}` : 'No classroom'}
                      </div>
                      <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                        {formatSchedule(cls.schedule, cls.classGrade)}
                      </div>
                      <div style={{ color: '#888', fontSize: '0.85rem', marginTop: 2 }}>
                        <span>Quarter: <b>{cls.quarter ? `Quarter ${cls.quarter}` : '-'}</b></span> | <span>School Year: <b>{cls.schoolYear || '-'}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="student-page-container">
      <Toast show={toast.show} message={toast.message} type={toast.type} position="top-right" onClose={() => setToast({ ...toast, show: false })} />
      <h2 className="student-page-title"><span className="dashboard-highlight">Class Management</span></h2>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={openAddModal} className="student-add-btn">Add Class</button>
          <button 
            onClick={() => setShowScheduleOverview(true)}
            style={{
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FaCalendarAlt />
            Show Schedule Overview
          </button>
        </div>
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
              placeholder="Search by Teacher ID or Name..."
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

      {showScheduleOverview && <ScheduleOverviewModal />}

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
        data={viewClass}
        classrooms={classrooms}
      />
      <div className="table-responsive">
        <div className="student-table-wrapper">
          <table className="student-table">
            <thead>
              <tr>
                <th>Teacher ID</th>
                <th>Teacher Name</th>
                <th>Grade</th>
                <th>Section</th>
                <th>Classroom</th>
                <th>Schedule</th>
                <th>School Year</th>
                <th>Quarter</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedClasses.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>No classes found.</td></tr>
              )}
              {paginatedClasses.map(cls => {
                const classroom = classrooms.find(room => room.id === cls.classroomId);
                const classroomDisplay = classroom ? `${classroom.buildingName} - ${classroom.roomNumber}` : cls.classroomId;
                const shift = getShiftForGrade(cls.classGrade);
                const shiftBadge = shift ? (
                  <span style={{
                    background: shift.name === 'morning' ? '#fff3cd' : '#d1ecf1',
                    color: shift.name === 'morning' ? '#856404' : '#0c5460',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginLeft: 4
                  }}>
                    {shift.name === 'morning' ? '🌅' : '🌆'} {shift.displayName}
                  </span>
                ) : null;
                
                return (
                  <tr key={cls.id}>
                    <td>{cls.teacherId || '-'}</td>
                    <td>{cls.adviserName}</td>
                    <td>{cls.classGrade}</td>
                    <td>{cls.classSection}</td>
                    <td>{classroomDisplay}</td>
                    <td style={{ maxWidth: 300, fontSize: '0.9rem' }}>
                      {(() => {
                        const scheduleText = formatSchedule(cls.schedule, cls.classGrade);
                        let badge = null;
                        if (shift) {
                          badge = (
                            <span style={{
                              marginLeft: 8,
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontWeight: 600,
                              fontSize: '0.85em',
                              background: shift.name === 'morning' ? '#fff3cd' : '#d1ecf1',
                              color: shift.name === 'morning' ? '#856404' : '#0c5460',
                              display: 'inline-block',
                            }}>
                              {shift.name === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}
                            </span>
                          );
                        }
                        return <span>{scheduleText} {badge}</span>;
                      })()}
                    </td>
                    <td>{cls.schoolYear}</td>
                    <td>{cls.quarter ? `Quarter ${cls.quarter}` : '-'}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination Controls */}
      {sortedClasses.length > 3 && (
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

export default Classes; 