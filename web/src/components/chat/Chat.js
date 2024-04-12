import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate, Link } from 'react-router-dom';

const Chat = () => {
  const navigate = useNavigate();

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
    <div>
      <div className="top-bar">
        <h2>User is logged in</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="options-container">
        <Link to="/chat/text" className="option-card">
          Text-Based
        </Link>
        <Link to="/chat/mixed" className="option-card">
          Sketch-Based
        </Link>
        <Link to="" className="option-card">
          Sketch-Based <br/>with SignWriting <br/> (Not yet available)
        </Link>
      </div>
    </div>
  );
};

export default Chat;