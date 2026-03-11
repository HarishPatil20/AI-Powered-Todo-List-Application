# 🤖 AI-Powered Todo / Routine Assistant

An **AI-powered productivity web application** that helps users manage daily tasks, track routines, and interact with an AI assistant for better productivity.

This project combines **modern web technologies, backend APIs, database management, and AI integration** to create a smart task management system.

---

## 🚀 Live Demo

Frontend (Netlify / Vercel):
🔗 **[Add Frontend Link Here]**

Backend API (Render):
🔗 **[Add Backend API Link Here]**

---

## 🧠 Features

### ✅ User Authentication

* Secure **Signup / Login**
* User-based task storage
* Each user sees only their own tasks

### 📋 Task Management

* Add new tasks
* Update tasks
* Delete tasks
* Mark tasks as completed
* Task categories and time scheduling

### 📊 Dashboard Analytics

* Visual charts for task progress
* Productivity insights

### 🤖 AI Chat Assistant

* Integrated with **Google Gemini AI**
* Helps with:

  * Daily planning
  * Productivity tips
  * Routine suggestions
  * Task assistance

### 🔔 Task Reminders

* Reminder notifications for scheduled tasks

---

## 🛠 Tech Stack

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS

### Backend

* Go (Golang)
* Gin Framework

### Database

* MongoDB Atlas

### AI Integration

* Google Gemini API

### Deployment

* Backend: **Render**
* Frontend: **Netlify / Vercel**

---

## 📁 Project Structure

```
AI-Powered-Todo-List-Application
│
├── backend
│   ├── main.go
│   ├── api routes
│   └── MongoDB connection
│
├── frontend
│   ├── React + Vite app
│   ├── components
│   ├── pages
│   └── API integration
│
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file in the backend:

```
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
PORT=3000
```

---

## ▶️ Running Locally

### Backend

```
go mod tidy
go run main.go
```

Backend runs on:

```
http://localhost:3000
```

---

### Frontend

```
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 📡 API Endpoints

### Authentication

```
POST /api/auth/signup
POST /api/auth/login
```

### Tasks

```
GET /api/tasks
POST /api/tasks
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

### AI Chat

```
GET /api/chat
POST /api/chat
```

---

## 📷 Screenshots

(Add screenshots of your app UI here)

Example:

* Dashboard
* Task Manager
* AI Chat Assistant

---

## 🎯 Future Improvements

* JWT Authentication
* Push Notifications
* Mobile Responsive Enhancements
* AI Smart Task Recommendations
* Weekly Productivity Reports

---

## 👨‍💻 Author

**Harish Patil**

GitHub:
https://github.com/HarishPatil20

---

## ⭐ If you like this project

Give this repository a **star ⭐** and feel free to contribute!

