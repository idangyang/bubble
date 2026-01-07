import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Home.css';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/videos');
      setVideos(response.data.videos);
      setError('');
    } catch (err) {
      console.error('获取视频列表失败:', err);
      setError('加载视频失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  if (loading) {
    return <div className="home-container"><div className="loading">加载中...</div></div>;
  }

  if (error) {
    return <div className="home-container"><div className="error">{error}</div></div>;
  }

  return (
    <div className="home-container">
      <h1 className="home-title">视频列表</h1>
      {videos.length === 0 ? (
        <div className="no-videos">暂无视频，快去上传吧！</div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <div
              key={video._id}
              className="video-card"
              onClick={() => handleVideoClick(video._id)}
            >
              <div className="video-thumbnail">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} />
                ) : (
                  <div className="thumbnail-placeholder">
                    <span>📹</span>
                  </div>
                )}
              </div>
              <div className="video-info">
                <h3 className="video-title">{video.title}</h3>
                <p className="video-description">{video.description || '暂无描述'}</p>
                <div className="video-meta">
                  <span className="video-uploader">
                    {video.uploader?.username || '未知用户'}
                  </span>
                  <span className="video-views">👁 {video.views} 次观看</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
