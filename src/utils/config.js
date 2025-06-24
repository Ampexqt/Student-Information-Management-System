// Configuration utility for environment variables
// All environment variables must be prefixed with VITE_ to be accessible in the browser

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

// Validation function to check required environment variables
export const validateConfig = () => {
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_JWT_SECRET',
    'VITE_SESSION_SECRET'
  ]
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName])
  
  if (missingVars.length > 0) {
    console.warn('Missing required environment variables:', missingVars)
    return false
  }
  
  return true
}

// Helper function to get environment variable with fallback
export const getEnvVar = (key, fallback = '') => {
  return import.meta.env[key] || fallback
}

// Helper function to check if we're in development mode
export const isDevelopment = () => {
  return config.appEnv === 'development'
}

// Helper function to check if we're in production mode
export const isProduction = () => {
  return config.appEnv === 'production'
}

// Helper function for logging based on log level
export const log = (level, message, data = null) => {
  if (!config.debugMode && level === 'debug') return
  
  const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  }
  
  const currentLevel = logLevels[config.logLevel] || 2
  const messageLevel = logLevels[level] || 2
  
  if (messageLevel <= currentLevel) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`
    
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
export const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const sessionManager = {
  // Store user session
  setSession: (userInfo) => {
    const sessionData = {
      ...userInfo,
      loginTime: new Date().toISOString(),
      isAuthenticated: true
    };
    localStorage.setItem('userInfo', JSON.stringify(sessionData));
    localStorage.setItem('isAuthenticated', 'true');
  },

  // Get current session
  getSession: () => {
    try {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (!savedUserInfo) return null;

      const user = JSON.parse(savedUserInfo);
      
      // Check if session has expired (optional)
      if (user.loginTime) {
        const loginTime = new Date(user.loginTime).getTime();
        const currentTime = new Date().getTime();
        if (currentTime - loginTime > SESSION_DURATION) {
          sessionManager.clearSession();
          return null;
        }
      }

      return user.isAuthenticated ? user : null;
    } catch (error) {
      console.error('Error getting session:', error);
      sessionManager.clearSession();
      return null;
    }
  },

  // Clear session
  clearSession: () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isAuthenticated');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return sessionManager.getSession() !== null;
  }
};

export default config 