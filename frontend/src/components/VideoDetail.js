import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DanmakuEngine from '../utils/DanmakuEngine';
import './VideoDetail.css';

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const danmakuEngineRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [danmakus, setDanmakus] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [danmakuText, setDanmakuText] = useState('');
  const [danmakuColor, setDanmakuColor] = useState('#FFFFFF');
  const [commentText, setCommentText] = useState('');
  const [lastTime, setLastTime] = useState(0);
  const shownDanmakusRef = useRef(new Set());

  useEffect(() => {
    fetchVideoData();
  }, [id]);

  useEffect(() => {
    if (videoRef.current && canvasRef.current && video) {
      if (!danmakuEngineRef.current) {
        danmakuEngineRef.current = new DanmakuEngine(canvasRef.current);
      }

      // 确保 Canvas 尺寸正确
      danmakuEngineRef.current.init();
      danmakuEngineRef.current.start();
      console.log('DanmakuEngine 初始化完成, Canvas尺寸:', canvasRef.current.width, 'x', canvasRef.current.height);
    }

    return () => {
      if (danmakuEngineRef.current) {
        danmakuEngineRef.current.stop();
      }
    };
  }, [video]);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      const [videoRes, danmakuRes, commentRes] = await Promise.all([
        api.get(`/videos/${id}`),
        api.get(`/danmaku/video/${id}`),
        api.get(`/comments/video/${id}`)
      ]);

      setVideo(videoRes.data.video);
      setDanmakus(danmakuRes.data.danmakus);
      setComments(commentRes.data.comments);
      setError('');
      console.log('加载的弹幕数据:', danmakuRes.data.danmakus);
    } catch (err) {
      console.error('获取视频数据失败:', err);
      setError('加载视频失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !danmakuEngineRef.current) return;

    const currentTime = videoRef.current.currentTime;

    // 检测是否发生了时间跳跃（拖动进度条）
    const timeJump = Math.abs(currentTime - lastTime) > 1;

    danmakus.forEach(danmaku => {
      // 弹幕应该在当前时间点显示
      const shouldShow = danmaku.time >= lastTime && danmaku.time <= currentTime;

      // 检查这条弹幕是否已经显示过
      if (!shownDanmakusRef.current.has(danmaku._id)) {
        if (shouldShow || timeJump) {
          // 如果是时间跳跃，只显示当前时间点附近的弹幕
          if (timeJump) {
            if (Math.abs(danmaku.time - currentTime) < 0.5) {
              console.log('显示弹幕:', danmaku.text, '弹幕时间:', danmaku.time, '当前时间:', currentTime);
              danmakuEngineRef.current.add(danmaku.text, danmaku.color || '#FFFFFF', danmaku.type || 'scroll');
              shownDanmakusRef.current.add(danmaku._id);
            }
          } else {
            console.log('显示弹幕:', danmaku.text, '弹幕时间:', danmaku.time, '当前时间:', currentTime);
            danmakuEngineRef.current.add(danmaku.text, danmaku.color || '#FFFFFF', danmaku.type || 'scroll');
            shownDanmakusRef.current.add(danmaku._id);
          }
        }
      }
    });

    setLastTime(currentTime);
  };

  const handlePlay = () => {
    if (danmakuEngineRef.current) {
      danmakuEngineRef.current.resume();
    }
  };

  const handlePause = () => {
    if (danmakuEngineRef.current) {
      danmakuEngineRef.current.pause();
    }
  };

  const handleSeeking = () => {
    if (videoRef.current && danmakuEngineRef.current) {
      // 清除所有正在显示的弹幕
      danmakuEngineRef.current.clear();
      // 清空已显示弹幕的记录
      shownDanmakusRef.current.clear();
      // 更新时间追踪
      setLastTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    // 视频元数据加载完成后，重新初始化 Canvas
    if (canvasRef.current && danmakuEngineRef.current) {
      danmakuEngineRef.current.init();
      console.log('视频加载完成，Canvas重新初始化:', canvasRef.current.width, 'x', canvasRef.current.height);
    }
  };

  const handleSendDanmaku = async (e) => {
    e.preventDefault();
    if (!danmakuText.trim()) return;

    try {
      const currentTime = videoRef.current?.currentTime || 0;
      const response = await api.post('/danmaku', {
        videoId: id,
        text: danmakuText,
        time: currentTime,
        color: danmakuColor,
        type: 'scroll'
      });

      if (danmakuEngineRef.current) {
        danmakuEngineRef.current.add(danmakuText, danmakuColor, 'scroll');
        // 将新发送的弹幕ID添加到已显示列表，防止重复显示
        shownDanmakusRef.current.add(response.data.danmaku._id);
      }

      setDanmakus([...danmakus, response.data.danmaku]);
      setDanmakuText('');
    } catch (err) {
      console.error('发送弹幕失败:', err);
      alert('发送弹幕失败');
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await api.post('/comments', {
        videoId: id,
        text: commentText
      });

      setComments([response.data.comment, ...comments]);
      setCommentText('');
    } catch (err) {
      console.error('发送评论失败:', err);
      alert('发送评论失败');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) return;

    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      console.error('删除评论失败:', err);
      alert('删除评论失败');
    }
  };

  if (loading) {
    return <div className="video-detail-container"><div className="loading">加载中...</div></div>;
  }

  if (error) {
    return <div className="video-detail-container"><div className="error">{error}</div></div>;
  }

  if (!video) {
    return <div className="video-detail-container"><div className="error">视频不存在</div></div>;
  }

  const videoUrl = `http://localhost:5001/api/videos/stream/${video._id}`;

  return (
    <div className="video-detail-container">
      <div className="video-section">
        <div className="video-player-wrapper">
          <video
            ref={videoRef}
            className="video-player"
            src={videoUrl}
            controls
            autoPlay
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeeking={handleSeeking}
            onLoadedMetadata={handleLoadedMetadata}
          />
          <canvas ref={canvasRef} className="danmaku-canvas" />
        </div>

        <div className="video-info-section">
          <h1 className="video-title">{video.title}</h1>
          <p className="video-description">{video.description || '暂无描述'}</p>
          <div className="video-meta">
            <span>上传者: {video.uploader?.username || '未知用户'}</span>
            <span>观看次数: {video.views}</span>
          </div>
        </div>

        <div className="danmaku-input-section">
          <h3>发送弹幕</h3>
          <form onSubmit={handleSendDanmaku} className="danmaku-form">
            <input
              type="text"
              value={danmakuText}
              onChange={(e) => setDanmakuText(e.target.value)}
              placeholder="输入弹幕内容..."
              maxLength={100}
              className="danmaku-input"
            />
            <input
              type="color"
              value={danmakuColor}
              onChange={(e) => setDanmakuColor(e.target.value)}
              className="color-picker"
            />
            <button type="submit" className="send-button">发送</button>
          </form>
        </div>
      </div>

      <div className="comments-section">
        <h3>评论区 ({comments.length})</h3>
        <form onSubmit={handleSendComment} className="comment-form">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="发表你的评论..."
            maxLength={500}
            className="comment-textarea"
          />
          <button type="submit" className="send-button">发表评论</button>
        </form>

        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="no-comments">暂无评论，快来发表第一条评论吧！</p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.user?.username || '未知用户'}</span>
                  <span className="comment-time">
                    {new Date(comment.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
                {comment.user?._id === localStorage.getItem('userId') && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="delete-button"
                  >
                    删除
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;