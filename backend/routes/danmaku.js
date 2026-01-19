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
      .populate('user', 'username uid')
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

// 点赞弹幕
router.post('/:id/like', auth, async (req, res) => {
  try {
    const danmaku = await Danmaku.findById(req.params.id);

    if (!danmaku) {
      return res.status(404).json({ error: '弹幕不存在' });
    }

    // 检查用户是否已经点赞（使用字符串比较）
    const alreadyLiked = danmaku.likedBy.some(id => id.toString() === req.userId.toString());

    if (alreadyLiked) {
      return res.status(400).json({ error: '已经点赞过此弹幕' });
    }

    // 添加点赞
    danmaku.likes += 1;
    danmaku.likedBy.push(req.userId);
    await danmaku.save();

    res.json({
      message: '点赞成功',
      likes: danmaku.likes
    });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ error: '点赞失败' });
  }
});

// 取消点赞弹幕
router.delete('/:id/like', auth, async (req, res) => {
  try {
    const danmaku = await Danmaku.findById(req.params.id);

    if (!danmaku) {
      return res.status(404).json({ error: '弹幕不存在' });
    }

    // 检查用户是否已经点赞（使用字符串比较）
    const likeIndex = danmaku.likedBy.findIndex(id => id.toString() === req.userId.toString());

    if (likeIndex === -1) {
      return res.status(400).json({ error: '尚未点赞此弹幕' });
    }

    // 取消点赞
    danmaku.likes -= 1;
    danmaku.likedBy.splice(likeIndex, 1);
    await danmaku.save();

    res.json({
      message: '取消点赞成功',
      likes: danmaku.likes
    });
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json({ error: '取消点赞失败' });
  }
});

// 请求审查弹幕
router.post('/:id/report', auth, async (req, res) => {
  try {
    const danmaku = await Danmaku.findById(req.params.id);

    if (!danmaku) {
      return res.status(404).json({ error: '弹幕不存在' });
    }

    // 这里可以添加实际的审查逻辑，比如：
    // 1. 记录举报信息到数据库
    // 2. 发送通知给管理员
    // 3. 自动检测违规内容

    // 简单实现：记录举报（可以扩展 Danmaku 模型添加 reports 字段）
    console.log(`用户 ${req.userId} 举报了弹幕 ${req.params.id}: "${danmaku.text}"`);

    res.json({
      message: '举报成功，我们会尽快处理',
      success: true
    });
  } catch (error) {
    console.error('举报失败:', error);
    res.status(500).json({ error: '举报失败' });
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
