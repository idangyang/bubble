import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './UserProfile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // 修改密码表单
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 修改邮箱表单
  const [emailForm, setEmailForm] = useState({
    password: '',
    newEmail: ''
  });

  // 注销账号表单
  const [deactivatePassword, setDeactivatePassword] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  // 修改密码
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      alert('密码修改成功');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('修改密码错误:', error);
      console.error('错误详情:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || '修改失败，请重试';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 修改邮箱
  const handleChangeEmail = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const response = await api.put('/auth/change-email', {
        password: emailForm.password,
        newEmail: emailForm.newEmail
      });

      alert('邮箱修改成功');
      const updatedUser = { ...user, email: response.data.email };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEmailForm({ password: '', newEmail: '' });
    } catch (error) {
      const errorMsg = error.response?.data?.error || '修改失败，请重试';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 退出登录
  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      navigate('/auth');
    }
  };

  // 注销账号
  const handleDeactivate = async (e) => {
    e.preventDefault();

    if (!window.confirm('注销账号后，您的数据将在30天后永久删除。确定要注销吗？')) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/deactivate', {
        password: deactivatePassword
      });

      alert('账号已注销，数据将在30天后删除');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      navigate('/auth');
    } catch (error) {
      const errorMsg = error.response?.data?.error || '注销失败，请重试';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="profile-container"><div className="loading">加载中...</div></div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-box">
        <h2 className="profile-title">个人中心</h2>

        {/* 用户信息 */}
        <div className="profile-section">
          <h3>用户信息</h3>
          <div className="info-item">
            <label>用户名：</label>
            <span>{user.username}</span>
          </div>
          <div className="info-item">
            <label>邮箱：</label>
            <span>{user.email}</span>
          </div>
        </div>

        {/* 修改密码 */}
        <div className="profile-section">
          <h3>修改密码</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>当前密码</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>新密码</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                required
                minLength={4}
              />
            </div>
            <div className="form-group">
              <label>确认新密码</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                required
                minLength={4}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '处理中...' : '修改密码'}
            </button>
          </form>
        </div>

        {/* 修改邮箱 */}
        <div className="profile-section">
          <h3>修改邮箱</h3>
          <form onSubmit={handleChangeEmail}>
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                value={emailForm.password}
                onChange={(e) => setEmailForm({...emailForm, password: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>新邮箱</label>
              <input
                type="email"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm({...emailForm, newEmail: e.target.value})}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '处理中...' : '修改邮箱'}
            </button>
          </form>
        </div>

        {/* 退出登录 */}
        <div className="profile-section">
          <h3>退出登录</h3>
          <button onClick={handleLogout} className="btn-secondary">
            退出登录
          </button>
        </div>

        {/* 注销账号 */}
        <div className="profile-section danger-section">
          <h3>注销账号</h3>
          <p className="warning-text">注销账号后，您的数据将在30天后永久删除</p>
          <form onSubmit={handleDeactivate}>
            <div className="form-group">
              <label>请输入密码确认注销</label>
              <input
                type="password"
                value={deactivatePassword}
                onChange={(e) => setDeactivatePassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-danger">
              {loading ? '处理中...' : '注销账号'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
