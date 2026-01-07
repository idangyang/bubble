import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          气泡
        </Link>

        <div className="navbar-menu">
          {token ? (
            <>
              <Link to="/upload" className="navbar-upload-btn">
                上传视频
              </Link>
              <button onClick={handleLogout} className="navbar-logout-btn">
                退出登录
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-login-btn">
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
