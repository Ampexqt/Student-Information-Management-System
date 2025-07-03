/**
 * Main Entry Point for Student Information Management System
 * 
 * This file serves as the root entry point for the React application.
 * It initializes the React application and renders the main App component
 * into the DOM element with id 'root'.
 * 
 * Key Responsibilities:
 * - Import React and ReactDOM for application rendering
 * - Import the main App component
 * - Import global CSS styles
 * - Render the application with React.StrictMode for development debugging
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Create the root React element and render the application
// ReactDOM.createRoot is the new React 18 API for concurrent features
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode helps identify potential problems in development
  // It renders components twice to detect side effects
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
