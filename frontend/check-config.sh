#!/bin/bash

# 前端配置诊断脚本
# 用于检查远程访问配置是否正确

echo "================================"
echo "前端配置诊断脚本"
echo "================================"
echo ""

# 检查当前目录
echo "1. 检查当前目录..."
if [ ! -f "package.json" ]; then
    echo "❌ 错误：当前不在 frontend 目录"
    echo "请先运行：cd video-danmaku-site/frontend"
    exit 1
fi
echo "✅ 当前在 frontend 目录"
echo ""

# 检查 .env 文件是否存在
echo "2. 检查 .env 文件..."
if [ ! -f ".env" ]; then
    echo "❌ 错误：.env 文件不存在"
    echo ""
    echo "解决方案："
    echo "cp .env.example .env"
    echo "然后编辑 .env 文件，填入正确的后端地址"
    exit 1
fi
echo "✅ .env 文件存在"
echo ""

# 显示 .env 文件内容
echo "3. .env 文件内容："
echo "-------------------"
cat .env
echo "-------------------"
echo ""
# 检查 API 地址配置
echo "4. 检查 API 地址配置..."
API_URL=$(grep REACT_APP_API_BASE_URL .env | cut -d '=' -f2)
SERVER_URL=$(grep REACT_APP_SERVER_BASE_URL .env | cut -d '=' -f2)

if [ -z "$API_URL" ]; then
    echo "❌ 错误：REACT_APP_API_BASE_URL 未配置"
    exit 1
fi

if [ -z "$SERVER_URL" ]; then
    echo "❌ 错误：REACT_APP_SERVER_BASE_URL 未配置"
    exit 1
fi

echo "✅ API_BASE_URL: $API_URL"
echo "✅ SERVER_BASE_URL: $SERVER_URL"
echo ""

# 检查地址格式
if [[ $API_URL == *"localhost"* ]]; then
    echo "⚠️  警告：API 地址使用的是 localhost"
    echo "   远程访问应该使用公网地址（如 cpolar/ngrok 地址）"
    echo ""
fi

# 测试后端连接
echo "5. 测试后端 API 连接..."
echo "正在测试: $API_URL/videos"

# 提取基础 URL（去掉 /api 后缀）
BASE_URL=$(echo $API_URL | sed 's|/api$||')

# 测试连接
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/videos" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 后端连接成功 (HTTP $HTTP_CODE)"
    
    # 获取视频数量
    VIDEO_COUNT=$(curl -s "$API_URL/videos" 2>/dev/null | grep -o '"videos":\[' | wc -l)
    if [ "$VIDEO_COUNT" -gt 0 ]; then
        echo "✅ 成功获取视频数据"
    fi
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ 无法连接到后端服务器"
    echo "   可能原因："
    echo "   1. 后端服务未运行"
    echo "   2. cpolar/ngrok 未运行"
    echo "   3. 网络连接问题"
else
    echo "❌ 后端返回错误 (HTTP $HTTP_CODE)"
fi
echo ""

# 总结
echo "================================"
echo "诊断总结"
echo "================================"
echo ""
echo "如果所有检查都通过，但仍然看不到视频："
echo ""
echo "1. 确保已经重启前端服务（修改 .env 后必须重启）"
echo "   - 按 Ctrl+C 停止当前服务"
echo "   - 运行 npm start 重新启动"
echo ""
echo "2. 清除浏览器缓存或使用无痕模式"
echo ""
echo "3. 打开浏览器开发者工具（F12）检查："
echo "   - Console 标签：查看是否有错误"
echo "   - Network 标签：查看请求是否发送到正确的地址"
echo ""
echo "4. 如果问题仍然存在，请提供："
echo "   - 浏览器 Console 的截图"
echo "   - 浏览器 Network 的截图"
echo ""
