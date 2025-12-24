# Spur AI Live Chat Agent

A modern AI-powered customer support chat application built with **Node.js, LangChain, OpenAI, MongoDB, Socket.IO, and React**. Features real-time streaming responses, intelligent FAQ answers for TechStore, comprehensive error handling, and a beautiful user interface.

## 🚀 Live Demo

**🔗 [https://spur-tha.onrender.com/](https://spur-tha.onrender.com/)**

> **Quick Login:** Visit [https://spur-tha.onrender.com/auto-login.html](https://spur-tha.onrender.com/auto-login.html) for automatic test account login

## ✨ Features

### Core Functionality
- ✅ **Real-time AI Chat** - Streaming responses powered by OpenAI (gpt-4o-mini) via LangChain
- ✅ **Streaming Responses** - Smooth word-by-word display with 100ms throttle for comfortable reading
- ✅ **FAQ Knowledge Base** - Pre-seeded with TechStore policies (shipping, returns, warranty, support, payment)
- ✅ **Conversation Persistence** - All chats saved to MongoDB, resume anytime
- ✅ **Session Management** - Multiple chat sessions per user, sidebar navigation
- ✅ **Input Validation** - Character counter (2000 limit), empty message blocking
- ✅ **Typing Indicator** - "AI is typing..." disappears on first chunk
- ✅ **Error Handling** - Graceful LLM timeouts, rate limits, API failures with user-friendly messages
- ✅ **REST API Endpoint** - POST /api/chat/message for assignment compliance
- ✅ **Authentication** - JWT-based user auth with HTTP-only cookies
- ✅ **Image Support** - Upload images with prompts, camera/gallery integration

### Tech Stack
| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **AI** | OpenAI GPT-4o-mini + LangChain |
| **Database** | MongoDB + Mongoose ORM |
| **Vector DB** | Pinecone (conversation memory) |
| **Real-time** | Socket.IO |
| **Frontend** | React 19 + Vite, Redux Toolkit |
| **Image CDN** | ImageKit |

---

## 📁 Project Structure

```
spur_/
├── Backend/                # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   │   ├── auth.controllers.js
│   │   │   ├── chat.controllers.js
│   │   │   └── chatMessage.controller.js  # REST API
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   │   ├── langchain.service.js  # LangChain streaming
│   │   │   ├── ai.service.js         # OpenAI integration
│   │   │   └── vector.service.js     # Pinecone vector DB
│   │   ├── sockets/        # Socket.IO server
│   │   │   └── socket.server.js      # Streaming implementation
│   │   ├── middlewares/    # Auth middleware
│   │   ├── constants/      # App constants
│   │   │   └── faq.constants.js      # TechStore FAQ
│   │   ├── db/             # Database connection
│   │   └── app.js          # Express app
│   ├── server.js           # Entry point
│   ├── .env.example        # Environment template
│   ├── README.md           # Backend docs
│   └── package.json
├── Frontend/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/       # Login/Register
│   │   │   └── chat/       # Chat components
│   │   │       ├── ChatComposer.jsx    # Input with counter
│   │   │       ├── ChatMessages.jsx    # Message display
│   │   │       └── ChatSidebar.jsx     # Session list
│   │   ├── pages/
│   │   │   ├── Home.jsx    # Main chat (streaming logic)
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── store/          # Redux state
│   │   └── utils/          # Image processing
│   ├── .env.example        # Environment template
│   ├── README.md           # Frontend docs
│   └── package.json
└── README.md               # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key
- Pinecone API key

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_key
   PINECONE_API_KEY=your_pinecone_key
   
   # Optional (for image uploads)
   IMAGEKIT_PUBLICKEY=your_imagekit_public_key
   IMAGEKIT_PRIVATEKEY=your_imagekit_private_key
   IMAGEKIT_URL=your_imagekit_url
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```
   
   Server runs on `http://localhost:3000` (local) or `https://spur-tha.onrender.com` (production)

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   # For local development
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=http://localhost:3000
   
   # For production (already configured)
   VITE_API_URL=https://spur-tha.onrender.com
   VITE_WS_URL=https://spur-tha.onrender.com
   ```

4. **Start the dev server:**
   ```bash
   npm run dev
   ```
   
   App runs on `http://localhost:5173` (local)

5. **Open browser:**
   - Register a new account
   - Start chatting with the AI!

---

## 🎯 Streaming Implementation

The app implements **smooth, controlled streaming** for optimal UX:

### Backend Flow
1. Receives message via Socket.IO
2. Calls LangChain with OpenAI streaming
3. Emits `ai-stream-chunk` for each token
4. Sends `ai-typing: false` on first chunk
5. Emits `ai-response` with complete message

### Frontend Flow
1. Receives chunks via `ai-stream-chunk` event
2. Queues chunks for throttled processing
3. Displays chunks with **100ms delay** between each
4. Hides typing indicator on first chunk
5. Finalizes message on `ai-response`

**Result:** Natural, readable streaming without overwhelming the user.

---

## 🔌 API Documentation

### REST API

#### Authentication
```bash
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

#### Chat
```bash
POST /api/chat              # Create new chat
GET /api/chat               # Get all chats
GET /api/chat/messages/:id  # Get chat messages
DELETE /api/chat/messages/:id # Delete chat
```

#### Assignment Endpoint
```bash
POST /api/chat/message
Body: { "message": "your question", "sessionId": "optional" }
Response: { "reply": "AI response", "sessionId": "chat_id" }
```

### Socket.IO Events

**Client → Server:**
- `ai-message` - Send text message
- `ai-image-message` - Send image with prompt

**Server → Client:**
- `ai-stream-chunk` - Streaming token
- `ai-typing` - Typing state (true/false)
- `ai-response` - Complete response
- `ai-error` - Error message
- `image-uploaded` - Image upload success
- `image-upload-error` - Upload failure

---

## 🤖 AI Models

| Use Case | Model | Purpose |
|----------|-------|---------|
| Basic Chat | `gpt-4o-mini` | Fast, cost-effective responses |
| Thinking Mode | `o3-mini` | Advanced reasoning |
| Vision | `gpt-4o` | Image understanding |
| Embeddings | `text-embedding-3-small` | 768-dim vectors for memory |

---

## 📝 FAQ Knowledge Base

The AI is pre-loaded with TechStore policies:

- **Shipping** - Free shipping, delivery times, tracking
- **Returns** - 30-day guarantee, refund process
- **Warranty** - Manufacturer warranty, extended options
- **Support** - Hours (9 AM - 6 PM EST), contact methods
- **Payment** - Accepted methods, security, installments
- **Order Tracking** - Order number, tracking link

Test with questions like:
- "What is your return policy?"
- "Do you offer free shipping?"
- "What are your support hours?"

---

## 🧪 Testing

### Manual Testing

1. **Streaming:**
   - Send message
   - Verify typing indicator appears
   - Indicator disappears on first chunk
   - Text streams smoothly word-by-word

2. **Input Validation:**
   - Type message
   - See character counter (X/2000)
   - Counter turns red at 2000+
   - Send button disabled when invalid

3. **FAQ Accuracy:**
   - Ask about shipping
   - Ask about returns
   - Verify accurate TechStore info

4. **Error Handling:**
   - Stop backend
   - Send message
   - See error toast

### REST API Testing

```bash
# Test assignment endpoint (local)
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your return policy?"}'

# Test assignment endpoint (production)
curl -X POST https://spur-tha.onrender.com/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your return policy?"}'

# Expected response
{
  "reply": "TechStore offers a 30-day return policy...",
  "sessionId": "chat_id_here"
}
```

---

## 🚀 Deployment

### Backend (Railway/Render)

1. Push code to GitHub
2. Connect to Railway/Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)

1. Build: `npm run build`
2. Deploy `dist/` folder to Vercel
3. Set environment variables:
   - `VITE_API_URL` - Your backend URL
   - `VITE_WS_URL` - Your backend URL

---

## 📊 Architecture Highlights

### LangChain Integration
- Centralized prompt management
- Built-in streaming support
- Easy model switching
- FAQ injection via system messages

### Real-time Streaming
- Socket.IO for bidirectional communication
- Chunk-based streaming for smooth UX
- 100ms throttle for comfortable reading pace
- Typing indicators for better feedback

### Error Handling
- API key validation
- Rate limit detection (429 errors)
- Timeout handling
- Network failure recovery
- User-friendly error messages

### State Management
- Redux for global chat state
- Local state for streaming buffers
- Optimistic UI updates
- Efficient re-renders

---

## 🛠️ Customization

### Adjust Streaming Speed

In `Frontend/src/pages/Home.jsx` (line ~118):
```javascript
}, 100); // Change delay (ms) between chunks
```

### Change Character Limit

1. Update backend validation in `langchain.service.js`
2. Update frontend counter in `ChatComposer.jsx`

### Modify FAQ Data

Edit `Backend/src/constants/faq.constants.js`

---

## 📦 Dependencies

### Backend
- `express` - Web framework
- `socket.io` - Real-time communication
- `mongoose` - MongoDB ODM
- `langchain` + `@langchain/openai` - LLM orchestration
- `openai` - OpenAI SDK
- `jsonwebtoken` - Authentication
- `pinecone` - Vector database
- `imagekit` - Image CDN

### Frontend
- `react` + `react-dom` - UI library
- `@reduxjs/toolkit` - State management
- `socket.io-client` - WebSocket client
- `axios` - HTTP client
- `react-hot-toast` - Notifications
- `react-markdown` - Markdown rendering

---

## 📄 Assignment Compliance

### ✅ Required Features
- [x] LangChain integration for AI responses
- [x] Real-time streaming with typing indicators
- [x] FAQ knowledge base (TechStore)
- [x] REST API endpoint (`POST /api/chat/message`)
- [x] Input validation (max 2000 chars)
- [x] Error handling (timeouts, rate limits, API failures)
- [x] Conversation persistence (MongoDB)
- [x] Session management

### ✅ Bonus Features
- [x] Image upload support
- [x] Thinking mode (advanced reasoning)
- [x] Character counter with visual feedback
- [x] Smooth streaming with throttle control
- [x] Vector database for conversation memory
- [x] Multiple chat sessions per user

---

## 📞 Support

For questions or issues related to this implementation, please refer to:
- Backend README: `Backend/README.md`
- Frontend README: `Frontend/README.md`
- LangChain docs: https://js.langchain.com/docs/
- OpenAI docs: https://platform.openai.com/docs/

---

## 📄 License

This project is part of the Spur Founding Full-Stack Engineer Take-Home assignment.

---

**Built with ❤️ for Spur**
