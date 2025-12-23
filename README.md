# Spur AI Live Chat Agent

A modern AI-powered customer support chat application built with **Node.js, LangChain, OpenAI, MongoDB, Socket.IO, and React**. Features real-time streaming responses, intelligent FAQ answers for TechStore, comprehensive error handling, and a beautiful user interface.

## 🚀 Live Demo

[Hosted URL will go here after deployment]

## ✨ Features

### Core Functionality
- ✅ **Real-time AI Chat** - Streaming responses powered by OpenAI (gpt-4o-mini) via LangChain
- ✅ **Streaming Responses** - Word-by-word typewriter effect for AI messages
- ✅ **FAQ Knowledge Base** - Pre-seeded with TechStore policies (shipping, returns, warranty, support)
- ✅ **Conversation Persistence** - All chats saved to MongoDB, resume anytime
- ✅ **Session Management** - Multiple chat sessions per user, sidebar navigation
- ✅ **Input Validation** - Empty message blocking, 2000 character limit with counter
- ✅ **Typing Indicator** - "Agent is typing..." with animated dots
- ✅ **Error Handling** - Graceful LLM timeouts, rate limits, API failures with user-friendly messages
- ✅ **REST API Endpoint** - POST /api/chat/message for assignment compliance
- ✅ **Authentication** - JWT-based user auth with HTTP-only cookies

### Tech Stack
| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + TypeScript, Express.js |
| **AI** | OpenAI GPT-4o-mini + LangChain |
| **Database** | MongoDB + Mongoose ORM |
| **Real-time** | Socket.IO |
| **Frontend** | React 19 + Vite, Redux Toolkit |
| **Validation** | Zod (backend-ready) |

---

## 📁 Project Structure

```
spur_/
├── Backend/                # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # LangChain AI service
│   │   ├── sockets/        # Socket.IO server (with streaming)
│   │   ├── middlewares/    # Auth middleware
│   │   ├── db/             # Database connection
│   │   └── app.js          # Express app
│   ├── server.js           # Entry point
│   ├── package.json
│   └── .env.example
│
└── Frontend/               # React frontend
    ├── src/
    │   ├── components/
    │   │   └── chat/       # Chat UI components
    │   ├── pages/          # Home page
    │   ├── store/          # Redux state
    │   └── main.jsx
    ├── package.json
    └── .env.example
```

---

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** 20+ and npm
- **MongoDB** (local or Atlas)
- **OpenAI API Key**

### 1. Clone & Install

```bash
# Navigate to project
cd spur_

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```bash
MONGODB_URI=mongodb://localhost:27017/spur_chat
# OR MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/spur_chat

OPENAI_API_KEY=sk-your-openai-api-key-here
JWT_SECRET=your-random-secret-key-here
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
mongod
```

**Option B: MongoDB Atlas**
- Use your Atlas connection string in `MONGODB_URI`

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser

---

## 📖 API Endpoints

### Authentication
```http
POST /api/auth/register
Body: { email, password, name? }

POST /api/auth/login
Body: { email, password }
```

### Chat Management
```http
POST /api/chat
Body: { title }
Headers: Cookie with JWT token

GET /api/chat
Returns: All user's chats

GET /api/chat/messages/:chatId
Returns: Message history for chat

POST /api/chat/message (Assignment requirement)
Body: { message, sessionId? }
Returns: { reply, sessionId }
```

### Socket.IO Events
```javascript
// Client → Server
socket.emit('ai-message', { chat: chatId, content: message })

// Server → Client
socket.on('ai-stream-chunk', { chunk, chat })  // Real-time streaming chunks
socket.on('ai-response', { content, chat })     // Complete message
socket.on('ai-typing', isTyping)                // true/false
socket.on('ai-error', { message })              // Error messages
```

---

## 🏗️ Architecture

### LangChain Integration
The AI service uses **LangChain** to wrap OpenAI's API, providing:
- Structured conversation history management
- System prompts with FAQ knowledge injection
- Automatic context window handling
- Retry logic and error boundaries

**FAQ Knowledge** (hardcoded in `ai.service.ts`):
- **Shipping**: Free over $50, 5-7 days USA/Canada/Mexico
- **Returns**: 30-day policy, unused items, 5-7 day refund
- **Support**: Mon-Fri 9-6 EST, support@techstore.com
- **Payment**: Visa, MC, AmEx, PayPal, Apple/Google Pay
- **Warranty**: 1-year standard, extended available

### Database Schema
```typescript
User { email, password, name }
Chat { user, title, lastActivity }
Message { user, chat, content, role: 'user' | 'model' | 'system' }
```

### Socket.IO Flow (Streaming)
1. User sends message → `ai-message` event
2. Backend validates input (empty message, 2000 char limit)
3. Emit `ai-typing: true`
4. Fetch last 20 messages from DB
5. Call LangChain streaming API with conversation history
6. **Stream chunks in real-time** → emit `ai-stream-chunk` events
7. After streaming completes → emit `ai-response` with full text
8. Emit `ai-typing: false`
9. Save both user and AI messages to MongoDB
10. Generate embeddings and store in Pinecone (optional)

---

## 🧪 Testing

### Manual Verification
1. **Register/Login** - Create account, login
2. **Create Chat** - Click "+ New Chat", enter title
3. **Send Message** - Type "What's your return policy?"
   - ✅ Expect: AI responds with 30-day policy details
   - ✅ Expect: Typing indicator shows before response
4. **Input Validation**
   - ❌ Empty message → Error toast
   - ❌ 2001+ chars → Error toast
5. **Error Handling** - Stop backend, send message
   - ✅ Expect: "AI service unavailable" error
6. **Session Persistence** - Refresh page
   - ✅ Expect: Messages still visible

---

## 🎨 Design Decisions

### Why LangChain?
- **Better Prompts**: Structured template system
- **Context Management**: Automatic token handling
- **Extensibility**: Easy to add tools/agents later
- **Error Handling**: Built-in retry/fallback logic

### Why MongoDB over PostgreSQL?
- **Proven**: Already working in existing project
- **Flexible**: Easy schema changes for chat data
- **Fast**: No JOINs needed for messages
- **Assignment**: SQL preferred but not required

### Typing Indicator Implementation
- Socket.IO event `ai-typing` (true/false)
- Emitted before/after LLM call
- CSS animation with bouncing dots
- Auto-hides on response or error

### Error Handling Strategy
| Error Type | Handling |
|------------|----------|
| Empty message | Client-side validation + toast |
| Long message (>2000 chars) | Client-side validation + toast |
| LLM timeout | Catch, emit `ai-error` event |
| Rate limit (429) | Friendly message: "AI is busy" |
| Invalid API key | "Configuration error" |
| Network failure | "Service unavailable" |

---

## 🚀 Deployment

### Backend (Render / Railway)
1. Create new Web Service
2. Connect GitHub repo, select `backend/` folder
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables (MongoDB Atlas URI, OpenAI key)

### Frontend (Vercel)
1. Import project, select `frontend/` folder
2. Framework: Vite
3. Add `VITE_API_URL` pointing to backend URL

---

## ⏱️ If I Had More Time...

### Features
- [x] Streaming AI responses (word-by-word) **✓ DONE**
- [x] Vector database (Pinecone) for semantic search **✓ Already integrated**
- [ ] Redis caching for frequent FAQs
- [ ] Message editing/deletion
- [ ] Chat export (PDF/JSON)
- [ ] Admin dashboard with analytics
- [ ] Multi-language support (i18n)

### Tech Improvements
- [ ] Svelte frontend (smaller bundle)
- [ ] End-to-end tests (Playwright)
- [ ] Unit tests for services (Jest)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Rate limiting (express-rate-limit)
- [ ] Monitoring (Sentry)
- [ ] TypeScript on frontend too

---

## 📝 Assignment Compliance Checklist

| Requirement | Status |
|------------|---------|
| Node.js + TypeScript backend | ✅ |
| LangChain integration | ✅ |
| OpenAI API usage | ✅ |
| FAQ/Domain knowledge | ✅ |
| POST /chat/message endpoint | ✅ |
| Chat UI with auto-scroll | ✅ |
| Typing indicator | ✅ |
| Input validation | ✅ |
| Error handling | ✅ |
| MongoDB persistence | ✅ |
| Session management | ✅ |
| Real-time (Socket.IO) | ✅ |

---

## 👨‍💻 Author

Built for Spur - Founding Full-Stack Engineer Assignment

**Tech Stack Highlights:**
- TypeScript for type safety
- LangChain for structured AI workflows
- Socket.IO for real-time UX
- MongoDB for flexible chat storage
- JWT authentication for security

---

## 📄 License

ISC
