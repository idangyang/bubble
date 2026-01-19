const mongoose = require('mongoose');
const User = require('../models/User');
const UidCounter = require('../models/UidCounter');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-danmaku-site');
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 检查 UID 分配情况
const checkUidStatus = async () => {
  try {
    // 查询有 UID 的用户
    const usersWithUid = await User.find({ uid: { $exists: true, $ne: null } })
      .select('username email uid createdAt')
      .sort({ createdAt: 1 });

    // 查询没有 UID 的用户
    const usersWithoutUid = await User.find({ $or: [{ uid: { $exists: false } }, { uid: null }] })
      .select('username email createdAt')
      .sort({ createdAt: 1 });

    // 查询计数器状态
    const counters = await UidCounter.find({}).sort({ yearMonth: 1 });

    console.log('\n========== UID 分配情况检查 ==========\n');

    console.log(`✅ 已有 UID 的用户数: ${usersWithUid.length}`);
    if (usersWithUid.length > 0) {
      usersWithUid.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} - UID: ${user.uid} (注册于 ${user.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })})`);
      });
    }

    console.log(`\n❌ 没有 UID 的用户数: ${usersWithoutUid.length}`);
    if (usersWithoutUid.length > 0) {
      usersWithoutUid.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (注册于 ${user.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })})`);
      });
    }

    console.log(`\n📊 月份计数器状态:`);
    if (counters.length === 0) {
      console.log('   暂无计数器记录');
    } else {
      counters.forEach(counter => {
        console.log(`   ${counter.yearMonth}: 已分配 ${counter.count} 个 UID`);
      });
    }

    console.log('\n========== 检查完成 ==========\n');

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
};

// 执行检查
const main = async () => {
  await connectDB();
  await checkUidStatus();
};

main();
