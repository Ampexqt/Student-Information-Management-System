import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };

export async function generateStudentId() {
  const year = new Date().getFullYear().toString().slice(-2); // e.g., "25"
  const prefix = `${year}-`;

  // Query students with IDs starting with the current year prefix
  const studentsRef = collection(db, "students");
  const q = query(
    studentsRef,
    where("studentId", ">=", prefix),
    where("studentId", "<", `${year}-99999`)
  );
  const snapshot = await getDocs(q);

  // Find the highest increment so far
  let maxIncrement = 0;
  snapshot.forEach(doc => {
    const id = doc.data().studentId;
    if (id && id.startsWith(prefix)) {
      const increment = parseInt(id.split("-")[1], 10);
      if (increment > maxIncrement) maxIncrement = increment;
    }
  });

  // Generate new ID
  const newId = `${year}-${String(maxIncrement + 1).padStart(5, '0')}`;
  return newId;
}
