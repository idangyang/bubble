const UidCounter = require('../models/UidCounter');

/**
 * 生成月份格式的 UID
 * 规则：
 * - 1月: 100001, 100002, ...
 * - 2月: 200001, 200002, ...
 * - 10月: 1000001, 1000002, ...
 * - 12月: 1200001, 1200002, ...
 *
 * 时区：使用中国时间（UTC+8）
 *
 * @returns {Promise<string>} 生成的 UID
 */
async function generateMonthlyUid() {
  // 获取当前 UTC 时间
  const now = new Date();

  // 转换为中国时间（UTC+8）
  const chinaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));

  const year = chinaTime.getUTCFullYear();
  const month = chinaTime.getUTCMonth() + 1; // 1-12
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`; // 例如 "2026-01"

  // 使用 findOneAndUpdate 原子操作来增加计数器
  const counter = await UidCounter.findOneAndUpdate(
    { yearMonth },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );

  // 生成 UID
  // 月份前缀 + 序号（5位数字，不足补0）
  const monthPrefix = month * 100000; // 1月=100000, 2月=200000, ..., 10月=1000000, 12月=1200000
  const uid = String(monthPrefix + counter.count);

  return uid;
}

module.exports = { generateMonthlyUid };
