import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/chat.css';
import '../../styles/topbar.css';

const Chat = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

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
    <div className="chat-page-container">
      <div className="top-bar">
        <h2>Welcome {username ? username : ''} to DoodleShoper</h2>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
      <div className="options-container">
        <Link to="/chat/text" className="option-card">
          Text-Based
        </Link>
        <Link to="/chat/mixed" className="option-card">
          Sketch-Based
        </Link>
        <div className="option-card disabled">
          Sketch-Based <br/>with SignWriting <br/> (Not yet available)
        </div>
      </div>
    </div>
  );
};

export default Chat;