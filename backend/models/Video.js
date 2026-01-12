const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  filename: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 0
  },
  aspectRatio: {
    type: Number,
    default: 1.78
  },
  // 转码状态: 'original' (原始文件), 'transcoding' (转码中), 'completed' (转码完成)
  transcodeStatus: {
    type: String,
    enum: ['original', 'transcoding', 'completed'],
    default: 'original'
  },
  // 原始文件路径（如果转码了，保存原始文件路径）
  originalFilepath: {
    type: String,
    default: ''
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Video', videoSchema);
