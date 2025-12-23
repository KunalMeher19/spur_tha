# Frontend - React Chat Application

Modern AI-powered chat interface built with React, Redux Toolkit, Socket.IO, and Vite.

## 🚀 Features

- **Real-time Streaming** - Word-by-word AI responses with smooth typewriter effect
- **Typing Indicators** - "AI is typing..." with animated dots
- **Input Validation** - Character counter (2000 char limit) with visual feedback
- **Chat Management** - Multiple chat sessions with sidebar navigation
- **Image Support** - Camera/gallery image uploads with previews
- **Thinking Mode** - Advanced reasoning mode toggle
- **Markdown Rendering** - Rich text formatting for AI responses
- **Responsive Design** - Mobile-friendly with collapsible sidebar
- **Error Handling** - User-friendly error messages with toast notifications

## 📋 Prerequisites

- Node.js 18+
- Backend server running (see Backend README)

## ⚙️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Update with your backend URL:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=http://localhost:3000
   ```

   For production, use your deployed backend URLs.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The app will start on `http://localhost:5173`

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication components
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   └── chat/           # Chat-related components
│   │       ├── ChatComposer.jsx    # Message input with char counter
│   │       ├── ChatMessages.jsx    # Message list with streaming
│   │       ├── ChatSidebar.jsx     # Chat session list
│   │       ├── LogoutButton.jsx
│   │       └── TypingIndicator.jsx
│   ├── pages/
│   │   ├── Home.jsx        # Main chat page with streaming logic
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── store/
│   │   ├── chatSlice.js    # Redux chat state
│   │   └── store.js        # Redux store configuration
│   ├── utils/
│   │   └── imageUtils.js   # Image processing utilities
│   ├── App.jsx
│   ├── AppRoutes.jsx
│   └── main.jsx
├── public/
├── index.html
└── package.json
```

## 🎨 Key Components

### Home.jsx
Main chat page component with:
- Socket.IO connection management
- Streaming chunk processing with 100ms throttle
- Typing indicator state management
- Chat session handling
- Message send/receive logic

### ChatComposer.jsx
Message input component with:
- Character counter (X/2000)
- Input validation
- Image attachment support
- Mode switching (normal/thinking)
- Auto-grow textarea

### ChatMessages.jsx
Message display component with:
- Streaming message rendering
- Markdown support
- Image previews
- Copy to clipboard
- Auto-scroll to latest

## 🔌 Socket.IO Events

**Client emits:**
- `ai-message` - Text message
- `ai-image-message` - Image with prompt

**Client listens:**
- `ai-stream-chunk` - Receive streaming chunks
- `ai-typing` - Typing indicator updates
- `ai-response` - Complete response
- `ai-error` - Error messages
- `image-uploaded` - Image upload success
- `image-upload-error` - Image upload error

## 🎯 Streaming Implementation

The app implements smooth streaming with:

1. **Chunk Queue**: Incoming chunks are queued
2. **Throttle Processing**: 100ms delay between chunk displays
3. **Typing Indicator**: Hides immediately on first chunk
4. **State Management**: Redux for chat state, local for streaming

```javascript
// Streaming flow
Backend sends chunk → Queue chunk → Process with 100ms delay → Display
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend REST API URL | `http://localhost:3000` |
| `VITE_WS_URL` | Backend WebSocket URL | `http://localhost:3000` |

## 🧪 Testing Features

### Test Streaming:
1. Login/Register
2. Send a message
3. Observe:
   - "AI is typing..." appears
   - Typing indicator disappears on first chunk
   - Text appears word-by-word smoothly

### Test Input Validation:
1. Type in message box
2. Character counter shows: X/2000
3. At 2000+ chars, counter turns red
4. Send button disabled when invalid

### Test Error Handling:
1. Stop backend server
2. Send message
3. See error toast notification

## 📦 Dependencies

Main dependencies:
- `react` - UI library
- `react-router-dom` - Routing
- `@reduxjs/toolkit` - State management
- `socket.io-client` - Real-time communication
- `axios` - HTTP client
- `react-hot-toast` - Toast notifications
- `react-markdown` - Markdown rendering
- `js-cookie` - Cookie management

## 🎨 Styling

- CSS Modules for component-specific styles
- Responsive design with mobile breakpoints
- Dark theme optimized
- Smooth animations and transitions

## 🚀 Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

Deploy to:
- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**

## 🔧 Customization

### Adjust Streaming Speed
In `Home.jsx`, line ~118:
```javascript
}, 100); // Change delay (ms) between chunks
```

### Change Character Limit
In `ChatComposer.jsx`:
- Update validation logic
- Update counter display
- Sync with backend validation

## 📄 License

This project is part of the Spur Founding Full-Stack Engineer Take-Home assignment.
