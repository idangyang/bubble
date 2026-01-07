const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const { generateThumbnail, getVideoAspectRatio } = require('../utils/thumbnail');

// 上传视频
router.post('/upload', auth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({ error: '请选择视频文件' });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
    const { title, description } = req.body;

    let thumbnailPath = '';

    // 如果用户上传了封面，使用用户上传的封面
    if (thumbnailFile) {
      // 存储相对路径，方便前端访问
      thumbnailPath = thumbnailFile.path.replace(/\\/g, '/').replace(/^.*\/uploads\//, 'uploads/');
    } else {
      // 如果没有上传封面，自动生成视频第一帧作为封面
      try {
        const thumbnailDir = path.join(__dirname, '../uploads/thumbnails');
        const thumbnailFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        const fullPath = path.join(thumbnailDir, thumbnailFilename);

        await generateThumbnail(videoFile.path, fullPath);
        // 存储相对路径
        thumbnailPath = `uploads/thumbnails/${thumbnailFilename}`;
      } catch (err) {
        console.error('生成封面失败:', err);
        // 如果生成失败，继续保存视频，只是没有封面
      }
    }

    // 获取视频宽高比
    let aspectRatio = 1.78; // 默认16:9
    try {
      aspectRatio = await getVideoAspectRatio(videoFile.path);
      console.log('视频宽高比:', aspectRatio);
    } catch (err) {
      console.error('获取视频宽高比失败:', err);
    }

    const video = new Video({
      title: title || videoFile.originalname,
      description: description || '',
      filename: videoFile.filename,
      filepath: videoFile.path,
      thumbnail: thumbnailPath,
      aspectRatio: aspectRatio,
      uploader: req.userId
    });

    await video.save();

    res.status(201).json({
      message: '视频上传成功',
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        createdAt: video.createdAt
      }
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

// 获取视频列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const videos = await Video.find()
      .populate('uploader', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Video.countDocuments();

    res.json({
      videos,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: '获取视频列表失败' });
  }
});

// 获取单个视频
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploader', 'username avatar');

    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }

    video.views += 1;
    await video.save();

    res.json({ video });
  } catch (error) {
    res.status(500).json({ error: '获取视频失败' });
  }
});

// 流式传输视频
router.get('/stream/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }

    const videoPath = path.resolve(video.filepath);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: '视频文件不存在' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: '视频流传输失败' });
  }
});

module.exports = router;
