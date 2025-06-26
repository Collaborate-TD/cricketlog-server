# 🏏 Video Annotation Platform for Cricket Coaching
**Empowering coaches to deliver structured, visual, and personalized feedback for better cricket performance.**

---

## 📱 Overview

The **Video Annotation Platform for Cricket Coaching** is a mobile-first application developed in collaboration with [Become Better](https://www.becomebetter.ca), designed to help cricket coaches provide efficient and effective feedback during training sessions. Coaches can record, annotate, and manage student sessions—all in one intuitive interface.

> This is a **Phase 1** release focusing on manual video feedback tools. AI-powered features will follow in **Phase 2**.

---

## 🚀 Key Features

- 🔐 **Secure Login**  
  Sign in via email or social accounts

- 🧑‍🏫 **Coach Management**  
  Manage a list of coaches and their assigned students  
  Supports a **many-to-many relationship**:
  - One coach can be assigned to **multiple students**
  - One student can be trained by **multiple coaches**  
  View and switch between coach profiles and associated student sessions

- 🎯 **Student Management**  
  Select from a list of enrolled students  
  View student profiles and previous sessions

- 🖼️ **Profile Picture Upload**  
  Coaches and students can upload profile pictures  
  Images are stored securely and displayed across the app interface

- 📹 **Video Recording**  
  Capture short 5-second clips during training
  Videos by student and coach and automatically stored under student and coach sessions

- 🖊️ **Annotation Tools**  
  Pause, draw, and slow-motion tools for video feedback  
  Add text notes, voice notes, and suggest drills

- 📁 **Drill Library**  
  Access structured cricket drills  
  Assign specific drills based on performance issues

---

## 🔐 Authentication & Roles

The application supports **role-based access control** with two primary user roles:

| Role    | Access Permissions                                                                 |
|---------|-------------------------------------------------------------------------------------|
| Coach   | Can record videos, annotate sessions, assign drills, and manage student connections |
| Student | Can view their session videos and coach feedback, and review assigned drills       |

### 🔑 Login Flow

- On login, users are authenticated and redirected to their role-specific dashboard.  
- Role is determined based on the user document in the database.

---

## 🛠️ Tech Stack

| Area              | Technology                  |
|-------------------|-----------------------------|
| Frontend          | React Native (Expo)         |
| Backend           | Node.js + Express           |
| Database          | MongoDB + Mongoose          |
| Storage           | Multer + Local FS (Phase 1) |
| Design            | Miro                        |
| Annotation Engine | Expo Camera + SVG Overlay   |

---

## 🎓 Skills Gained by Contributors

- Full-stack app development with video/audio handling  
- Role-based login + many-to-many data modeling  
- Real-world UX design in a sports coaching domain  
- REST API design & Mongoose schema modeling  
- Preparation for AI/ML feature extension in sports tech
