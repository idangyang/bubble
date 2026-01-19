const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-danmaku-site', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 查询所有用户的 UID
const queryUsers = async () => {
  try {
    const users = await User.find({})
      .select('username email uid createdAt')
      .sort({ createdAt: -1 });

    console.log('\n========== 现有用户列表 ==========\n');
    console.log(`总用户数: ${users.length}\n`);

    if (users.length === 0) {
      console.log('暂无用户数据');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. 用户名: ${user.username}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   UID: ${user.uid || '未设置'}`);
        console.log(`   注册时间: ${user.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
        console.log('');
      });
    }

    console.log('========== 查询完成 ==========\n');
  } catch (error) {
    console.error('查询用户失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
};

// 执行查询
const main = async () => {
  await connectDB();
  await queryUsers();
};

main();
