/**
 * Firebase Configuration and Database Utilities
 * 
 * This module handles all Firebase-related operations including:
 * - Firebase app initialization and configuration
 * - Firestore database connection
 * - Cloud Storage connection
 * - Student ID generation with auto-increment
 * - Student data retrieval by class
 * 
 * Dependencies:
 * - Firebase App SDK
 * - Firestore SDK
 * - Cloud Storage SDK
 * 
 * Environment Variables Required:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * Firebase configuration object
 * All values are loaded from environment variables for security
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase app with configuration
const app = initializeApp(firebaseConfig);

// Initialize Firestore database instance
const db = getFirestore(app);

// Initialize Cloud Storage instance for file uploads
const storage = getStorage(app);

// Export database and storage instances for use in other modules
export { db, storage };

/**
 * Generates a unique student ID with auto-incrementing format
 * 
 * Format: YY-XXXXX (e.g., "25-00001", "25-00002")
 * - YY: Last two digits of current year
 * - XXXXX: 5-digit incrementing number, padded with zeros
 * 
 * This function queries existing students to find the highest
 * increment number and generates the next available ID.
 * 
 * @returns {Promise<string>} - The generated student ID
 * @throws {Error} - If there's an error querying the database
 */
export async function generateStudentId() {
  // Get current year and extract last two digits
  const year = new Date().getFullYear().toString().slice(-2); // e.g., "25"
  const prefix = `${year}-`;

  // Query students with IDs starting with the current year prefix
  // This ensures we only look at students from the current year
  const studentsRef = collection(db, "students");
  const q = query(
    studentsRef,
    where("studentId", ">=", prefix), // Greater than or equal to year prefix
    where("studentId", "<", `${year}-99999`) // Less than next year's prefix
  );
  const snapshot = await getDocs(q);

  // Find the highest increment number among existing students
  let maxIncrement = 0;
  snapshot.forEach(doc => {
    const id = doc.data().studentId;
    if (id && id.startsWith(prefix)) {
      // Extract the increment part (after the dash)
      const increment = parseInt(id.split("-")[1], 10);
      if (increment > maxIncrement) maxIncrement = increment;
    }
  });

  // Generate new ID by incrementing the highest found number
  // Pad with zeros to ensure 5-digit format
  const newId = `${year}-${String(maxIncrement + 1).padStart(5, '0')}`;
  return newId;
}

/**
 * Fetches students by their class ID
 * 
 * Class IDs follow the format: classroomId_shift
 * Examples: "room101_morning", "room102_afternoon"
 * 
 * This function is used to get all students assigned to a specific
 * classroom and shift combination.
 * 
 * @param {string} classId - The classId to filter students by (format: classroomId_shift)
 * @returns {Promise<Array<{ id: string, firstName: string, lastName: string, studentId: string }>>}
 *         - Array of student objects with basic information
 * @throws {Error} - If there's an error querying the database
 */
export async function fetchStudentsByClassId(classId) {
  // Reference to the students collection
  const studentsRef = collection(db, "students");
  
  // Create query to filter students by classId
  const q = query(studentsRef, where("classId", "==", classId));
  
  // Execute the query
  const snapshot = await getDocs(q);
  
  // Transform the query results into a clean array of student objects
  const students = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    students.push({
      id: doc.id, // Firestore document ID
      firstName: data.firstName,
      lastName: data.lastName,
      studentId: data.studentId, // Custom student ID (e.g., "25-00001")
    });
  });
  
  return students;
}
