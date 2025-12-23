import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = () => {
    return (
        <div className="typing-indicator-container">
            <div className="typing-bubble">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
            </div>
            <span className="typing-text">Agent is typing...</span>
        </div>
    );
};

export default TypingIndicator;
