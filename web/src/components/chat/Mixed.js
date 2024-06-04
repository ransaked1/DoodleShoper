import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate, useParams } from 'react-router-dom';
import '../../styles/topbar.css';
import '../../styles/overlay.css';
import '../../styles/main.css';

const Mixed = () => {
  const { thread_id } = useParams();
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [drawing, setDrawing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [toolCallId, setToolCallId] = useState('');
  const [runId, setRunId] = useState('');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayShownOnce, setOverlayShownOnce] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = (textarea.scrollHeight - 2) + 'px';
    }
  }, [newMessage]);

  // Function to scroll to the bottom of the messages container
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
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/users/me`, {
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

  // Reference to the canvas element
  const canvasRef = useRef(null);

  const introMessage ="{\"text\": \"Hello! I am DoodleShoper, your AI powered assistant. I am here to help you find the perfect product. What are you searching for today?\"}"

  // Function to handle drawing
  const handleDrawingStart = (event) => {
    setDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDrawing = (event) => {
    if (!drawing) return;

    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleDrawingEnd = () => {
    setDrawing(false);
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Function to show overlay popup
  const showOverlay = () => {
    if (!overlayVisible && !overlayShownOnce) {
      setOverlayVisible(true);
      setOverlayShownOnce(true);
    }
  };

  // Function to hide overlay popup
  const hideOverlay = () => {
    setOverlayVisible(false);
    setOverlayShownOnce(false);
  };

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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed`, {
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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${threadId}/messages`, {
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
      const newThreadResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed`, null, {
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
      await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${newThreadId}/messages/assistant`, {
        content: introMessage
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    
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
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${selectedThread}/messages`, {
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
        `${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${threadId}/runs`,
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
            `${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${threadId}/runs/${runId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const { status, action } = response.data;
          if (status === 'completed') {
            clearInterval(intervalId); // Stop the interval when run is completed
            setOverlayShownOnce(false);
            // Update messages after completion
            fetchMessages(threadId);
            setLoading(false); // Set loading to false after run completion
          } else if (status === 'requires_action' && action && action.submit_tool_outputs && action.submit_tool_outputs.tool_calls) {
            const toolCall = action.submit_tool_outputs.tool_calls[0];
            // console.log(action.submit_tool_outputs.tool_calls);
            if (toolCall && toolCall.function && toolCall.function.arguments && !imageProcessing && !overlayShownOnce) {
              const { prompt } = JSON.parse(toolCall.function.arguments);
              // Submit tool outputs
              setPrompt(prompt);
              setToolCallId(toolCall.id);
              setRunId(runId);
              showOverlay();
            }
          } else if (status === 'expired') {
            clearInterval(intervalId); // Stop the interval when run is completed
            setOverlayShownOnce(false);
            // Send a an assistant message for the failure
            await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${threadId}/messages/assistant`, {
              content: "{\"text\": \"Sorry, I haven't received the needed information for the search. Would you like to try again?\"}"
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
          clearInterval(intervalId);
          // Send a an assistant message for the failure
          await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${threadId}/messages/assistant`, {
            content: "{\"text\": \"Sorry, something went terribly wrong on my end. Would you like to try again?\"}"
          }, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });
          // Update messages after completion
          fetchMessages(threadId);
        }
      }, 1000); // Check every 1 second
    } catch (error) {
      console.error('Failed to start checking run status', error);
      await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${threadId}/messages/assistant`, {
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
  

  const submitToolOutputs = async (runId, toolCallId, prompt, includeImage) => {
    const accessToken = Cookies.get('accessToken');
    try {
      const canvasDataUrl = canvasRef.current.toDataURL(); // Get image data URL from canvas

      let base64Image = null;
      if (includeImage) {
        base64Image = canvasDataUrl.split(',')[1]; // Extract base64 image data
      }
      
      setImageProcessing(true);
      hideOverlay();
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${selectedThread}/runs/${runId}/submit_tool_outputs`,
        {
          tool_call_id: toolCallId,
          prompt,
          image: {
            "mime": "image/png",
            "data": base64Image
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setImageProcessing(false);
    } catch (error) {
      console.error('Failed to submit tool outputs', error);
      // Send a an assistant message for the failure
      await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${selectedThread}/messages/assistant`, {
        content: "{\"text\": \"Sorry, something went terribly wrong on my end. Would you like to try again?\"}"
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      // Update messages after completion
      fetchMessages(selectedThread);
      setImageProcessing(false);
    }
  };

  const handleThreadClick = async (threadId) => {
    setSelectedThread(threadId);
    try {
        const accessToken = Cookies.get('accessToken');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed/${threadId}/messages`, {
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
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/v1/threads/mixed?thread_id=${threadId}`, {
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
      await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/users/logout`, null, {
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
      {overlayVisible && (
        <div className="overlay">
          <div className="overlay-content">
            <h3>Would you like to include an image in your search?</h3>
            {/* Drawing canvas */}
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              onMouseDown={handleDrawingStart}
              onMouseMove={handleDrawing}
              onMouseUp={handleDrawingEnd}
            />

            {/* Tool buttons */}
            <div className="tools">
              <div className="button-group">
                  <button className="clear-button" onClick={clearCanvas}>Clear</button>
              </div>
              <div className="button-group">
                  <button className="submit-button" onClick={() => submitToolOutputs(runId, toolCallId, prompt, true)}>Submit</button>
                  <button className="no-image-button" onClick={() => submitToolOutputs(runId, toolCallId, prompt, false)}>No Image</button>
                  <button className="cancel-button" onClick={hideOverlay}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
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

export default Mixed;
