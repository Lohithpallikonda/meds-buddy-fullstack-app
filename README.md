
-----

# MedsBuddy - Full-Stack Medication Management System

MedsBuddy is a comprehensive, full-stack web application designed to help patients and caretakers manage medication schedules with ease and accuracy. It features role-based dashboards, robust medication tracking, real-time notifications, and secure communication to ensure medication adherence and provide peace of mind.

This project was built to fulfill all mandatory and optional requirements of the Website Learners assignment, demonstrating a modern technology stack and best practices in web development.

-----

## Key Features

  - **Secure Role-Based Authentication**: JWT-powered signup and login system for both `Patient` and `Caretaker` roles, with all user data securely stored and passwords hashed.
  - **Dynamic Real-Time Dashboard**: A central hub that displays today's medication schedule, adherence statistics, and a medication streak, all updated live via WebSockets without needing a page refresh.
  - **Complete Medication CRUD**: Full Create, Read, Update, and Delete functionality for medications, including name, dosage, and frequency.
  - **Daily Adherence Tracking**: Easily mark medications as "Taken" or "Missed". The system calculates and displays adherence percentages and streaks to motivate users.
  - **Photo Proof Upload**: Users can upload an image as proof of taking a medication, which is securely stored and displayed on the medication card.
  - **Live Notification Center**: An integrated, real-time notification system that alerts users to medication reminders, adherence warnings, and system messages.
  - **Real-Time Messaging**: A foundational real-time chat system allowing for direct communication between users (e.g., a patient and their assigned caretaker).
  - **Persistent Data Storage**: All application data is stored in a persistent SQLite database, ensuring user information and medication logs are never lost.
  - **Responsive Design**: A clean, modern, and fully responsive user interface that works seamlessly on desktop, tablet, and mobile devices.

-----

## Technology Stack

### **Frontend**

  - **React**: A JavaScript library for building user interfaces.
  - **Vite**: A modern, fast build tool and development server.
  - **React Query**: For efficient server state management, caching, and data fetching.
  - **React Router**: For client-side routing and navigation.
  - **Axios**: For making HTTP requests to the backend API.
  - **Socket.IO Client**: For handling real-time WebSocket communication.
  - **Vitest & React Testing Library**: For comprehensive unit and component testing.

### **Backend**

  - **Node.js**: A JavaScript runtime environment for the server-side.
  - **Express.js**: A web server framework for building the RESTful API.
  - **SQLite**: A lightweight, file-based relational database.
  - **Socket.IO**: For enabling real-time, bidirectional event-based communication.
  - **JSON Web Tokens (JWT)**: For generating and verifying secure authentication tokens.
  - **bcryptjs**: For securely hashing user passwords.
  - **Multer**: For handling file uploads from the client.
  - **Jest**: For backend unit and integration testing.

-----

## Application Screenshots

*(It is highly recommended to replace these placeholders with actual screenshots of your running application. You can drag and drop images directly into the GitHub editor.)*

| Login Page | Dashboard View |
| :---: | :---: |
| *[Screenshot of the Login Page]* | *[Screenshot of the main Dashboard]* |

| Add Medication Modal | Medications Page |
| :---: | :---: |
| *[Screenshot of the Add Medication form]* | *[Screenshot of the My Medications list]* |

-----

## Local Development Setup

To run this project on your local machine, please follow the steps below.

### Prerequisites

  - [Node.js](https://nodejs.org/) (v16 or higher recommended)
  - [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1\. Clone the Repository

```bash
git clone https://github.com/your-username/meds-buddy-fullstack-app.git
cd meds-buddy-fullstack-app
```

### 2\. Backend Setup

Navigate to the backend directory, install dependencies, set up your environment variables, and start the server.

```bash
# Move into the backend folder
cd backend

# Install all required packages
npm install
```

Next, create a `.env` file in the `backend` directory and add the following content.
**File: `backend/.env`**

```
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-that-is-long-and-random
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Finally, start the backend development server.

```bash
npm run dev
```

The backend API will be running on `http://localhost:5000`.

### 3\. Frontend Setup

Open a **new terminal window**, navigate to the frontend directory, install dependencies, and start the client.

```bash
# Move into the frontend folder
cd frontend

# Install all required packages
npm install

# Start the frontend development server
npm run dev
```

The React application will be available at `http://localhost:3000`. The Vite server is pre-configured to proxy API requests to the backend.

-----

## Running Tests

The project includes a suite of tests for both the frontend and backend to ensure code quality and correctness.

### Backend Tests

To run the backend tests using Jest:

```bash
# Navigate to the backend directory
cd backend

# Run the test script
npm test
```

### Frontend Tests

To run the frontend tests using Vitest:

```bash
# Navigate to the frontend directory
cd frontend

# Run the test script
npm test
```

-----

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.
