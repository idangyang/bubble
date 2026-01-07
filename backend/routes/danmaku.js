const express = require('express');
const router = express.Router();
const Danmaku = require('../models/Danmaku');
const auth = require('../middleware/auth');

// 发送弹幕
router.post('/', auth, async (req, res) => {
  try {
    const { videoId, text, time, color, type } = req.body;

    if (!videoId || !text || time === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const danmaku = new Danmaku({
      videoId,
      user: req.userId,
      text,
      time,
      color: color || '#FFFFFF',
      type: type || 'scroll'
    });

    await danmaku.save();

    res.status(201).json({
      message: '弹幕发送成功',
      danmaku
    });
  } catch (error) {
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

module.exports = router;
