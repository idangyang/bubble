import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import VideoDetail from './components/VideoDetail';
import VideoUpload from './components/VideoUpload';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import './App.css';

function App() {
  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/video/:id"
              element={
                <PrivateRoute>
                  <VideoDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <PrivateRoute>
                  <VideoUpload />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
