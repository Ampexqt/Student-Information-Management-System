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

const Login = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [registerDisabled, setRegisterDisabled] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const hasAt = email.includes("@");
  const isDisabled = !hasAt || !password || loading;

  function validateEmailDomain(email) {
    const atIndex = email.lastIndexOf("@");
    if (atIndex === -1) return false;
    const domain = email.slice(atIndex + 1).toLowerCase();
    return allowedDomains.some(d => domain === d);
  }

  async function handleContinue(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validateEmailDomain(email)) {
      setEmailError("Please enter a valid email address");
      return;
    } else {
      setEmailError("");
    }
    setLoading(true);
    try {
      const adminDocRef = doc(db, "Admin", "WTCQaHrSje10KNvKpdPF");
      const adminDocSnap = await getDoc(adminDocRef);
      if (adminDocSnap.exists()) {
        const adminData = adminDocSnap.data();
        if (
          email === adminData.Email &&
          password === adminData.Password
        ) {
          setEmailError("");
          setToasts(prev => [
            ...prev,
            { id: uuidv4(), message: "Login successful!", type: "success" }
          ]);
          setTimeout(() => {
            setShowCheck(true);
            setLoading(false);
            setTimeout(() => {
              sessionManager.setSession({ email: email });
              if (onLoginSuccess) onLoginSuccess();
            }, 1000);
          }, 1000);
        } else {
          setEmailError("");
          setToasts((prev) => [
            ...prev,
            { id: uuidv4(), message: "Invalid email or password", type: "error" }
          ]);
          setLoading(false);
        }
      } else {
        setEmailError("Admin account not found");
        setLoading(false);
      }
    } catch (err) {
      setEmailError("Login failed: " + err.message);
      console.error("Login error:", err);
      setLoading(false);
    }
  }

  const handleToastClose = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  async function fetchUsers() {
    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
    });
  }

  return (
    <div className="login-bg">
      <Toast
        toasts={toasts}
        onClose={handleToastClose}
      />
      <h1 className="main-title">Student Information Management System</h1>
      <div className="login-card">
        {loading && (
          <div className="login-loading-overlay">
            <div className="login-spinner"></div>
          </div>
        )}
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
        <h2 className="login-title"><span className="highlight">Sign in</span></h2>
        <form onSubmit={handleContinue} style={{ width: "100%" }}>
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
          {(touched.email && !email) && (
            <div className="login-error">Email is required.</div>
          )}
          {email && emailError && emailError !== "Invalid email or password" && (
            <div className="login-error">{emailError}</div>
          )}
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
            <span
              className="login-eye-icon contrast"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}
            </span>
          </div>
          {touched.password && !password && (
            <div className="login-error">Password is required.</div>
          )}
          <button
            className="login-continue"
            disabled={isDisabled}
            type="submit"
          >
            {loading ? 'Signing in...' : <>CONTINUE <span className="arrow">→</span></>}
          </button>
        </form>
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