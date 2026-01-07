const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// 上传视频
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择视频文件' });
    }

    const { title, description } = req.body;

    const video = new Video({
      title: title || req.file.originalname,
      description: description || '',
      filename: req.file.filename,
      filepath: req.file.path,
      uploader: req.userId
    });

    await video.save();

    res.status(201).json({
      message: '视频上传成功',
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        createdAt: video.createdAt
      }
    });
  } catch (error) {
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
