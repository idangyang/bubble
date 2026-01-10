import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './VideoUpload.css';

const VideoUpload = ({ onUploadSuccess }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleThumbnailChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setThumbnail(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('请选择视频文件');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);
    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }

    setUploading(true);
    setProgress(0);

    try {
      const response = await api.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      alert('视频上传成功！');
      setFile(null);
      setTitle('');
      setDescription('');
      setProgress(0);

      if (onUploadSuccess) {
        onUploadSuccess(response.data.video);
      }

      // 上传成功后跳转到主页
      navigate('/');
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请检查网络或重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="video-upload-container">
      <h2>上传视频</h2>

      <div className="upload-type-selector">
        <button
          type="button"
          className="type-button active"
        >
          上传单个视频
        </button>
        <button
          type="button"
          className="type-button"
          onClick={() => navigate('/series/upload')}
        >
          上传剧集
        </button>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>选择视频文件</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="file-input"
          />
          {file && <p className="file-name">已选择: {file.name}</p>}
        </div>

        <div className="form-group">
          <label>选择封面图片（可选）</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            disabled={uploading}
            className="file-input"
          />
          {thumbnail && <p className="file-name">已选择: {thumbnail.name}</p>}
          <p className="hint">如果不上传封面，将随机使用视频某一帧作为封面</p>
        </div>

        <div className="form-group">
          <label>视频标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入视频标题"
            required
            disabled={uploading}
            className="text-input"
          />
        </div>

        <div className="form-group">
          <label>视频描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入视频描述（可选）"
            disabled={uploading}
            className="textarea-input"
            rows="4"
          />
        </div>

        {uploading && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}>
              {progress}%
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="upload-button"
        >
          {uploading ? '上传中...' : '上传视频'}
        </button>
      </form>
    </div>
  );
};

export default VideoUpload;
