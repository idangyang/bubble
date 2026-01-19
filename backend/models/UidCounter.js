const mongoose = require('mongoose');

// UID 计数器模型，用于跟踪每个月的用户注册顺序
const uidCounterSchema = new mongoose.Schema({
  // 格式: "YYYY-MM" 例如 "2026-01"
  yearMonth: {
    type: String,
    required: true,
    unique: true
  },
  // 当前月份的注册计数
  count: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('UidCounter', uidCounterSchema);
