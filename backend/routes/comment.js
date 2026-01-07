const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// 发送评论
router.post('/', auth, async (req, res) => {
  try {
    const { videoId, text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: '评论内容不能为空' });
    }

    const comment = new Comment({
      videoId,
      user: req.user.id,
      text: text.trim()
    });

    await comment.save();
    await comment.populate('user', 'username avatar');

    res.status(201).json({ message: '评论发送成功', comment });
  } catch (error) {
    console.error('发送评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取视频的所有评论
router.get('/video/:videoId', async (req, res) => {
  try {
    const comments = await Comment.find({ videoId: req.params.videoId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    console.error('获取评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除评论
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '无权删除此评论' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: '评论已删除' });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
