import React, { useCallback, useEffect, useState } from 'react';
import { io } from "socket.io-client";
import ChatMobileBar from '../components/chat/ChatMobileBar.jsx';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import ChatMessages from '../components/chat/ChatMessages.jsx';
import ChatComposer from '../components/chat/ChatComposer.jsx';
import TypingIndicator from '../components/chat/TypingIndicator.jsx';
import '../components/chat/ChatLayout.css';
import { fakeAIReply } from '../components/chat/aiClient.js';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

// UPDATED: Use environment variable or localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
import axios from 'axios';
import {
  ensureInitialChat,
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  addUserMessage,
  addAIMessage,
  setChats
} from '../store/chatSlice.js';

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chat.chats);
  const activeChatId = useSelector(state => state.chat.activeChatId);
  const input = useSelector(state => state.chat.input);
  const isSending = useSelector(state => state.chat.isSending);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false); // NEW: Typing indicator state
  const [error, setError] = useState(null); // NEW: Error state

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const [messages, setMessages] = useState([
    // {
    //   type: 'user',
    //   content: 'Hello, how can I help you today?'
    // },
    // {
    //   type: 'ai',
    //   content: 'Hi there! I need assistance with my account.'
    // }
  ]);

  const handleNewChat = async () => {
    // Prompt user for title of new chat, fallback to 'New Chat'
    let title = window.prompt('Enter a title for the new chat:', '');
    if (title) title = title.trim();
    if (!title) return

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        title
      }, {
        withCredentials: true
      })
      getMessages(response.data.chat._id);
      dispatch(startNewChat(response.data.chat));
      setSidebarOpen(false);
    } catch (err) {
      console.error('Failed to create chat:', err);
      alert('Failed to create new chat. Please try again.');
    }
  }

  // Ensure at least one chat exists initially
  useEffect(() => {

    axios.get(`${API_BASE_URL}/api/chat`, { withCredentials: true })
      .then(response => {
        dispatch(setChats(response.data.chats.reverse()));
      })
      .catch(err => {
        console.error('Failed to load chats:', err);
      });

    const tempSocket = io(API_BASE_URL, {
      withCredentials: true,
    })

    // Socket.IO event listeners
    tempSocket.on("ai-response", (messagePayload) => {
      console.log("Received AI response:", messagePayload);

      setMessages((prevMessages) => [...prevMessages, {
        type: 'ai',
        content: messagePayload.content
      }]);

      dispatch(sendingFinished());
      setIsTyping(false); // NEW: Turn off typing indicator
    });

    // NEW: Typing indicator listener
    tempSocket.on("ai-typing", (isTypingNow) => {
      setIsTyping(isTypingNow);
    });

    // NEW: Error handler
    tempSocket.on("ai-error", (errorPayload) => {
      console.error("AI error:", errorPayload);
      setError(errorPayload.message);
      setIsTyping(false);
      dispatch(sendingFinished());

      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    });

    setSocket(tempSocket);

    return () => {
      tempSocket.disconnect();
    };

  }, []);

  const sendMessage = async () => {

    const trimmed = input.trim();

    // Input validation (Assignment Requirement #6)
    if (!trimmed) {
      setError('Message cannot be empty');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (trimmed.length > 2000) {
      setError('Message too long (max 2000 characters)');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!activeChatId || isSending) return;

    setError(null); // Clear any previous errors
    dispatch(sendingStarted());

    const newMessages = [...messages, {
      type: 'user',
      content: trimmed
    }];

    console.log("New messages:", newMessages);

    setMessages(newMessages);
    dispatch(setInput(''));

    socket.emit("ai-message", {
      chat: activeChatId,
      content: trimmed
    })

    // try {
    //   const reply = await fakeAIReply(trimmed);
    //   dispatch(addAIMessage(activeChatId, reply));
    // } catch {
    //   dispatch(addAIMessage(activeChatId, 'Error fetching AI response.', true));
    // } finally {
    //   dispatch(sendingFinished());
    // }
  }

  const getMessages = async (chatId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/messages/${chatId}`, { withCredentials: true })

      console.log("Fetched messages:", response.data.messages);

      setMessages(response.data.messages.map(m => ({
        type: m.role === 'user' ? 'user' : 'ai',
        content: m.content
      })));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }


  return (
    <div className="chat-layout minimal">
      <ChatMobileBar
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        onNewChat={handleNewChat}
      />
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setSidebarOpen(false);
          getMessages(id);
        }}
        onNewChat={handleNewChat}
        open={sidebarOpen}
      />
      <main className="chat-main" role="main">
        {messages.length === 0 && (
          <div className="chat-welcome" aria-hidden="true">
            <div className="chip">Spur AI Assistant</div>
            <h1>TechStore Support</h1>
            <p>Welcome to TechStore customer support! Ask me anything about our shipping, returns, warranty, or payment options. Your conversations are saved in the sidebar.</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#ff4444',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease'
          }}>
            {error}
          </div>
        )}

        <ChatMessages messages={messages} isSending={isSending} />

        {/* NEW: Typing Indicator */}
        {isTyping && <TypingIndicator />}

        {
          activeChatId &&
          <ChatComposer
            input={input}
            setInput={(v) => dispatch(setInput(v))}
            onSend={sendMessage}
            isSending={isSending}
          />}
      </main>
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;
