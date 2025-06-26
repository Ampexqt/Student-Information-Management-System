import React, { useRef } from 'react';
import './viewStudentModals.css';
import html2pdf from 'html2pdf.js';
import jsPDF from 'jspdf';

const getClassDisplay = (classId, classes) => {
  if (!classId || !classes) return '';
  const cls = classes.find(c => c.id === classId);
  if (!cls) return classId;
  return `${cls.classGrade || ''}${cls.classSection ? ' - ' + cls.classSection : ''}`;
};

const ViewStudentModal = ({ open, onClose, student, classes, classrooms }) => {
  if (!open || !student) return null;

  const pdfRef = useRef();

  // Find the classroom info using firestoreId and period
  const classroom = classrooms ? classrooms.find(r => r.id === student.firestoreId) : null;
  const periodData = classroom && student.period ? classroom[student.period] : null;
  const shiftLabel = student.period ? student.period.charAt(0).toUpperCase() + student.period.slice(1) : '';
  const shiftColor = student.period === 'morning' ? '#f7fcbf' : '#c7d2fe';
  const shiftTextColor = student.period === 'morning' ? '#222' : '#1e40af';
  const classDisplayWithBadge = periodData ? (
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
  ) : student.classId;
  const room = classroom ? `${classroom.buildingName}, ${classroom.roomNumber}, ${classroom.floor}` : '-';

  // PDF options for html2pdf
  const pdfOptions = {
    margin: [0.5, 0.5, 0.5, 0.5], // inches
    filename: `student-${student.studentId || 'info'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all'] },
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Custom jsPDF minimalist export
  const handleCustomPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    // Minimalist card dimensions
    const cardWidth = 410;
    const cardHeight = 320;
    const pageWidth = doc.internal.pageSize.getWidth();
    const cardX = (pageWidth - cardWidth) / 2;
    const cardY = 110;
    // Draw minimalist card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 16, 16, 'F');
    // Card border (lighter)
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(1.2);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 16, 16, 'S');
    // Title: Student ID
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(90, 110, 60);
    doc.text(`Student ID: ${student.studentId || '-'}`, pageWidth / 2, cardY + 36, { align: 'center' });
    // Two-column minimalist layout
    const leftX = cardX + 32;
    const rightX = cardX + cardWidth / 2 + 8;
    let y = cardY + 70;
    const rowHeight = 28;
    // Left column
    const leftFields = [
      { label: 'First Name', value: student.firstName },
      { label: 'Last Name', value: student.lastName },
      { label: 'Email', value: student.email },
      { label: 'Contact', value: student.contactNumber },
    ];
    // Right column
    const rightFields = [
      { label: 'Address', value: student.address },
      { label: 'Birthdate', value: student.birthdate },
      { label: 'Gender', value: student.gender },
      { label: 'Class', value: classDisplayWithBadge },
      { label: 'Room', value: room },
    ];
    doc.setFontSize(11.5);
    for (let i = 0; i < leftFields.length; i++) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(leftFields[i].label, leftX, y + i * rowHeight);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(String(leftFields[i].value || '-'), leftX, y + i * rowHeight + 14);
    }
    for (let i = 0; i < rightFields.length; i++) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(rightFields[i].label, rightX, y + i * rowHeight);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(String(rightFields[i].value || '-'), rightX, y + i * rowHeight + 14);
    }
    // Reference number with date and time
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
    const refNo = `REF-${student.studentId || 'XXXXXX'}-${dateStr}-${timeStr}`;
    const exportDisplay = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(160, 160, 160);
    doc.text(`Reference No.: ${refNo}`, cardX + cardWidth / 2, cardY + cardHeight - 32, { align: 'center' });
    doc.text(`Exported: ${exportDisplay}`, cardX + cardWidth / 2, cardY + cardHeight - 16, { align: 'center' });
    doc.save(`student-${student.studentId || 'info'}-custom.pdf`);
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
    }} onClick={handleOverlayClick}>
      <style>{`
        @media (max-width: 700px) {
          .view-modal-responsive { max-width: 99vw !important; }
        }
        @media (max-width: 600px) {
          .view-modal-content { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="modal-responsive view-modal-responsive" style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '2rem',
        width: '95vw',
        maxWidth: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: '2px solid #212529',
        boxShadow: '0 10px 0 0 #181c22, 0 8px 24px 0 rgba(33,37,41,0.10)'
      }}>
        {/* Large X Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 18,
            background: 'none',
            border: 'none',
            fontSize: '2.8rem',
            fontWeight: 900,
            color: '#495057',
            cursor: 'pointer',
            zIndex: 10,
            lineHeight: 1,
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.target.style.background = '#f1f3f5'}
          onMouseLeave={e => e.target.style.background = 'none'}
          aria-label="Close"
        >
          ×
        </button>
        {/* PDF Content Start */}
        <div ref={pdfRef} style={{
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          minWidth: 320,
          maxWidth: 500,
          width: '100%',
          padding: '2.2rem 2.2rem 1.7rem 2.2rem',
          margin: '0 auto',
          border: '1.5px solid #e9ecef',
          fontFamily: 'Poppins, Inter, Arial, sans-serif',
        }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ background: '#f4fce3', borderRadius: 8, padding: '0.3rem 1.2rem', fontWeight: 700, fontSize: '1.3rem', marginBottom: 16, color: '#222', letterSpacing: '0.01em' }}>View Student</span>
            {student.profileImage ? (
            <img src={student.profileImage} alt="Profile" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '2px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} />
          ) : (
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              color: '#adb5bd',
              marginBottom: 12,
              fontWeight: 700,
              border: '1.5px solid #dee2e6',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8.5" r="4"/><path d="M21 20c0-2.5-4-4-9-4s-9 1.5-9 4"/></svg>
            </div>
          )}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem 2.5rem',
          marginTop: 8,
          marginBottom: 8,
        }}>
          <div>
            <div style={{ color: '#888', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Student ID</div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#222', fontSize: 16 }}>{student.studentId}</div>
            <div style={{ color: '#888', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>First Name</div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#222', fontSize: 16 }}>{student.firstName}</div>
            <div style={{ color: '#888', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Last Name</div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#222', fontSize: 16 }}>{student.lastName}</div>
            <div style={{ color: '#888', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Email</div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#222', fontSize: 16 }}>{student.email}</div>
            <div style={{ color: '#888', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Contact</div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#222', fontSize: 16 }}>{student.contactNumber}</div>
          </div>
          <div>
            <div style={{ color: '#888', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Address</div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#222', fontSize: 16 }}>{student.address}</div>
            <div style={{ color: '#888', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Birthdate</div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#222', fontSize: 16 }}>{student.birthdate}</div>
            <div style={{ color: '#888', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Gender</div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#222', fontSize: 16 }}>{student.gender}</div>
            <div style={{ color: '#888', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Class</div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#222', fontSize: 16 }}>{classDisplayWithBadge}</div>
            <div style={{ color: '#888', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Room</div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#222', fontSize: 16 }}>{room}</div>
          </div>
        </div>
        </div>
        {/* PDF Content End */}
        <button
          onClick={handleCustomPdf}
          className="login-continue"
          style={{
            width: '100%',
            maxWidth: 180,
            margin: '18px auto 0 auto',
            display: 'block',
          }}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default ViewStudentModal;
