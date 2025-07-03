/**
 * Login Component - Authentication Interface
 * 
 * This component provides the main authentication interface for the
 * Student Information Management System. It handles user login with
 * email and password validation against Firebase Firestore.
 * 
 * Key Features:
 * - Email and password authentication
 * - Email domain validation (whitelist approach)
 * - Password visibility toggle
 * - Form validation with real-time feedback
 * - Loading states and success animations
 * - Toast notifications for user feedback
 * - Session management integration
 * 
 * Authentication Flow:
 * 1. User enters email and password
 * 2. Email domain is validated against allowed domains
 * 3. Credentials are checked against Firebase Admin document
 * 4. On success: Session is created and user is redirected to dashboard
 * 5. On failure: Error message is displayed
 * 
 * Security Notes:
 * - Uses hardcoded admin document ID (should be moved to environment variables)
 * - Password comparison is done in plain text (should use hashing)
 * - Email domains are whitelisted for security
 */

import React, { useState } from "react";
import { IoPersonSharp } from "react-icons/io5";
import { BsEyeFill, BsEyeSlashFill } from "react-icons/bs";
import { FaKey } from "react-icons/fa";
import "./Login.css";
import { db } from '../../utils/firebase';
import { sessionManager } from '../../utils/config';
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Toast from "../../components/common/toast/Toast";
import { v4 as uuidv4 } from 'uuid';

/**
 * List of allowed email domains for security
 * This prevents users from using disposable or suspicious email providers
 */
const allowedDomains = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "gmx.com"
];

/**
 * Login component for user authentication
 * @param {Function} onLoginSuccess - Callback function called when login is successful
 */
const Login = ({ onLoginSuccess }) => {
  // State management for form inputs and UI
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [email, setEmail] = useState(""); // Email input value
  const [password, setPassword] = useState(""); // Password input value
  const [touched, setTouched] = useState({ email: false, password: false }); // Track field focus for validation
  const [emailError, setEmailError] = useState(""); // Email validation error message
  const [loading, setLoading] = useState(false); // Loading state during authentication
  const [toasts, setToasts] = useState([]); // Toast notifications array
  const [registerDisabled, setRegisterDisabled] = useState(false); // Disable register link temporarily
  const [showCheck, setShowCheck] = useState(false); // Show success checkmark animation

  // Derived state for form validation
  const hasAt = email.includes("@"); // Check if email contains @ symbol
  const isDisabled = !hasAt || !password || loading; // Disable submit button if form is invalid or loading

  /**
   * Validates if the email domain is in the allowed domains list
   * @param {string} email - Email address to validate
   * @returns {boolean} - True if domain is allowed, false otherwise
   */
  function validateEmailDomain(email) {
    const atIndex = email.lastIndexOf("@");
    if (atIndex === -1) return false;
    const domain = email.slice(atIndex + 1).toLowerCase();
    return allowedDomains.some(d => domain === d);
  }

  /**
   * Handles the login form submission
   * Validates credentials against Firebase Admin document
   * @param {Event} e - Form submission event
   */
  async function handleContinue(e) {
    e.preventDefault();
    
    // Mark all fields as touched to show validation errors
    setTouched({ email: true, password: true });
    
    // Validate email domain
    if (!validateEmailDomain(email)) {
      setEmailError("Please enter a valid email address");
      return;
    } else {
      setEmailError("");
    }
    
    setLoading(true);
    
    try {
      // Reference to the admin document in Firestore
      // TODO: Move this ID to environment variables for security
      const adminDocRef = doc(db, "Admin", "WTCQaHrSje10KNvKpdPF");
      const adminDocSnap = await getDoc(adminDocRef);
      
      if (adminDocSnap.exists()) {
        const adminData = adminDocSnap.data();
        
        // Check if credentials match admin data
        if (
          email === adminData.Email &&
          password === adminData.Password
        ) {
          // Login successful
          setEmailError("");
          setToasts(prev => [
            ...prev,
            { id: uuidv4(), message: "Login successful!", type: "success" }
          ]);
          
          // Show success animation and redirect
          setTimeout(() => {
            setShowCheck(true);
            setLoading(false);
            setTimeout(() => {
              // Create user session and redirect to dashboard
              sessionManager.setSession({ email: email });
              if (onLoginSuccess) onLoginSuccess();
            }, 1000);
          }, 1000);
        } else {
          // Invalid credentials
          setEmailError("");
          setToasts((prev) => [
            ...prev,
            { id: uuidv4(), message: "Invalid email or password", type: "error" }
          ]);
          setLoading(false);
        }
      } else {
        // Admin document not found
        setEmailError("Admin account not found");
        setLoading(false);
      }
    } catch (err) {
      // Handle authentication errors
      setEmailError("Login failed: " + err.message);
      console.error("Login error:", err);
      setLoading(false);
    }
  }

  /**
   * Removes a toast notification from the display
   * @param {string} id - Unique ID of the toast to remove
   */
  const handleToastClose = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  /**
   * Debug function to fetch all users from Firestore
   * Currently unused but kept for development purposes
   */
  async function fetchUsers() {
    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
    });
  }

  return (
    <div className="login-bg">
      {/* Toast notifications for user feedback */}
      <Toast
        toasts={toasts}
        onClose={handleToastClose}
      />
      
      {/* Main application title */}
      <h1 className="main-title">Student Information Management System</h1>
      
      {/* Login form card */}
      <div className="login-card">
        {/* Loading overlay with spinner */}
        {loading && (
          <div className="login-loading-overlay">
            <div className="login-spinner"></div>
          </div>
        )}
        
        {/* Success checkmark overlay */}
        {showCheck && (
          <div className="login-check-overlay">
            <div className="login-checkmark">
              <svg viewBox="0 0 52 52" width="52" height="52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14 27l7 7 16-16" />
              </svg>
            </div>
            <div className="login-check-text">Redirecting to dashboard...</div>
          </div>
        )}
        
        {/* Login form title */}
        <h2 className="login-title"><span className="highlight">Sign in</span></h2>
        
        {/* Login form */}
        <form onSubmit={handleContinue} style={{ width: "100%" }}>
          {/* Email input field */}
          <div className="login-input-group">
            <span className="login-icon contrast user-stroke"><IoPersonSharp /></span>
            <input
              type="email"
              placeholder="Email"
              className="login-input"
              value={email}
              required
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              disabled={loading}
            />
          </div>
          
          {/* Email validation errors */}
          {(touched.email && !email) && (
            <div className="login-error">Email is required.</div>
          )}
          {email && emailError && emailError !== "Invalid email or password" && (
            <div className="login-error">{emailError}</div>
          )}
          
          {/* Password input field with visibility toggle */}
          <div className="login-input-group">
            <span className="login-icon contrast"><FaKey /></span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="login-input"
              value={password}
              required
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              disabled={loading}
            />
            {/* Password visibility toggle button */}
            <span
              className="login-eye-icon contrast"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}
            </span>
          </div>
          
          {/* Password validation errors */}
          {touched.password && !password && (
            <div className="login-error">Password is required.</div>
          )}
          
          {/* Submit button */}
          <button
            className="login-continue"
            disabled={isDisabled}
            type="submit"
          >
            {loading ? 'Signing in...' : <>CONTINUE <span className="arrow">→</span></>}
          </button>
        </form>
        
        {/* Registration link (currently disabled) */}
        <div className="login-signup-text">
          Don't have an account? <a
            href="#"
            className={`login-signup-link${registerDisabled ? ' disabled' : ''}`}
            onClick={e => {
              e.preventDefault();
              if (registerDisabled) return;
              setRegisterDisabled(true);
              setToasts(prev => [
                ...prev,
                { id: uuidv4(), message: "This is under maintenance." }
              ]);
              setTimeout(() => setRegisterDisabled(false), 3000);
            }}
            tabIndex={registerDisabled ? -1 : 0}
            aria-disabled={registerDisabled}
            style={registerDisabled ? { pointerEvents: 'none', opacity: 0.6 } : {}}
          >Register</a>
        </div>
      </div>
    </div>
  );
};

export default Login; 