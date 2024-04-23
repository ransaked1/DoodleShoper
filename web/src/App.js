import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Login from './components/Login';
import Signup from './components/Signup';
import Chat from './components/chat/Chat';
import Text from './components/chat/Text';
import Mixed from './components/chat/Mixed';
import Sketch from './components/chat/Sketch';

const App = () => {
  const isLoggedIn = !!Cookies.get('accessToken');

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/chat" /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/text" element={isLoggedIn ? <Text /> : <Login />} />
        <Route path="/chat/mixed" element={isLoggedIn ? <Mixed /> : <Login />} />
        <Route path="/chat/sketch" element={isLoggedIn ? <Sketch /> : <Login />} />
      </Routes>
    </Router>
  );
};

export default App;