/**
 * Configuration and Session Management System
 * 
 * This module provides centralized configuration management and session handling
 * for the Student Information Management System.
 * 
 * Key Features:
 * - Environment variable management with fallbacks
 * - Application configuration settings
 * - Database and API configuration
 * - Session management with localStorage
 * - Logging utilities with configurable levels
 * - Configuration validation
 * 
 * Environment Variables:
 * All environment variables must be prefixed with VITE_ to be accessible in the browser
 * due to Vite's security restrictions.
 */

// Configuration utility for environment variables
// All environment variables must be prefixed with VITE_ to be accessible in the browser

/**
 * Main configuration object containing all application settings
 * Each setting has a fallback value for development environments
 */
export const config = {
  // Application Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Student Information Management System',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  
  // Database Configuration
  dbHost: import.meta.env.VITE_DB_HOST || 'localhost',
  dbPort: parseInt(import.meta.env.VITE_DB_PORT) || 5432,
  dbName: import.meta.env.VITE_DB_NAME || 'student_management',
  dbUser: import.meta.env.VITE_DB_USER || 'postgres',
  dbPassword: import.meta.env.VITE_DB_PASSWORD || '',
  
  // Authentication
  jwtSecret: import.meta.env.VITE_JWT_SECRET || '',
  sessionSecret: import.meta.env.VITE_SESSION_SECRET || '',
  
  // External Services
  emailService: import.meta.env.VITE_EMAIL_SERVICE || 'gmail',
  emailUser: import.meta.env.VITE_EMAIL_USER || '',
  emailPassword: import.meta.env.VITE_EMAIL_PASSWORD || '',
  
  // File Upload
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 5242880, // 5MB
  allowedFileTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'application/pdf'],
  
  // Feature Flags
  enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  enableFileUpload: import.meta.env.VITE_ENABLE_FILE_UPLOAD === 'true',
  enableEmailNotifications: import.meta.env.VITE_ENABLE_EMAIL_NOTIFICATIONS === 'true',
  
  // Development Settings
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
}

/**
 * Validates that all required environment variables are present
 * @returns {boolean} - True if all required variables are set, false otherwise
 */
export const validateConfig = () => {
  // List of environment variables that are required for the application to function
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_JWT_SECRET',
    'VITE_SESSION_SECRET'
  ]
  
  // Check which required variables are missing
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName])
  
  if (missingVars.length > 0) {
    console.warn('Missing required environment variables:', missingVars)
    return false
  }
  
  return true
}

/**
 * Helper function to get environment variable with fallback
 * @param {string} key - The environment variable name
 * @param {string} fallback - Default value if environment variable is not set
 * @returns {string} - The environment variable value or fallback
 */
export const getEnvVar = (key, fallback = '') => {
  return import.meta.env[key] || fallback
}

/**
 * Helper function to check if we're in development mode
 * @returns {boolean} - True if in development environment
 */
export const isDevelopment = () => {
  return config.appEnv === 'development'
}

/**
 * Helper function to check if we're in production mode
 * @returns {boolean} - True if in production environment
 */
export const isProduction = () => {
  return config.appEnv === 'production'
}

/**
 * Logging utility with configurable log levels
 * Supports error, warn, info, and debug levels
 * @param {string} level - Log level (error, warn, info, debug)
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
export const log = (level, message, data = null) => {
  // Skip debug logs in production unless debug mode is enabled
  if (!config.debugMode && level === 'debug') return
  
  // Define log level hierarchy (lower number = higher priority)
  const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  }
  
  // Get current configured log level
  const currentLevel = logLevels[config.logLevel] || 2
  const messageLevel = logLevels[level] || 2
  
  // Only log if message level is at or above current configured level
  if (messageLevel <= currentLevel) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`
    
    // Use appropriate console method based on log level
    switch (level) {
      case 'error':
        console.error(logMessage, data)
        break
      case 'warn':
        console.warn(logMessage, data)
        break
      case 'info':
        console.info(logMessage, data)
        break
      case 'debug':
        console.debug(logMessage, data)
        break
      default:
        console.log(logMessage, data)
    }
  }
}

// Session management utilities
/**
 * Session duration in milliseconds (24 hours)
 * After this time, the session will be considered expired
 */
export const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Session management object providing methods to handle user sessions
 * Uses localStorage for persistent session storage
 */
export const sessionManager = {
  /**
   * Store user session information in localStorage
   * @param {object} userInfo - User information to store in session
   */
  setSession: (userInfo) => {
    const sessionData = {
      ...userInfo,
      loginTime: new Date().toISOString(), // Store login timestamp for expiration checking
      isAuthenticated: true
    };
    localStorage.setItem('userInfo', JSON.stringify(sessionData));
    localStorage.setItem('isAuthenticated', 'true');
  },

  /**
   * Retrieve current session information from localStorage
   * @returns {object|null} - User session data or null if no valid session
   */
  getSession: () => {
    try {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (!savedUserInfo) return null;

      const user = JSON.parse(savedUserInfo);
      
      // Check if session has expired based on login time
      if (user.loginTime) {
        const loginTime = new Date(user.loginTime).getTime();
        const currentTime = new Date().getTime();
        if (currentTime - loginTime > SESSION_DURATION) {
          // Session expired, clear it and return null
          sessionManager.clearSession();
          return null;
        }
      }

      // Return user data only if session is marked as authenticated
      return user.isAuthenticated ? user : null;
    } catch (error) {
      console.error('Error getting session:', error);
      // Clear corrupted session data
      sessionManager.clearSession();
      return null;
    }
  },

  /**
   * Clear all session data from localStorage
   * Called during logout or when session is invalid
   */
  clearSession: () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isAuthenticated');
  },

  /**
   * Check if user is currently authenticated
   * @returns {boolean} - True if user has valid session, false otherwise
   */
  isAuthenticated: () => {
    return sessionManager.getSession() !== null;
  }
};

export default config 