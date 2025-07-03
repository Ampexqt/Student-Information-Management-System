/**
 * Logout Modal Component - Confirmation Dialog System
 * 
 * This component provides a reusable confirmation dialog system with
 * a specialized logout confirmation modal. It includes a generic DeleteModal
 * component that can be used for various confirmation dialogs throughout the app.
 * 
 * Key Features:
 * - Reusable confirmation dialog component
 * - Specialized logout confirmation
 * - Overlay click to close functionality
 * - Customizable title, message, and button text
 * - Responsive design with backdrop
 * - Accessibility features (close button, overlay click)
 * 
 * Components:
 * - DeleteModal: Generic confirmation dialog
 * - LogoutModal: Specialized logout confirmation using DeleteModal
 * 
 * Usage:
 * <LogoutModal 
 *   open={showLogoutModal} 
 *   onClose={() => setShowLogoutModal(false)} 
 *   onLogout={handleLogout} 
 * />
 */

import React from 'react';
import './logoutModal.css';

/**
 * Generic confirmation dialog component
 * Can be used for delete confirmations, logout confirmations, or any other
 * action that requires user confirmation before proceeding.
 * 
 * @param {boolean} open - Whether the modal is visible
 * @param {Function} onClose - Function to close the modal
 * @param {Function} onConfirm - Function to execute when confirmed
 * @param {string} title - Modal title (default: 'Delete')
 * @param {string|JSX} message - Modal message (default: 'Are you sure you want to delete this item?')
 * @param {string} confirmText - Text for confirm button (default: 'Delete')
 * @param {string} confirmClass - CSS class for confirm button (default: 'logout-modal-logout')
 */
export const DeleteModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = 'Delete', 
  message = 'Are you sure you want to delete this item?', 
  confirmText = 'Delete', 
  confirmClass = 'logout-modal-logout' 
}) => {
  // Don't render if modal is not open
  if (!open) return null;

  /**
   * Handles click on modal overlay
   * Closes modal when clicking outside the modal card
   * @param {Event} e - Click event
   */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="logout-modal-overlay" onClick={handleOverlayClick}>
      <div className="logout-modal-card">
        {/* Close button */}
        <button 
          className="logout-modal-close" 
          onClick={onClose} 
          title="Close"
        >
          ×
        </button>
        
        {/* Modal title */}
        <h2 className="logout-modal-title">{title}</h2>
        
        {/* Modal message */}
        <p className="logout-modal-message">{message}</p>
        
        {/* Action buttons */}
        <div className="logout-modal-actions">
          <button className={confirmClass} onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="logout-modal-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Specialized logout confirmation modal
 * Uses the generic DeleteModal component with logout-specific content
 * 
 * @param {boolean} open - Whether the logout modal is visible
 * @param {Function} onClose - Function to close the modal
 * @param {Function} onLogout - Function to execute logout action
 */
const LogoutModal = ({ open, onClose, onLogout }) => {
  return (
    <DeleteModal
      open={open}
      onClose={onClose}
      onConfirm={onLogout}
      title="Logout"
      message={
        <>
          You are going to log out your account.<br/>
          Are you sure?
        </>
      }
      confirmText="Log out"
      confirmClass="logout-modal-logout"
    />
  );
};

export default LogoutModal;
