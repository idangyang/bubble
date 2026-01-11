# 后端公网访问地址

## 你的后端已成功部署！

**公网访问地址：**
```
https://nodular-kara-unproduced.ngrok-free.dev
```

**API 基础地址（给你朋友用）：**
```
https://nodular-kara-unproduced.ngrok-free.dev/api
```

---

## 当前状态

✅ cpolar 已配置并运行
✅ 后端服务运行在端口 5002
✅ 公网隧道已建立

---

## 你朋友需要做的配置

### 1. 克隆项目
```bash
git clone <你的GitHub仓库地址>
cd video-danmaku-site/frontend
npm install
```

### 2. 创建 .env 文件
```bash
cp .env.example .env
```

### 3. 编辑 .env 文件
在 `.env` 文件中填入：
```env
REACT_APP_API_BASE_URL=https://nodular-kara-unproduced.ngrok-free.dev/api
```

### 4. 启动前端
```bash
npm start
```

---

## 重要提示

⚠️ **这个地址在以下情况会改变：**
- cpolar 进程重启
- 电脑重启
- 网络断开重连

如果地址改变了，需要：
1. 重新运行 `cpolar http 5002`
2. 获取新的地址
3. 通知你的朋友更新 `.env` 文件

---

## 如何查看当前地址

访问 cpolar 管理界面：
```
http://localhost:4040
```

或运行命令：
```bash
curl -s http://localhost:4040/api/tunnels | python3 -m json.tool
```

---

## 保持服务运行

**当前状态：**
- 后端服务：运行中（端口 5002）
- cpolar：运行中（后台进程）

**如果需要停止：**
```bash
# 停止 cpolar
pkill cpolar

# 停止后端
# 找到后端进程并停止
```

**如果需要重启：**
```bash
# 重启 cpolar
cpolar http 5002
```
