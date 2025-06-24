import React from 'react';
import './logoutModal.css';

export const DeleteModal = ({ open, onClose, onConfirm, title = 'Delete', message = 'Are you sure you want to delete this item?', confirmText = 'Delete', confirmClass = 'logout-modal-logout' }) => {
  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="logout-modal-overlay" onClick={handleOverlayClick}>
      <div className="logout-modal-card">
        <button className="logout-modal-close" onClick={onClose} title="Close">×</button>
        <h2 className="logout-modal-title">{title}</h2>
        <p className="logout-modal-message">{message}</p>
        <div className="logout-modal-actions">
          <button className={confirmClass} onClick={onConfirm}>{confirmText}</button>
          <button className="logout-modal-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const LogoutModal = ({ open, onClose, onLogout }) => {
  return (
    <DeleteModal
      open={open}
      onClose={onClose}
      onConfirm={onLogout}
      title="Logout"
      message={<>You are going to log out your account.<br/>Are you sure?</>}
      confirmText="Log out"
      confirmClass="logout-modal-logout"
    />
  );
};

export default LogoutModal;
