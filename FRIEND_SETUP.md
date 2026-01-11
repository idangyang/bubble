# 朋友端配置指南（远程访问）

## 当前后端公网地址

```
https://nodular-kara-unproduced.ngrok-free.dev
```

---

## 第一步：更新代码

```bash
cd video-danmaku-site
git pull origin main
```

---

## 第二步：配置前端

### 1. 进入前端目录
```bash
cd frontend
```

### 2. 创建 .env 文件

**方法一：使用命令创建（推荐）**

```bash
cat > .env << 'EOF'
REACT_APP_API_BASE_URL=https://nodular-kara-unproduced.ngrok-free.dev/api
REACT_APP_SERVER_BASE_URL=https://nodular-kara-unproduced.ngrok-free.dev
EOF
```

**方法二：手动创建**

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，内容如下：

```env
REACT_APP_API_BASE_URL=https://nodular-kara-unproduced.ngrok-free.dev/api
REACT_APP_SERVER_BASE_URL=https://nodular-kara-unproduced.ngrok-free.dev
```

---

## 第三步：验证配置

运行诊断脚本检查配置：

```bash
bash check-config.sh
```

应该看到所有检查都通过（✅）。

---

## 第四步：安装依赖并启动

```bash
# 安装依赖（首次运行或更新后需要）
npm install

# 启动前端
npm start
```

**重要：** 如果之前已经启动过，必须先停止（Ctrl+C），然后重新启动！

---

## 第五步：验证是否成功

1. 浏览器会自动打开 `http://localhost:3000`
2. 应该能看到视频列表（6个视频）
3. 如果看不到，按 F12 打开开发者工具检查

---

## 常见问题排查

### 问题1：看不到视频

**检查清单：**

1. ✅ 确认 .env 文件存在且配置正确
   ```bash
   cat .env
   ```

2. ✅ 确认已重启前端服务
   - 修改 .env 后必须重启才能生效

3. ✅ 检查浏览器开发者工具
   - 按 F12 打开
   - 查看 Console 标签是否有错误
   - 查看 Network 标签，找到 `videos` 请求
   - 确认请求地址是 `https://nodular-kara-unproduced.ngrok-free.dev/api/videos`

---

### 问题2：请求地址还是 localhost

**原因：** .env 文件未生效

**解决：**
1. 确认文件名是 `.env` 不是 `.env.txt`
2. 确认文件在 `frontend` 目录下
3. 重启前端服务

---

### 问题3：Network Error

**原因：** 无法连接到后端

**解决：**
1. 在浏览器直接访问：`https://nodular-kara-unproduced.ngrok-free.dev/api/videos`
2. 如果能看到 JSON 数据，说明后端正常
3. 如果无法访问，联系后端管理员（我）

---

## 需要帮助？

如果以上步骤都无法解决问题，请提供：

1. 运行 `bash check-config.sh` 的完整输出
2. 浏览器 Console 的截图（F12 → Console）
3. 浏览器 Network 的截图（F12 → Network）
4. `.env` 文件内容（运行 `cat .env`）

这样我可以更准确地帮你排查问题。
