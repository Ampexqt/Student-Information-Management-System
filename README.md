# 🎓 Student Information Management System (SIMS)

A simple, web-based system for managing students, classes, and classrooms—designed for junior high schools with shift-based schedules.

---

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone <repository-url>
   cd Student-Information-Management-System
   npm install
   ```
2. **Set Up Firebase**
   - Create a Firebase project.
   - Add a `.env` file in the root:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```
3. **Run the App**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ✨ Features

- **Shift-Based Scheduling**
  - Grades 7 & 8: Morning (7:00 AM – 11:59 AM)
  - Grades 9 & 10: Afternoon (12:00 PM – 5:00 PM)
- **Class Management**
  - Auto shift assignment, time validation, subject & teacher assignment, conflict detection
- **Student Management**
  - Grade-based enrollment, class capacity, detailed student profiles
- **Classroom Management**
  - Room reuse between shifts, building/room tracking
- **Live Updates**
  - Real-time sync with Firebase

---

## 🖥️ How to Use

### Step 1: Add Classrooms (Required First)
1. Go to **Classroom Management**
2. Click **Add Classroom**
3. Enter building name, floor, and room number
4. Save the classroom

### Step 2: Add Classes
1. Go to **Class Management**
2. Click **Add Class**
3. Select grade (shift auto-assigned)
4. Choose section, classroom, and schedule times
5. Assign subjects & teachers
6. Set school year & max students
7. Save

### Step 3: Add Students
1. Go to **Student Management**
2. Click **Add Student**
3. Fill in student details
4. Select grade and assign to a class
5. Save

### View Schedules
- Click **Show Schedule Overview** to see all classes by shift, with subjects, teachers, and rooms.

### Manage Students
- Monitor class capacity and student assignments in the Student Management section.

---

## ⚙️ System Rules

- **Grades 7 & 8:** 7:00 AM – 11:59 AM
- **Grades 9 & 10:** 12:00 PM – 5:00 PM
- **Classroom reuse** between shifts
- **Minimum class duration:** 30 minutes
- **Each slot:** Must have subject & teacher
- **No double-booking** classrooms in a shift

---

## 🛠️ Tech Stack

- React 19
- Firebase Firestore
- Vite
- React Icons
- React Time Picker

---

## 📚 Libraries & APIs Used

### Core Libraries
- **React** & **React DOM**: Building the user interface.
- **Vite**: Fast development server and build tool.

### UI & Styling
- **@fontsource/inter**, **@fontsource/poppins**: Custom fonts for a modern look.
- **bootstrap-icons**, **react-icons**: Icon sets for UI elements.
- **react-datepicker**, **react-time-picker**, **react-clock**: Date and time selection components.

### PDF & File Handling
- **@react-pdf/renderer**, **react-to-pdf**, **jspdf**, **html2pdf.js**: Exporting and generating PDFs.
- **cloudinary**, **react-cloudinary**: Image upload and management.

### Utilities
- **date-fns**, **dayjs**: Date and time utilities.
- **uuid**: Unique ID generation.

### Firebase (Main API)
- **firebase**: Real-time database (Firestore), file storage, and authentication.
  - All main data (students, classes, classrooms) is stored and managed in Firebase Firestore.
  - File uploads (like student images) use Firebase Storage.

### Other/Configurable APIs
- **Custom API Support**: The system can be configured to use a custom backend API via environment variables (`VITE_API_BASE_URL`), though Firebase is the default.
- **Email Service**: Configurable for notifications (see `.env` and `src/utils/config.js`).

---

## 🤝 Contributing

1. Fork & clone the repo
2. Create a branch: `git checkout -b feature/YourFeature`
3. Commit: `git commit -m 'Add YourFeature'`
4. Push: `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 📄 License

MIT License. See `LICENSE` for details.

---

## 📬 Support

- For questions or issues, open an issue in this repo.
- This system is tailored for junior high schools with shift-based schedules.
