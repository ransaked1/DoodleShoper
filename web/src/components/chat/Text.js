import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate, useParams } from 'react-router-dom';

const Text = () => {
  const { thread_id } = useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (!thread_id || !selectedThread) {
      setMessages([]);
    } else {
      fetchMessages();
    }
  }, [thread_id, selectedThread]);

  const fetchThreads = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.get('http://localhost:8080/api/v1/threads/text', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setThreads(response.data.threads);
    } catch (error) {
      console.error('Failed to fetch threads', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.get(`http://localhost:8080/api/v1/threads/text/${thread_id}/messages`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const handleNewThread = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      const newThreadResponse = await axios.post('http://localhost:8080/api/v1/threads/text', null, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      // Add default message from assistant to the messages state
      // After creating a new thread, refresh the threads list
      fetchThreads();

      // Extract the new thread ID from the response
    const newThreadId = newThreadResponse.data.id;

    // Send a default message from the assistant to the new thread
    await axios.post(`http://localhost:8080/api/v1/threads/text/${newThreadId}/messages/intro`, {
      content: "Hello, I am here to assist you"
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    // After sending the default message, fetch the messages for the new thread
    fetchMessages(newThreadId);
    } catch (error) {
      console.error('Failed to create new thread', error);
    }
  };

  const handleMessageSend = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.post(`http://localhost:8080/api/v1/threads/text/${selectedThread}/messages`, {
        content: newMessage
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      // Save the message ID from the response if needed
      console.log('Message sent:', response.data);
      // Clear the input field after sending the message
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
    try {
        const accessToken = Cookies.get('accessToken');
        const response = await axios.get(`http://localhost:8080/api/v1/threads/text/${selectedThread}/messages`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        setMessages(response.data.messages);
      } catch (error) {
        console.error('Failed to fetch messages', error);
    }
  };

  const handleThreadClick = async (threadId) => {
    // Handle the click event for a thread
    // For example, navigate to the details page of the thread
    setSelectedThread(threadId);
    try {
        const accessToken = Cookies.get('accessToken');
        const response = await axios.get(`http://localhost:8080/api/v1/threads/text/${threadId}/messages`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        setMessages(response.data.messages);
      } catch (error) {
        console.error('Failed to fetch messages', error);
    }
  };

  const handleDeleteThread = async (threadId) => {
    try {
      const accessToken = Cookies.get('accessToken');
      await axios.delete(`http://localhost:8080/api/v1/threads/text?thread_id=${threadId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      // After deleting the thread, refresh the threads list
      fetchThreads();
      if (threads.length === 1 || threadId === selectedThread) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete thread', error);
    }
  };

  const handleLogout = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      await axios.post('http://localhost:8080/api/v1/users/logout', null, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      // Delete token from cookie
      Cookies.remove('accessToken');
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="container">
      <div className="top-bar">
        <button onClick={() => navigate('/chat')}>Back to Chat</button>
        <h2>User is logged in</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="content">
        <div className="side-panel">
          <button onClick={handleNewThread}>Create New Thread</button>
          <ul>
            {threads.map((threadId, index) => (
              <li key={index} className={selectedThread === threadId ? 'selected' : ''} onClick={() => handleThreadClick(threadId)}>
                Thread {index + 1}
                <span onClick={() => handleDeleteThread(threadId)}>❌</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="chat-container">
          <div className="messages-container">
            {messages.slice().reverse().map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <p>{message.content[0].text.value}</p> {/* Access the text value here */}
              </div>
            ))}
          </div>
          <div className="message-input">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <button onClick={handleMessageSend}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Text;
