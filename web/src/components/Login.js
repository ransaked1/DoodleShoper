import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import '../styles/login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = !!Cookies.get('accessToken');
    if (isLoggedIn) {
      navigate('/chat');
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/users/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const accessToken = response.data.access_token;
      // Save token in cookie
      Cookies.set('accessToken', accessToken, { expires: 7 }); // Token expires in 7 days
      navigate('/chat');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        // Display the error message received from the server
        setError(error.response.data.detail);
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={handleUsernameChange}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
        />
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <Link to="/auth/signup">Signup</Link></p>
    </div>
  );
};

export default Login;
