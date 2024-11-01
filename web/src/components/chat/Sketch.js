import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const Sketch = () => {
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
        <button onClick={() => navigate('/chat')}>Back to Chat</button>
        <h2>User is logged in</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      {/* Your content for the Sketch component */}
    </div>
  );
};

export default Sketch;
