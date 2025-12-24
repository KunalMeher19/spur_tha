# Backend - TypeScript Node.js Express Server

AI-powered customer support chat backend built with **TypeScript**, Node.js, Express, LangChain, OpenAI, Socket.IO, and MongoDB.

## 🚀 Features

- **TypeScript** - Full type safety across the entire backend with strict type checking
- **LangChain Integration** - Advanced AI prompt management with streaming responses
- **Real-time Streaming** - Token-by-token AI responses via Socket.IO
- **FAQ Knowledge Base** - Pre-seeded with TechStore policies (shipping, returns, warranty, support, payment)
- **REST API** - POST /api/chat/message endpoint for assignment compliance
- **Vector Database** - Pinecone for conversation memory and context
- **Image Processing** - ImageKit integration with Sharp for image optimization
- **Authentication** - JWT-based authentication with HTTP-only cookies
- **Error Handling** - Comprehensive error handling for LLM timeouts, rate limits, and API failures

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB instance (local or Atlas)
- OpenAI API key
- Pinecone API key
- ImageKit account (optional, for image uploads)

## ⚙️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   
   # Optional (for image uploads)
   GEMINI_API_KEY=your_gemini_api_key
   IMAGEKIT_PUBLICKEY=your_imagekit_public_key
   IMAGEKIT_PRIVATEKEY=your_imagekit_private_key
   IMAGEKIT_URL=your_imagekit_url
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   This uses `tsx watch` for hot-reloading TypeScript files.

4. **Build for production:**
   ```bash
   npm run build
   ```
   
   This compiles TypeScript to JavaScript in the `dist/` folder.

5. **Run production build:**
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3000`

## 📁 Project Structure

```
Backend/
├── src/
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── controllers/     # Request handlers
│   │   ├── auth.controllers.ts
│   │   ├── chat.controllers.ts
│   │   └── chatMessage.controller.ts  # REST API endpoint
│   ├── models/          # Mongoose schemas
│   │   ├── user.model.ts
│   │   ├── chat.model.ts
│   │   └── message.model.ts
│   ├── routers/         # API routes
│   │   ├── auth.router.ts
│   │   └── chat.router.ts
│   ├── services/        # Business logic
│   │   ├── langchain.service.ts  # LangChain streaming
│   │   ├── ai.service.ts         # OpenAI integration
│   │   ├── vector.service.ts     # Pinecone vector DB
│   │   └── storage.service.ts    # ImageKit integration
│   ├── sockets/         # Socket.IO server
│   │   └── socket.server.ts
│   ├── middlewares/     # Custom middleware
│   │   └── auth.middleware.ts
│   ├── constants/       # App constants
│   │   └── faq.constants.ts  # TechStore FAQ data
│   ├── db/              # Database connection
│   │   └── db.ts
│   └── app.ts           # Express app configuration
├── dist/                # Compiled JavaScript (gitignored)
├── server.ts            # Entry point
├── tsconfig.json        # TypeScript configuration
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Chat
- `POST /api/chat` - Create new chat
- `GET /api/chat` - Get all user chats
- `GET /api/chat/messages/:chatId` - Get chat messages
- `DELETE /api/chat/messages/:chatId` - Delete chat
- `POST /api/chat/message` - Send message (assignment-compliant endpoint)

### Socket.IO Events

**Client → Server:**
- `ai-message` - Send text message with streaming response
- `ai-image-message` - Send image with prompt

**Server → Client:**
- `ai-stream-chunk` - Streaming response chunk (real-time)
- `stream-end` - Stream completion with optional title update
- `ai-typing` - Typing indicator state (true/false)
- `ai-error` - Error message
- `image-uploaded` - Image upload success
- `image-upload-error` - Image upload failure

## 🤖 LangChain Configuration

The backend uses LangChain for AI interactions with the following models:

- **Basic Chat**: `gpt-4o-mini` - Fast, cost-effective
- **Thinking Mode**: `o3-mini` - Advanced reasoning
- **Vision**: `gpt-4o` - Image understanding
- **Embeddings**: `text-embedding-3-small` - 768 dimensions

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `PINECONE_API_KEY` | Pinecone API key | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | No |
| `IMAGEKIT_PUBLICKEY` | ImageKit public key | No |
| `IMAGEKIT_PRIVATEKEY` | ImageKit private key | No |
| `IMAGEKIT_URL` | ImageKit URL endpoint | No |

## 🧪 Testing

The server includes comprehensive error handling for:
- Invalid API keys
- Rate limiting (429 errors)
- Timeouts
- Network failures
- Invalid message formats

Test with:
```bash
# Start the server
npm run dev

# Send a message via REST API
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your return policy?"}'
```

## 📦 Dependencies

Main dependencies:
- `typescript` - TypeScript compiler
- `tsx` - TypeScript execution for development
- `express` (v4.18) - Web framework
- `socket.io` - Real-time communication
- `mongoose` - MongoDB ODM
- `langchain` - LLM orchestration
- `@langchain/openai` - OpenAI integration
- `openai` - OpenAI SDK
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `@pinecone-database/pinecone` - Vector database
- `imagekit` - Image CDN
- `sharp` - Image processing
- `cookie` - Cookie parsing

TypeScript types:
- `@types/node`, `@types/express`, `@types/cookie`, `@types/jsonwebtoken`, `@types/bcryptjs`, `@types/cookie-parser`, `@types/cors`, `@types/multer`, `@types/sharp`

## 🚀 Deployment

For production deployment:

1. **Build TypeScript:**
   ```bash
   npm run build
   ```
   This compiles all `.ts` files to JavaScript in the `dist/` folder.

2. Set `NODE_ENV=production`
3. Use process manager (PM2 recommended):
   ```bash
   pm2 start dist/server.js --name "chat-backend"
   ```
4. Set up MongoDB Atlas
5. Configure CORS for your frontend domain in `src/app.ts`
6. Use HTTPS for secure WebSocket connections

## 🔧 TypeScript Configuration

The project uses strict TypeScript configuration (`tsconfig.json`):
- **Strict mode** enabled for maximum type safety
- **Target**: ES2020
- **Module**: CommonJS (Node.js compatible)
- **Output**: `dist/` directory
- **Source maps** enabled for debugging

## 📄 License

This project is part of the Spur Founding Full-Stack Engineer Take-Home assignment.
