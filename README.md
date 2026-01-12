# colorstackwinterhack2025-Interview-Prep-Coach

An AI-powered behavioral interview preparation platform that helps candidates master the STAR method through real-time feedback, personalized coaching, and responsible AI guidance.

## 📋 Description

Interview Prep Coach is a comprehensive web application designed to revolutionize how job seekers prepare for behavioral interviews. The platform uses AI to provide structured feedback on interview responses, helping users refine their communication skills, build confidence, and present their experiences effectively using the STAR (Situation, Task, Action, Result) framework.

## 🎯 Alignment with Responsible AI Theme

Our project directly addresses the **Responsible AI** theme through:

### 1. **Transparent AI Feedback**

- All AI-generated feedback is clearly labeled and structured using the STAR framework
- Users receive detailed breakdowns showing exactly what the AI evaluated (checklist items, scoring criteria)
- The system highlights both strengths (green) and areas for improvement (red) in a balanced manner

### 2. **Customizable AI Behavior**

- Users control AI feedback style through preferences:
  - **Emphasis**: Balance, Clarity, Storytelling, Confidence, or Technical Depth
  - **Tone**: Encouraging, Direct, or Strict
  - **Detail Level**: Brief, Standard, or Deep
- This puts the user in control of how AI evaluates their responses

### 3. **Bias Mitigation**

- The AI focuses on objective STAR structure adherence rather than subjective qualities
- Scoring criteria are transparent: specific examples (20%), technical detail (20%), confidence (20%), speech clarity (20%), appropriate length (20%)
- The system promotes ownership through "I" statements rather than "we" statements to accurately assess individual contributions

### 4. **Educational AI**

- Rather than just scoring, the AI provides:
  - Actionable feedback with specific improvement steps
  - Example improved versions showing "what good looks like"
  - Resume-based question generation to practice real scenarios
- This empowers users to learn and improve, not just get a score

### 5. **Privacy & Data Control**

- Users can review all their past attempts and feedback
- Session data is tied to user accounts with JWT authentication
- Resume parsing happens server-side with clear consent flow

### 6. **Responsible Prompt Engineering**

- Our AI prompts ([backend/src/config/prompts.ts](backend/src/config/prompts.ts)) explicitly instruct the model to:
  - Avoid harmful stereotypes
  - Focus on technical competence and STAR adherence
  - Provide constructive, specific feedback rather than vague criticism
  - Detect and flag potential fabrication while remaining supportive

## 🛠️ Technologies Used

### Frontend

- **Next.js 15** - React framework for production
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization for analytics
- **Lucide React** - Icon library
- **Web Audio API** - Real-time audio recording and silence detection

### Backend

- **Express.js** - Node.js web framework
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Relational database
- **Supabase** - Backend-as-a-Service for storage
- **Google Generative AI (Gemini)** - AI model for feedback generation and transcription
- **Multer** - File upload handling
- **JSON Repair** - Robust JSON parsing
- **bcrypt** - Password hashing
- **JWT** - Authentication tokens
- **Passport.js** - OAuth authentication (Google, GitHub)

### AI & Analysis

- **Gemini 2.5 Flash Lite** - Interview feedback generation
- **Gemini 1.5 Flash** - Audio transcription
- **Custom Prompt Engineering** - Structured STAR method evaluation

## 📥 Setup & Installation Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Gemini API keys
- (Optional) OAuth credentials for Google/GitHub login

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/colorstackwinterhack2025-Interview-Prep-Coach.git
cd colorstackwinterhack2025-Interview-Prep-Coach
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a [backend/.env](backend/.env) file:

```dotenv
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
MATT_GEMINI_API_KEY="your-gemini-api-key-1"
FAD_GEMINI_API_KEY="your-gemini-api-key-2"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_CALLBACK_URL="http://localhost:5000/api/auth/github/callback"
FRONTEND_URL="http://localhost:3000/"
SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_KEY="your-supabase-service-key"
```

Run database migrations:

```bash
npx prisma migrate dev
npx prisma db seed
```

Start the backend server:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## 🚀 Usage Instructions and Features

### 1. **Authentication**

- Sign up with email/password or OAuth (Google/GitHub)
- Secure JWT-based session management
- See: [frontend/src/app/login/page.tsx](frontend/src/app/login/page.tsx), [frontend/src/app/signup/page.tsx](frontend/src/app/signup/page.tsx)

### 2. **Onboarding & Preferences** ([frontend/src/app/setup/page.tsx](frontend/src/app/setup/page.tsx))

- Select default role: Software Engineering, Product Management, Data Science
- Choose difficulty: Basic, Intermediate, Advanced
- Configure AI feedback preferences:
  - Emphasis (Balance, Clarity, Storytelling, etc.)
  - Tone (Encouraging, Direct, Strict)
  - Detail level (Brief, Standard, Deep)
- Set practice flow options (timer, auto-submit, countdown)

### 3. **Practice Sessions** ([frontend/src/app/practice/page.tsx](frontend/src/app/practice/page.tsx))

- **Two input modes**:
  - **Voice Recording**: Record audio answers with real-time silence detection
  - **Text Input**: Type responses directly
- **Smart session management**: 4 questions per session, locked settings during active practice
- **Real-time feedback**: Timer, recording status, audio level visualization
- See: [backend/src/routes/feedback.routes.ts](backend/src/routes/feedback.routes.ts)

### 4. **AI Feedback & Analysis** ([frontend/src/app/feedback/[attemptId]/page.tsx](frontend/src/app/feedback/[attemptId]/page.tsx))

Each submission receives:

- **STAR Structure Score** (0-100): Visual circular progress indicator
- **Performance Checklist**:
  - ✓ Specific examples provided
  - ✓ No negative language detected
  - ✓ Clean speech (no filler words)
  - ✓ Technical detail present
  - ✓ Appropriate length
- **Transcript Analysis**: Highlighted strengths and weaknesses
- **Actionable Feedback**: Concrete steps to improve
- **Improved Version**: AI-rewritten answer showing best practices

### 5. **Resume Upload & Parsing** ([frontend/src/app/Resume/page.tsx](frontend/src/app/Resume/page.tsx))

- Upload PDF resume via [Account settings](frontend/src/app/profile/account/page.tsx)
- AI parses resume into structured data:
  - Headline, summary, skills
  - Work experience with bullets
  - Projects with tech stack
  - Education details
- **Generate Interview Questions**: AI creates tailored behavioral questions based on your resume
- **Practice Answers**: Write and critique responses to resume-based questions
- See: [backend/src/services/resume-parser.service.ts](backend/src/services/resume-parser.service.ts)

### 6. **Analytics Dashboard** ([frontend/src/app/analytics/page.tsx](frontend/src/app/analytics/page.tsx))

- **Performance over time**: Line chart showing score trends
- **Areas for improvement**: Bar chart of common issues (filler words, lack of detail, etc.)
- **Session history**: Filterable table by date range and category
- **Progress tracking**: Average scores, total sessions, trends

### 7. **Session Review** ([frontend/src/app/session-review/[sessionId]/page.tsx](frontend/src/app/session-review/[sessionId]/page.tsx))

- View all 4 attempts from a completed practice session
- Click any question to see detailed feedback
- Track improvement across multiple practice rounds

### 8. **Profile Management** ([frontend/src/app/profile/page.tsx](frontend/src/app/profile/page.tsx))

- **Personal Info**: Name, display name, location, bio
- **Avatar Customization**: Shape (circle/square), border color
- **Dark Mode**: Toggle theme preference
- **Account Settings**: Email, password, OAuth connections, resume upload
- **Preferences**: Detailed AI feedback configuration

### 9. **Question Bank** ([frontend/src/app/questions/page.tsx](frontend/src/app/questions/page.tsx))

- Browse 100+ curated behavioral questions
- Filter by category (Behavioral, Technical, System Design)
- Filter by difficulty (Basic, Intermediate, Advanced)
- Start practice directly from any question

## 🧠 How Our Project Solves Interview Preparation Challenges

### Problem 1: **Lack of Structured Feedback**

**Solution**: Our AI provides detailed, structured feedback using the industry-standard STAR framework. Instead of vague "good job" or "needs work," candidates receive:

- Specific percentages for each STAR component
- Highlighted text showing exactly what was strong/weak
- Concrete action items for improvement

### Problem 2: **Expensive Interview Coaching**

**Solution**: Professional interview coaching costs $100-300/session. Our platform provides unlimited practice with AI feedback for free, democratizing access to quality interview preparation.

### Problem 3: **Generic Practice Questions**

**Solution**: The resume parsing feature ([backend/src/services/resume-parser.service.ts](backend/src/services/resume-parser.service.ts)) generates personalized questions based on YOUR actual experiences, making practice more relevant and effective.

### Problem 4: **No Progress Tracking**

**Solution**: The [analytics dashboard](frontend/src/app/analytics/page.tsx) tracks performance over time, identifies patterns in weaknesses (e.g., consistent filler word usage), and shows measurable improvement.

### Problem 5: **Nervousness & Lack of Confidence**

**Solution**:

- Customizable AI tone lets users start with "Encouraging" feedback and gradually move to "Strict" as confidence builds
- Recording mode simulates real interview pressure with countdown timers
- Repeated practice with immediate feedback builds muscle memory for confident delivery

### Problem 6: **Difficulty Articulating Impact**

**Solution**: The AI specifically evaluates and coaches on:

- Using "I" statements vs. "we" statements to claim ownership
- Including quantifiable metrics in the Result section
- Avoiding vague language and providing technical specifics
- See prompt configuration: [backend/src/config/prompts.ts](backend/src/config/prompts.ts)

## 👥 Team Members & Contributions

<!-- Add your team members here -->

- **[Team Member 1]** - [Role/Contributions]
- **[Team Member 2]** - [Role/Contributions]
- **[Team Member 3]** - [Role/Contributions]
- **[Team Member 4]** - [Role/Contributions]

## 🎥 Demo Video & Screenshots

### Demo Video

<!-- Add your demo video link here -->

🎬 [Watch Demo Video](your-video-link-here)

### Screenshots

<!-- Add your screenshots here -->

#### Dashboard

![Dashboard Screenshot](path/to/dashboard-screenshot.png)
_Main dashboard showing session statistics and progress_

#### Practice Session

![Practice Screenshot](path/to/practice-screenshot.png)
_Live interview practice with recording or typing mode_

#### AI Feedback

![Feedback Screenshot](path/to/feedback-screenshot.png)
_Detailed STAR structure analysis with highlighted transcript_

#### Analytics

![Analytics Screenshot](path/to/analytics-screenshot.png)
_Performance trends and improvement areas visualization_

#### Resume Parser

![Resume Screenshot](path/to/resume-screenshot.png)
_AI-powered resume parsing and question generation_

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/colorstackwinterhack2025-Interview-Prep-Coach/issues).

## 🌟 Acknowledgments

- ColorStack for organizing the Winter Hackathon 2025
- Google Gemini AI for powerful language models
- The interview preparation community for inspiration

---

**Built with ❤️ for ColorStack Winter Hackathon 2025**
