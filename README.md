# Interview Prep Coach

An intelligent interview preparation platform powered by AI that helps candidates practice behavioral and technical interview questions with personalized feedback and performance analytics.

## 📋 Table of Contents

- [Project Description](#project-description)
- [Problem & Solution](#problem--solution)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup & Installation](#setup--installation)
- [Usage Instructions](#usage-instructions)
- [Project Structure](#project-structure)

## 🎯 Project Description

Interview Prep Coach is a full-stack web application designed to help job candidates prepare for technical and behavioral interviews. The platform provides an interactive environment where users can:

- Practice answering interview questions
- Record and transcribe their responses
- Receive AI-powered feedback on their answers
- Track their performance across multiple practice sessions
- Identify communication patterns and biases
- Build and manage their professional profile and resume

The application combines modern web technologies with AI capabilities to create a personalized, adaptive learning experience for interview preparation.

## 💡 Problem & Solution

### The Problem

Preparing for interviews is challenging because:

- Candidates lack access to real-time feedback on their responses
- Identifying communication weaknesses (hedging, apologizing, unclear storytelling) is difficult without expert guidance
- Consistent practice requires significant time investment and mock interview partners
- Many candidates struggle with the STAR method (Situation, Task, Action, Result) framework
- Performance tracking across multiple practice sessions is not standardized

### Our Solution

Interview Prep Coach addresses these challenges by:

1. **AI-Powered Feedback**: Using Google Generative AI to analyze responses against the STAR framework and provide actionable insights
2. **Pattern Recognition**: Detecting communication biases and suggesting improvements
3. **Performance Analytics**: Tracking progress over time with detailed metrics and visualizations
4. **Adaptive Learning**: Offering questions at various difficulty levels tailored to users' experience levels
5. **Resume Integration**: Allowing candidates to upload and reference their resumes during practice
6. **User Authentication**: Supporting multiple authentication methods (email, Google, GitHub)

## ✨ Features

### User Management

- **Authentication**: Sign up with email or OAuth (Google/GitHub)
- **Profile Building**: Create professional profiles with target role, experience level, bio, and avatar customization
- **Resume Management**: Upload and manage resumes for context during practice

### Practice Sessions

- **Curated Question Bank**: Extensive library of behavioral and technical interview questions
- **Difficulty Filtering**: Practice questions at beginner, intermediate, or advanced levels
- **Multiple Session Types**: Support for different interview formats and question categories

### Interview Practice

- **Audio Recording**: Record spoken responses to interview questions
- **Real-time Transcription**: Convert audio to text automatically
- **STAR Evaluation**: Score responses on Situation, Task, Action, and Result components
- **AI Feedback**: Receive detailed, constructive feedback from Claude AI

### Analytics & Progress

- **Performance Dashboard**: Visualize progress with charts and metrics
- **Session Reviews**: Detailed breakdown of past practice sessions
- **Bias Pattern Detection**: Identify communication patterns like hedging and unnecessary apologies
- **Score Tracking**: Monitor improvement across multiple attempts

### Profile Features

- **Customizable Avatar**: Choose shapes and colors for profile personalization
- **Interview History**: View all past practice sessions and attempts

## 🛠️ Technologies Used

### Frontend

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React icons
- **Charts**: Recharts for data visualization
- **Theme**: next-themes for dark/light mode support
- **AI Integration**: Google Generative AI, OpenAI API

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js (OAuth 2.0)
  - Google OAuth 2.0
  - GitHub OAuth 2.0
- **Password Security**: bcryptjs for hashing
- **File Upload**: Multer for resume uploads
- **AI Integration**: Google Generative AI
- **Development**: nodemon, tsx for development server

### DevOps & Tools

- **Package Manager**: npm
- **Build Tool**: TypeScript compiler
- **Version Control**: Git
- **Database Migrations**: Prisma Migrations

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git
- Google OAuth credentials (for Google Sign-In)
- GitHub OAuth credentials (for GitHub Sign-In)
- Google Generative AI API key
- OpenAI API key (optional, for additional AI features)

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/colorstackwinterhack2025-Interview-Prep-Coach.git
   cd colorstackwinterhack2025-Interview-Prep-Coach
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

### Backend Setup

3. **Navigate to backend directory**

   ```bash
   cd backend
   ```

4. **Install backend dependencies**

   ```bash
   npm install
   ```

5. **Configure environment variables**

   Create a `.env` file in the `backend` directory:

   ```
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/interview_prep_coach"

   # Authentication
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   GITHUB_CLIENT_ID="your_github_client_id"
   GITHUB_CLIENT_SECRET="your_github_client_secret"

   # AI APIs
   GOOGLE_API_KEY="your_google_generative_ai_key"
   OPENAI_API_KEY="your_openai_api_key"

   # JWT Secret (for session tokens)
   JWT_SECRET="your_secret_key_here"

   # Server
   PORT=5000
   NODE_ENV=development
   ```

6. **Set up PostgreSQL database**

   ```bash
   # Create a new PostgreSQL database
   createdb interview_prep_coach
   ```

7. **Run database migrations**

   ```bash
   npm run prisma migrate deploy
   ```

8. **Seed the database with sample questions (optional)**

   ```bash
   npm run seed
   ```

9. **Start the backend server**
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

### Frontend Setup

10. **In a new terminal, navigate to frontend directory**

    ```bash
    cd frontend
    ```

11. **Install frontend dependencies**

    ```bash
    npm install
    ```

12. **Configure environment variables**

    Create a `.env.local` file in the `frontend` directory:

    ```
    NEXT_PUBLIC_API_URL="http://localhost:5000"
    NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id"
    NEXT_PUBLIC_OPENAI_API_KEY="your_openai_api_key"
    NEXT_PUBLIC_GOOGLE_API_KEY="your_google_generative_ai_key"
    ```

13. **Start the frontend development server**

    ```bash
    npm run dev
    ```

    The frontend will run on `http://localhost:3000`

14. **Access the application**

    Open your browser and navigate to `http://localhost:3000`

## 📖 Usage Instructions

### Getting Started

1. **Create an Account**

   - Visit the signup page
   - Choose to sign up with email, Google, or GitHub
   - Complete your profile with target role and experience level

2. **Set Up Your Profile**

   - Go to the Profile section
   - Customize your avatar (shape and color)
   - Add a bio and location
   - Upload your resume

3. **Start Practicing**
   - Navigate to the Practice section
   - Browse available interview questions
   - Filter by difficulty level (Beginner, Intermediate, Advanced)
   - Select a question to begin practicing

### Answering Interview Questions

1. **Select a Question**

   - Choose from the available question bank
   - Read the question carefully

2. **Record Your Response**

   - Click the "Record" button
   - Speak your answer naturally
   - Click "Stop" when finished
   - Your response will be automatically transcribed

3. **Submit Your Answer**

   - Review the transcription for accuracy
   - Submit your response to receive AI feedback

4. **Review Feedback**
   - Receive detailed feedback on your STAR score components:
     - **Situation**: How well you set the context
     - **Task**: Clarity of the challenge you faced
     - **Action**: Quality of the steps you took
     - **Result**: Strength of your outcome
   - View identified communication patterns
   - Get personalized improvement suggestions

### Tracking Progress

1. **View Your Dashboard**

   - Check your analytics dashboard
   - Monitor your performance trends over time
   - View all past practice sessions

2. **Session Reviews**

   - Click on any past session to view details
   - Review feedback and scores
   - Compare attempts on the same question

3. **Performance Analytics**
   - Visualize your improvement with charts
   - Identify your strongest and weakest areas
   - Set goals based on your performance data

### Managing Your Content

1. **Resume Management**

   - Upload and update your resume in the Profile section
   - Use your resume as reference during practice

2. **Interview History**
   - Access all your past attempts
   - Filter by question, difficulty, or date
   - Review previous feedback anytime

## 📁 Project Structure

```
colorstackwinterhack2025-Interview-Prep-Coach/
├── backend/                          # Express.js backend
│   ├── src/
│   │   ├── index.ts                 # Main server file
│   │   ├── db_connection.ts         # Database connection
│   │   ├── config/
│   │   │   ├── passport.ts          # OAuth configuration
│   │   │   └── prompts.ts           # AI prompt templates
│   │   ├── routes/                  # API route handlers
│   │   │   ├── auth.routes.ts
│   │   │   ├── session.routes.ts
│   │   │   ├── practice.routes.ts
│   │   │   ├── questions.routes.ts
│   │   │   ├── feedback.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   ├── attempts.routes.ts
│   │   │   └── profile.routes.ts
│   │   └── services/                # Business logic and middleware
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   ├── questions.json           # Question bank data
│   │   ├── seed.ts                  # Database seeding script
│   │   └── migrations/              # Database migrations
│   ├── generated/                   # Prisma client (auto-generated)
│   ├── uploads/                     # User-uploaded files (resumes, etc.)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                         # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Home page
│   │   │   ├── layout.tsx           # Root layout
│   │   │   ├── auth/                # Authentication pages
│   │   │   ├── login/               # Login page
│   │   │   ├── signup/              # Signup page
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   ├── practice/            # Practice interface
│   │   │   ├── analytics/           # Performance analytics
│   │   │   ├── feedback/            # Feedback display
│   │   │   ├── profile/             # User profile
│   │   │   ├── Resume/              # Resume management
│   │   │   └── session-review/      # Session review page
│   │   ├── components/              # Reusable UI components
│   │   ├── context/                 # React context providers
│   │   └── globals.css              # Global styles
│   ├── public/                      # Static assets
│   ├── types/                       # TypeScript type definitions
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── tailwind.config.js
│
├── package.json
└── README.md                        # This file
```

## 🔑 Key API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with email
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

### Practice Sessions

- `GET /api/session` - Get all sessions
- `POST /api/session` - Create new session
- `GET /api/session/:id` - Get session details
- `PUT /api/session/:id` - Update session

### Questions

- `GET /api/questions` - Get all questions
- `GET /api/questions?difficulty=intermediate` - Filter by difficulty
- `GET /api/questions/:id` - Get specific question

### Feedback & Attempts

- `POST /api/feedback` - Submit answer for feedback
- `GET /api/attempts/:userId` - Get user's attempts
- `GET /api/attempts/:userId/:questionId` - Get attempts on specific question

### Analytics

- `GET /api/analytics/performance` - Get performance metrics
- `GET /api/analytics/trends` - Get progress trends

### Profile

- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `POST /api/profile/resume` - Upload resume

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is part of ColorStack Winter Hackathon 2025.

## 🎓 Support

For questions or support, please reach out to the development team or open an issue in the repository.

---

**Happy interview practicing! 🚀**
