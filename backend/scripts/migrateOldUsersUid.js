const mongoose = require('mongoose');
const User = require('../models/User');
const UidCounter = require('../models/UidCounter');
require('dotenv').config();

/**
 * 老用户 UID 迁移脚本
 *
 * 规则：老用户优先
 * 1. 检查每个月份的计数器当前值
 * 2. 为老用户按注册时间顺序分配 UID
 * 3. 调整计数器，确保新用户的 UID 在老用户之后
 * 4. 如果该月份已有新用户注册，将新用户的 UID 重新分配到老用户之后
 */

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-danmaku-site');
    console.log('✅ MongoDB 连接成功\n');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 获取中国时间的年月
const getChinaYearMonth = (date) => {
  const chinaTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  const year = chinaTime.getUTCFullYear();
  const month = chinaTime.getUTCMonth() + 1;
  return {
    year,
    month,
    yearMonth: `${year}-${String(month).padStart(2, '0')}`
  };
};

// 生成 UID
const generateUid = (month, sequence) => {
  const monthPrefix = month * 100000;
  return String(monthPrefix + sequence);
};

// 主迁移函数
const migrateOldUsers = async () => {
  const startTime = Date.now();
  console.log('========== 开始老用户 UID 迁移 ==========\n');

  try {
    // 步骤 1: 查询所有没有 UID 的老用户
    console.log('📋 步骤 1: 查询没有 UID 的老用户...');
    const oldUsers = await User.find({
      $or: [{ uid: { $exists: false } }, { uid: null }]
    }).sort({ createdAt: 1 });

    console.log(`   找到 ${oldUsers.length} 个老用户\n`);

    if (oldUsers.length === 0) {
      console.log('✅ 没有需要迁移的用户');
      return;
    }

    // 步骤 2: 查询所有已有 UID 的新用户
    console.log('📋 步骤 2: 查询已有 UID 的新用户...');
    const newUsers = await User.find({
      uid: { $exists: true, $ne: null }
    }).sort({ createdAt: 1 });

    console.log(`   找到 ${newUsers.length} 个已有 UID 的新用户\n`);

    // 步骤 3: 按月份分组老用户和新用户
    console.log('📊 步骤 3: 按月份分组用户...');
    const monthlyOldUsers = {};
    const monthlyNewUsers = {};

    // 分组老用户
    oldUsers.forEach(user => {
      const { yearMonth, month } = getChinaYearMonth(user.createdAt);
      if (!monthlyOldUsers[yearMonth]) {
        monthlyOldUsers[yearMonth] = { month, users: [] };
      }
      monthlyOldUsers[yearMonth].users.push(user);
    });

    // 分组新用户
    newUsers.forEach(user => {
      const { yearMonth, month } = getChinaYearMonth(user.createdAt);
      if (!monthlyNewUsers[yearMonth]) {
        monthlyNewUsers[yearMonth] = { month, users: [] };
      }
      monthlyNewUsers[yearMonth].users.push(user);
    });

    console.log(`   老用户分布在 ${Object.keys(monthlyOldUsers).length} 个月份`);
    console.log(`   新用户分布在 ${Object.keys(monthlyNewUsers).length} 个月份\n`);

    // 步骤 4: 处理每个月份的 UID 分配
    console.log('🔄 步骤 4: 开始处理 UID 分配...\n');
    const updates = [];
    let totalProcessed = 0;

    for (const yearMonth in monthlyOldUsers) {
      const { month, users: oldUsersInMonth } = monthlyOldUsers[yearMonth];
      const newUsersInMonth = monthlyNewUsers[yearMonth]?.users || [];

      console.log(`   处理 ${yearMonth} (${oldUsersInMonth.length} 个老用户, ${newUsersInMonth.length} 个新用户)`);

      // 为老用户分配 UID（从 1 开始）
      let sequence = 1;
      for (const user of oldUsersInMonth) {
        const uid = generateUid(month, sequence);
        updates.push({
          userId: user._id,
          username: user.username,
          uid,
          type: 'old'
        });
        sequence++;
        totalProcessed++;
      }

      // 如果有新用户，需要重新分配他们的 UID
      if (newUsersInMonth.length > 0) {
        console.log(`      ⚠️  需要重新分配 ${newUsersInMonth.length} 个新用户的 UID`);
        for (const user of newUsersInMonth) {
          const newUid = generateUid(month, sequence);
          updates.push({
            userId: user._id,
            username: user.username,
            oldUid: user.uid,
            uid: newUid,
            type: 'new'
          });
          sequence++;
        }
      }

      // 更新该月份的计数器
      updates.push({
        type: 'counter',
        yearMonth,
        count: sequence - 1
      });
    }

    console.log(`\n✅ 步骤 4 完成，准备更新 ${totalProcessed} 个老用户\n`);

    // 步骤 5: 执行数据库更新
    console.log('💾 步骤 5: 执行数据库更新...');
    let updatedCount = 0;
    let counterUpdatedCount = 0;

    for (const update of updates) {
      if (update.type === 'counter') {
        // 更新计数器
        await UidCounter.findOneAndUpdate(
          { yearMonth: update.yearMonth },
          { count: update.count },
          { upsert: true }
        );
        counterUpdatedCount++;
      } else {
        // 更新用户 UID
        await User.findByIdAndUpdate(update.userId, { uid: update.uid });
        updatedCount++;
        if (update.type === 'old') {
          console.log(`   ✓ ${update.username}: ${update.uid}`);
        } else {
          console.log(`   ⚠️  ${update.username}: ${update.oldUid} → ${update.uid}`);
        }
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ 步骤 5 完成`);
    console.log(`   更新了 ${updatedCount} 个用户的 UID`);
    console.log(`   更新了 ${counterUpdatedCount} 个月份计数器\n`);

    console.log('========== 迁移完成 ==========');
    console.log(`总耗时: ${duration} 秒`);
    console.log(`平均每个用户: ${(duration / updatedCount).toFixed(3)} 秒\n`);

  } catch (error) {
    console.error('\n❌ 迁移过程中发生错误:', error);
    throw error;
  }
};

// 执行迁移
const main = async () => {
  try {
    await connectDB();
    await migrateOldUsers();
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
};

main();
