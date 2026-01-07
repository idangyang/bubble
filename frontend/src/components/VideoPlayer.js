import React, { useRef, useEffect, useState } from 'react';
import DanmakuEngine from '../utils/DanmakuEngine';
import api from '../services/api';
import './VideoPlayer.css';

const VideoPlayer = ({ videoId, videoUrl }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const [danmakuText, setDanmakuText] = useState('');
  const [danmakuColor, setDanmakuColor] = useState('#FFFFFF');
  const [allDanmakus, setAllDanmakus] = useState([]);

  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new DanmakuEngine(canvasRef.current);
      engineRef.current.init();
      engineRef.current.start();
    }

    if (videoId) {
      loadDanmakus();
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, [videoId]);

  const loadDanmakus = async () => {
    try {
      const response = await api.get(`/danmaku/video/${videoId}`);
      setAllDanmakus(response.data.danmakus);
    } catch (error) {
      console.error('加载弹幕失败:', error);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !engineRef.current) return;

    const currentTime = videoRef.current.currentTime;
    const danmakusToShow = allDanmakus.filter(
      d => Math.abs(d.time - currentTime) < 0.5
    );

    danmakusToShow.forEach(d => {
      engineRef.current.add(d.text, d.color, d.type);
    });
  };

  const handleSendDanmaku = async (e) => {
    e.preventDefault();
    if (!danmakuText.trim() || !videoRef.current) return;

    const currentTime = videoRef.current.currentTime;

    try {
      await api.post('/danmaku', {
        videoId,
        text: danmakuText,
        time: currentTime,
        color: danmakuColor,
        type: 'scroll'
      });

      engineRef.current.add(danmakuText, danmakuColor, 'scroll');
      setDanmakuText('');
      loadDanmakus();
    } catch (error) {
      console.error('发送弹幕失败:', error);
      alert('发送弹幕失败，请先登录');
    }
  };

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          onTimeUpdate={handleTimeUpdate}
          className="video-element"
        />
        <canvas ref={canvasRef} className="danmaku-canvas" />
      </div>

      <form onSubmit={handleSendDanmaku} className="danmaku-input-form">
        <input
          type="text"
          value={danmakuText}
          onChange={(e) => setDanmakuText(e.target.value)}
          placeholder="输入弹幕..."
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
  );
};

export default VideoPlayer;
