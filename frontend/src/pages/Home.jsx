import React, { useCallback, useEffect, useState } from 'react';
import { io } from "socket.io-client";
import ChatMobileBar from '../components/chat/ChatMobileBar.jsx';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import ChatMessages from '../components/chat/ChatMessages.jsx';
import ChatComposer from '../components/chat/ChatComposer.jsx';
import '../components/chat/ChatLayout.css';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  setChats
} from '../store/chatSlice.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chat.chats);
  const activeChatId = useSelector(state => state.chat.activeChatId);
  const input = useSelector(state => state.chat.input);
  const isSending = useSelector(state => state.chat.isSending);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const handleNewChat = async () => {
    // Prompt user for title of new chat
    let title = window.prompt('Enter a title for the new chat:', '');
    if (title) title = title.trim();
    if (!title) return;

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        title
      }, {
        withCredentials: true
      });

      getMessages(response.data.chat._id);
      dispatch(startNewChat(response.data.chat));
      setSidebarOpen(false);
    } catch (err) {
      console.error('Error creating chat:', err);
      showError('Failed to create new chat');
    }
  };

  // Show error toast
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Initialize: Fetch chats and setup Socket.IO
  useEffect(() => {
    // Fetch all chats
    axios.get(`${API_URL}/api/chat`, { withCredentials: true })
      .then(response => {
        dispatch(setChats(response.data.chats.reverse()));
      })
      .catch(err => {
        console.error('Error fetching chats:', err);
        showError('Failed to load chats');
      });

    // Setup Socket.IO connection
    const tempSocket = io(WS_URL, {
      withCredentials: true,
    });

    // Handle complete AI response
    tempSocket.on("ai-response", (messagePayload) => {
      console.log("Received AI response:", messagePayload);

      setMessages((prevMessages) => [...prevMessages, {
        type: 'ai',
        content: messagePayload.content
      }]);

      setStreamingMessage(''); // Clear streaming state
      setIsTyping(false);
      dispatch(sendingFinished());
    });

    // Handle streaming chunks
    tempSocket.on("ai-stream-chunk", (chunkPayload) => {
      console.log("Received chunk:", chunkPayload.chunk);

      setStreamingMessage((prev) => prev + chunkPayload.chunk);
    });

    // Handle typing indicator
    tempSocket.on("ai-typing", (typing) => {
      console.log("AI typing:", typing);
      setIsTyping(typing);
    });

    // Handle errors
    tempSocket.on("ai-error", (errorPayload) => {
      console.error("AI error:", errorPayload);
      showError(errorPayload.message);
      setIsTyping(false);
      setStreamingMessage('');
      dispatch(sendingFinished());
    });

    // Connection error
    tempSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      showError('Connection error. Please check your internet.');
    });

    setSocket(tempSocket);

    // Cleanup on unmount
    return () => {
      tempSocket.disconnect();
    };
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    console.log("Sending message:", trimmed);

    // Validation
    if (!trimmed) {
      showError('Message cannot be empty');
      return;
    }

    if (trimmed.length > 2000) {
      showError('Message too long (max 2000 characters)');
      return;
    }

    if (!activeChatId || isSending) return;

    dispatch(sendingStarted());

    const newMessages = [...messages, {
      type: 'user',
      content: trimmed
    }];

    console.log("New messages:", newMessages);

    setMessages(newMessages);
    dispatch(setInput(''));
    setStreamingMessage(''); // Reset streaming message

    socket.emit("ai-message", {
      chat: activeChatId,
      content: trimmed
    });
  };

  const getMessages = async (chatId) => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/messages/${chatId}`, {
        withCredentials: true
      });

      console.log("Fetched messages:", response.data.messages);

      setMessages(response.data.messages.map(m => ({
        type: m.role === 'user' ? 'user' : 'ai',
        content: m.content
      })));
    } catch (err) {
      console.error('Error fetching messages:', err);
      showError('Failed to load messages');
    }
  };

  return (
    <div className="chat-layout minimal">
      {/* Error toast */}
      {error && (
        <div className="error-toast" role="alert">
          {error}
        </div>
      )}

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
            <div className="chip">TechStore Support</div>
            <h1>AI Customer Support</h1>
            <p>Ask about our shipping, returns, warranty, or any other questions. Your conversations are saved in the sidebar.</p>
          </div>
        )}
        <ChatMessages
          messages={messages}
          isSending={isSending || isTyping}
          streamingMessage={streamingMessage}
          isTyping={isTyping}
        />
        {activeChatId &&
          <ChatComposer
            input={input}
            setInput={(v) => dispatch(setInput(v))}
            onSend={sendMessage}
            isSending={isSending || isTyping}
          />
        }
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
