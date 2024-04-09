import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Login from './components/Login';
import Signup from './components/Signup';
import LoggedIn from './components/LoggedIn';

const App = () => {
  const isLoggedIn = !!Cookies.get('accessToken');

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/chat" /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/chat" element={isLoggedIn ? <LoggedIn /> : <Login />} />
      </Routes>
    </Router>
  );
};

export default App;