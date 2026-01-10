const express = require('express');
const router = express.Router();
const Danmaku = require('../models/Danmaku');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const asrService = require('../utils/asrService');

// 发送弹幕（支持语音弹幕）
router.post('/', auth, upload.single('audio'), async (req, res) => {
  try {
    const { videoId, text, time, color, type, isVoice, duration } = req.body;

    if (!videoId || !text || time === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const danmakuData = {
      videoId,
      user: req.userId,
      text,
      time,
      color: color || '#FFFFFF',
      type: type || 'scroll',
      isVoice: isVoice === 'true' || isVoice === true,
      duration: duration ? parseFloat(duration) : 0
    };

    // 如果是语音弹幕且有音频文件
    if (danmakuData.isVoice && req.file) {
      danmakuData.audioUrl = `/uploads/audio/${req.file.filename}`;
    }

    const danmaku = new Danmaku(danmakuData);
    await danmaku.save();

    res.status(201).json({
      message: '弹幕发送成功',
      danmaku
    });
  } catch (error) {
    console.error('发送弹幕失败:', error);
    res.status(500).json({ error: '发送弹幕失败' });
  }
});

// 获取视频的所有弹幕
router.get('/video/:videoId', async (req, res) => {
  try {
    const danmakus = await Danmaku.find({ videoId: req.params.videoId })
      .populate('user', 'username')
      .sort({ time: 1 });

    res.json({ danmakus });
  } catch (error) {
    res.status(500).json({ error: '获取弹幕失败' });
  }
});

// 删除弹幕（用户只能删除自己的弹幕）
router.delete('/:id', auth, async (req, res) => {
  try {
    const danmaku = await Danmaku.findById(req.params.id);

    if (!danmaku) {
      return res.status(404).json({ error: '弹幕不存在' });
    }

    if (danmaku.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: '无权删除此弹幕' });
    }

    await danmaku.deleteOne();

    res.json({ message: '弹幕已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除弹幕失败' });
  }
});

// 语音识别接口
router.post('/transcribe', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传音频文件' });
    }

    const audioPath = req.file.path;

    try {
      // 调用阿里云百炼进行语音识别
      const transcribedText = await asrService.transcribe(audioPath);

      // 清理临时文件
      await fs.unlink(audioPath);

      res.json({
        text: transcribedText,
        message: '语音识别成功'
      });
    } catch (asrError) {
      console.error('语音识别失败:', asrError);

      // 清理临时文件
      try {
        await fs.unlink(audioPath);
      } catch (unlinkError) {
        console.error('删除临时文件失败:', unlinkError);
      }

      res.status(500).json({
        error: '语音识别失败',
        details: asrError.message
      });
    }
  } catch (error) {
    console.error('处理请求失败:', error);
    res.status(500).json({ error: '处理请求失败' });
  }
});

module.exports = router;
