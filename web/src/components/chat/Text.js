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
  const [loading, setLoading] = useState(false);

  const introMessage = "Hello! I'm DoodleShoper, your AI powered assistant. I'm here to help you in finding the perfect product. What are you searching for today?"

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

const handleKeyPress = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    // Prevent default behavior of Enter key (new line) and send the message
    event.preventDefault();
    handleMessageSend();
  }
};

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

  const fetchMessages = async (threadId) => {
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
    await axios.post(`http://localhost:8080/api/v1/threads/text/${newThreadId}/messages/assistant`, {
      content: introMessage
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    // After sending the default message, fetch the messages for the new thread
    fetchMessages(newThreadId);

    setSelectedThread(newThreadId);
    } catch (error) {
      console.error('Failed to create new thread', error);
    }
  };

  const handleMessageSend = async () => {
    if (!newMessage.trim()) {
      // If the message is empty or contains only whitespace characters, do nothing
      return;
    }

    setLoading(true); // Set loading to true while processing the message
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
      fetchMessages(selectedThread)
      // Start processing the message by creating a run
      await createAndProcessRun(selectedThread);
    } catch (error) {
      console.error('Failed to send message', error);
    } 
  };

  const createAndProcessRun = async (threadId) => {
    try {
      const accessToken = Cookies.get('accessToken');
      const runResponse = await axios.post(
        `http://localhost:8080/api/v1/threads/text/${threadId}/runs`,
        null,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const runId = runResponse.data.id;
      // Start checking the status of the run
      await checkRunStatus(runId, threadId);
    } catch (error) {
      console.error('Failed to create and process run', error);
    }
  };

  const checkRunStatus = async (runId, threadId) => {
    try {
      const accessToken = Cookies.get('accessToken');
      let intervalId = setInterval(async () => {
        try {
          const response = await axios.get(
            `http://localhost:8080/api/v1/threads/text/${threadId}/runs/${runId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const { status, action } = response.data;
          if (status === 'completed') {
            clearInterval(intervalId); // Stop the interval when run is completed
            setLoading(false); // Set loading to false after run completion
            // Update messages after completion
            fetchMessages(threadId);
          } else if (status === 'requires_action' && action && action.submit_tool_outputs && action.submit_tool_outputs.tool_calls) {
            const toolCall = action.submit_tool_outputs.tool_calls[0];
            if (toolCall && toolCall.function && toolCall.function.arguments) {
              const { prompt } = JSON.parse(toolCall.function.arguments);
              const toolCallId = toolCall.id;
              // Submit tool outputs
              await submitToolOutputs(runId, toolCallId, prompt);
            }
          }
        } catch (error) {
          console.error('Failed to check run status', error);
          clearInterval(intervalId); // Stop the interval in case of error
        }
      }, 1000); // Check every 1 second
    } catch (error) {
      console.error('Failed to start checking run status', error);
    }
  };
  

  const submitToolOutputs = async (runId, toolCallId, prompt) => {
    try {
      const accessToken = Cookies.get('accessToken');
      await axios.post(
        `http://localhost:8080/api/v1/threads/text/${selectedThread}/runs/${runId}/submit_tool_outputs`,
        {
          tool_call_id: toolCallId,
          prompt,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.error('Failed to submit tool outputs', error);
    }
  };

  const handleThreadClick = async (threadId) => {
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

  const transformMessageContent = (messageContent) => {
    // Regular expression to match text within square brackets followed by a link within round brackets
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Replace matched text with anchor tags
    const transformedContent = messageContent.replace(regex, (match, title, link) => {
      const linkText = `<a href="${link}" target="_blank">${title}</a>`;
      return linkText;
    });

    // Replace "-" outside links with line breaks
    const finalContent = transformedContent.replace(/-(?![^<]*<\/a>)/g, '<br/>');

    // Add a line break after the last link
    const lastIndex = finalContent.lastIndexOf('</a>');
    if (lastIndex !== -1) {
        return finalContent.substring(0, lastIndex + 4) + '<br/>' + finalContent.substring(lastIndex + 4);
    }

    return finalContent;
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
          <div className="messages-container-wrapper">
            <div className="messages-container">
              {messages.slice().reverse().map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <p dangerouslySetInnerHTML={{ __html: transformMessageContent(message.content[0].text.value) }} />
                </div>
              ))}
            </div>
          </div>
          <div className="message-input">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
            />
            {loading ? (
              <div>Loading...</div>
            ) : (
              <button onClick={handleMessageSend}>Send</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Text;
