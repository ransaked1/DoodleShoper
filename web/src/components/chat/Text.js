import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate, useParams } from 'react-router-dom';
import '../../styles/topbar.css';
import '../../styles/main.css';

const Text = () => {
  const { thread_id } = useParams();
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const introMessage ="{\"text\": \"Hello! I am DoodleShoper, your AI powered assistant. I am here to help you find the perfect product. What are you searching for today?\"}"

  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = (textarea.scrollHeight - 2) + 'px';
    }
  }, [newMessage]);

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

  const scrollToBottom = () => {
    const messagesContainer = document.querySelector('.messages-container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

useEffect(() => {
    scrollToBottom();
}, [messages]);

useEffect(() => {
    const fetchUsername = async () => {
      try {
        const accessToken = Cookies.get('accessToken');
        const response = await axios.get('http://localhost:8080/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        setUsername(response.data.username);
      } catch (error) {
        console.error('Failed to fetch username', error);
      }
    };

    fetchUsername();
  }, []);

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
      if (error.response && error.response.status === 401) {
        handleLogout(); // Call handleLogout method if response status is 401
      }
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
      if (error.response && error.response.status === 401) {
        handleLogout(); // Call handleLogout method if response status is 401
      }
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
      if (error.response && error.response.status === 401) {
        handleLogout(); // Call handleLogout method if response status is 401
      }
    }
  };

  const handleMessageSend = async () => {
    if (!newMessage.trim() || !selectedThread) {
      // If the message is empty or contains only whitespace characters, do nothing
      return;
    }

    setLoading(true); // Set loading to true while processing the message
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.post(`http://localhost:8080/api/v1/threads/text/${selectedThread}/messages`, {
        content: `{\"text\": \"${newMessage}\" }`
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      // Clear the input field after sending the message
      setNewMessage('');
      fetchMessages(selectedThread)
      // Start processing the message by creating a run
      await createAndProcessRun(selectedThread);
    } catch (error) {
      console.error('Failed to send message', error);
      if (error.response && error.response.status === 401) {
        handleLogout(); // Call handleLogout method if response status is 401
      }
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
    const accessToken = Cookies.get('accessToken');
    try {
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
            // Update messages after completion
            fetchMessages(threadId);
            setLoading(false); // Set loading to false after run completion
          } else if (status === 'requires_action' && action && action.submit_tool_outputs && action.submit_tool_outputs.tool_calls) {
            const toolCall = action.submit_tool_outputs.tool_calls[0];
            if (toolCall && toolCall.function && toolCall.function.arguments) {
              const { prompt } = JSON.parse(toolCall.function.arguments);
              const toolCallId = toolCall.id;
              // Submit tool outputs
              await submitToolOutputs(runId, toolCallId, prompt);
            }
          } else if (status === 'expired') {
            clearInterval(intervalId); // Stop the interval when run is completed
            // Send a an assistant message for the failure
            await axios.post(`http://localhost:8080/api/v1/threads/text/${threadId}/messages/assistant`, {
              content: "{\"text\": \"Sorry, something went terribly wrong on my end. Would you like to try again?\"}"
            }, {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            });
            // Update messages after completion
            fetchMessages(threadId);
            setLoading(false); // Set loading to false after run completion
          }
        } catch (error) {
          console.error('Failed to check run status', error);
          clearInterval(intervalId); // Stop the interval in case of error
        }
      }, 1000); // Check every 1 second
    } catch (error) {
      console.error('Failed to start checking run status', error);
      await axios.post(`http://localhost:8080/api/v1/threads/text/${threadId}/messages/assistant`, {
            content: "{\"text\": \"Sorry, something went terribly wrong on my end. Would you like to try again?\"}"
          }, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });
          // Update messages after completion
          fetchMessages(threadId);
    }
  };
  

  const submitToolOutputs = async (runId, toolCallId, prompt) => {
    const accessToken = Cookies.get('accessToken');
    try {
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
      await axios.post(`http://localhost:8080/api/v1/threads/text/${selectedThread}/messages/assistant`, {
        content: "{\"text\": \"Sorry, something went terribly wrong on my end. Would you like to try again?\"}"
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      // Update messages after completion
      fetchMessages(selectedThread);
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
        if (error.response && error.response.status === 401) {
          handleLogout(); // Call handleLogout method if response status is 401
        }
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
      if (error.response && error.response.status === 401) {
        handleLogout(); // Call handleLogout method if response status is 401
      }
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

  const transformMessageContentDeprecated = (messageContent) => {
    // Regular expression to match text within square brackets followed by a link within round brackets
    const regex = /\[([^\]]+)\]\(([^)]+)\)|[@!]([^\s]+)/g;
    // Replace matched text with anchor tags
    const transformedContent = messageContent.replace(regex, (match, title, link, thumbnail) => {
        if (thumbnail) {
            thumbnail = thumbnail.replace(/^\[|\]$/g, '');
            const thumbnailLink = `<br/><img src="${thumbnail}" alt="Thumbnail" style="max-width: 100px; max-height: 100px;"></img><br/>`;
            return thumbnailLink;
        } else {
            const linkText = `<a href="${link}" target="_blank">${title}</a>`;
            return linkText;
        }
    });

    // Replace "-" outside links with line breaks
    const finalContent = transformedContent.replace(/(?<!<\/?[^>]*)(?<!\w)-(?!\w)(?![^<]*?>)/g, '<br/>');

    return finalContent;
};

function transformMessageContent(messageContent) {
  const { sketch, image, text, links, thumbnails } = JSON.parse(messageContent);

  console.log(links)

  // Use image URLs
  const sketchImg = sketch ? `
    <div class="image-container">
      <p>Your sketch</p>
      <img src="${sketch}" alt="sketch" class="thumbnail"/>
    </div>` : '';

  const imageImg = image ? `
    <div class="image-container">
      <p>My image</p>
      <img src="${image}" alt="image" class="thumbnail"/>
    </div>` : '';

  // Generate links with thumbnails
  const linkThumbnails = thumbnails && links ? 
    links.map((link, index) => {
      const thumbnail = thumbnails[index] ? `<img src="${thumbnails[index]}" alt="thumbnail" class="thumbnail-link"/>` : '';
      return `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${thumbnail}</a>`;
    }).join(' ') : '';

  // Combine all parts
  const messageHTML = `
    <div class="message-content">
      <div class="images-wrapper">
        ${sketchImg}
        ${imageImg}
      </div>
      <p>${text}</p>
      <div class="link-thumbnails">
        ${linkThumbnails}
      </div>
    </div>
  `;

  return messageHTML;
}


  return (
    <div className="chat-page-container">
      <div className="top-bar">
        <button onClick={() => navigate('/chat')} className="back-button">Go back</button>
        <h2 id="no-margin">You are logged in as {username ? username : '?'}</h2>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      <div className="content">
        <div className="side-panel">
          <button onClick={handleNewThread} className="new-conversation-button">New Conversation</button>
          <ul className="thread-list">
            {threads.map((threadId, index) => (
              <li key={index} className={selectedThread === threadId ? 'selected' : ''} onClick={() => handleThreadClick(threadId)}>
                Thread {index + 1}
                <span onClick={() => handleDeleteThread(threadId)}>❌</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="chat-container">
        <div className="chat-content">
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
              ref={textareaRef}
              rows='1'
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
    </div>
  );
};

export default Text;
