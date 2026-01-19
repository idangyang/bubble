import { getResourceUrl } from '../config';

class DanmakuEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.danmakus = [];
    this.running = false;
    this.paused = false;
    this.tracks = []; // 弹幕轨道
    this.trackHeight = 30; // 每条轨道的高度
    this.fontSize = 24;
    this.speed = 3; // 弹幕速度

    // 悬停相关状态
    this.hoveredDanmaku = null; // 当前悬停的弹幕
    this.actionPanel = null; // 操作面板 DOM 元素
    this.onLikeCallback = null; // 点赞回调
    this.onReportCallback = null; // 举报回调
    this.isPanelHovered = false; // 操作面板是否被悬停
    this.hideTimer = null; // 延迟隐藏定时器

    // 创建按钮容器
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = 'voice-danmaku-buttons';
    this.buttonContainer.style.position = 'absolute';
    this.buttonContainer.style.top = '0';
    this.buttonContainer.style.left = '0';
    this.buttonContainer.style.width = '100%';
    this.buttonContainer.style.height = '100%';
    this.buttonContainer.style.pointerEvents = 'none';
    this.buttonContainer.style.zIndex = '10';
    this.canvas.parentElement.appendChild(this.buttonContainer);

    // 启用 Canvas 鼠标事件
    this.canvas.style.pointerEvents = 'auto';
    this.setupMouseEvents();
  }

  init() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    // 计算可以容纳多少条轨道
    const trackCount = Math.floor(this.canvas.height / this.trackHeight);
    this.tracks = new Array(trackCount).fill(null).map(() => ({
      lastDanmakuTime: 0,
      lastDanmakuX: this.canvas.width
    }));
  }

  // 设置鼠标事件监听
  setupMouseEvents() {
    // 添加延迟隐藏的定时器
    this.hideTimer = null;

    this.canvas.addEventListener('mousemove', (e) => {
      // 清除隐藏定时器
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }

      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 检测鼠标是否悬停在某个弹幕上
      const hoveredDanmaku = this.getDanmakuAtPosition(mouseX, mouseY);

      if (hoveredDanmaku !== this.hoveredDanmaku) {
        // 悬停状态改变
        if (this.hoveredDanmaku) {
          // 恢复之前悬停的弹幕
          this.hoveredDanmaku.isPaused = false;
          this.hideActionPanel();
        }

        this.hoveredDanmaku = hoveredDanmaku;

        if (this.hoveredDanmaku) {
          // 暂停当前悬停的弹幕
          this.hoveredDanmaku.isPaused = true;
          this.showActionPanel(this.hoveredDanmaku);
          this.canvas.style.cursor = 'pointer';
        } else {
          this.canvas.style.cursor = 'default';
        }
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      // 延迟隐藏，给用户时间移动到操作面板
      this.hideTimer = setTimeout(() => {
        if (this.hoveredDanmaku && !this.isPanelHovered) {
          this.hoveredDanmaku.isPaused = false;
          this.hoveredDanmaku = null;
          this.hideActionPanel();
          this.canvas.style.cursor = 'default';
        }
      }, 500);
    });
  }

  // 检测指定位置是否有弹幕
  getDanmakuAtPosition(x, y) {
    // 从后往前遍历（后面的弹幕在上层）
    for (let i = this.danmakus.length - 1; i >= 0; i--) {
      const danmaku = this.danmakus[i];

      // 计算弹幕的边界框
      const textHeight = danmaku.fontSize;
      const textTop = danmaku.y - textHeight;
      const textBottom = danmaku.y + textHeight / 4;
      const textLeft = danmaku.x;
      const textRight = danmaku.x + danmaku.textWidth;

      // 检测鼠标是否在边界框内
      if (x >= textLeft && x <= textRight && y >= textTop && y <= textBottom) {
        return danmaku;
      }
    }
    return null;
  }

  // 找到一个可用的轨道
  findAvailableTrack(textWidth) {
    const now = Date.now();

    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      // 检查这条轨道是否有足够的空间
      // 如果上一条弹幕已经移动了足够远，或者时间间隔足够长
      const timeSinceLastDanmaku = now - track.lastDanmakuTime;
      const minDistance = textWidth + 50; // 最小间距

      if (track.lastDanmakuX < this.canvas.width - minDistance || timeSinceLastDanmaku > 3000) {
        return i;
      }
    }

    // 如果所有轨道都满了，返回第一条轨道（会重叠）
    return 0;
  }

  // 显示操作面板
  showActionPanel(danmaku) {
    if (!danmaku.id) return; // 没有 ID 的弹幕不显示操作面板

    // 创建操作面板
    if (!this.actionPanel) {
      this.actionPanel = document.createElement('div');
      this.actionPanel.className = 'danmaku-action-panel';
      this.actionPanel.style.position = 'absolute';
      this.actionPanel.style.pointerEvents = 'auto';
      this.actionPanel.style.zIndex = '100';
      this.buttonContainer.appendChild(this.actionPanel);

      // 添加操作面板的鼠标事件监听
      this.actionPanel.addEventListener('mouseenter', () => {
        this.isPanelHovered = true;
        // 清除隐藏定时器
        if (this.hideTimer) {
          clearTimeout(this.hideTimer);
          this.hideTimer = null;
        }
      });

      this.actionPanel.addEventListener('mouseleave', () => {
        this.isPanelHovered = false;
        // 鼠标离开操作面板时，隐藏面板并恢复弹幕
        if (this.hoveredDanmaku) {
          this.hoveredDanmaku.isPaused = false;
          this.hoveredDanmaku = null;
          this.hideActionPanel();
          this.canvas.style.cursor = 'default';
        }
      });
    }

    // 计算面板位置（弹幕下方）
    const panelX = danmaku.x;
    const panelY = danmaku.y + 10;

    this.actionPanel.style.left = `${panelX}px`;
    this.actionPanel.style.top = `${panelY}px`;
    this.actionPanel.style.display = 'flex';

    // 清空并重新创建按钮
    this.actionPanel.innerHTML = '';

    // 点赞按钮
    const likeBtn = this.createActionButton(
      'like',
      `${danmaku.likes || 0}`,
      () => {
        if (this.onLikeCallback) {
          this.onLikeCallback(danmaku.id);
        }
      }
    );

    // 复制按钮
    const copyBtn = this.createActionButton(
      'copy',
      '',
      () => {
        navigator.clipboard.writeText(danmaku.text).then(() => {
          // 显示复制成功提示
          this.showToast('已复制到剪贴板');
        }).catch(err => {
          console.error('复制失败:', err);
        });
      }
    );

    // 举报按钮
    const reportBtn = this.createActionButton(
      'report',
      '',
      () => {
        if (this.onReportCallback) {
          this.onReportCallback(danmaku.id);
        }
      }
    );

    this.actionPanel.appendChild(likeBtn);
    this.actionPanel.appendChild(copyBtn);
    this.actionPanel.appendChild(reportBtn);
  }

  // 隐藏操作面板
  hideActionPanel() {
    if (this.actionPanel) {
      this.actionPanel.style.display = 'none';
    }
  }

  // 创建操作按钮
  createActionButton(type, text, onClick) {
    const button = document.createElement('button');
    button.className = `danmaku-action-btn danmaku-action-btn-${type}`;

    // 创建图标
    const icon = document.createElement('span');
    icon.className = 'danmaku-action-icon';

    // 根据类型设置图标
    if (type === 'like') {
      icon.innerHTML = '👍';
    } else if (type === 'copy') {
      icon.innerHTML = '📋';
    } else if (type === 'report') {
      icon.innerHTML = '⚠️';
    }

    button.appendChild(icon);

    // 如果有文本（如点赞数），添加文本
    if (text) {
      const textSpan = document.createElement('span');
      textSpan.className = 'danmaku-action-text';
      textSpan.textContent = text;
      button.appendChild(textSpan);
    }

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });

    return button;
  }

  // 显示提示消息
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'danmaku-toast';
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.top = '50%';
    toast.style.left = '50%';
    toast.style.transform = 'translate(-50%, -50%)';
    toast.style.zIndex = '1000';

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }

  // 设置回调函数
  setCallbacks(onLike, onReport) {
    this.onLikeCallback = onLike;
    this.onReportCallback = onReport;
  }

  add(text, color = '#FFFFFF', type = 'scroll', isVoice = false, audioUrl = null, likes = 0, id = null) {
    // 根据点赞数计算字号：每10个赞增加1个字号
    const calculatedFontSize = this.fontSize + Math.floor(likes / 10);

    // 测量文本宽度（语音弹幕需要额外空间显示播放按钮）
    this.ctx.font = `${calculatedFontSize}px Arial`;
    const textWidth = this.ctx.measureText(text).width;
    const totalWidth = isVoice ? textWidth + 40 : textWidth;

    // 找到可用的轨道
    const trackIndex = this.findAvailableTrack(totalWidth);

    const danmaku = {
      id,
      text,
      color,
      type,
      x: this.canvas.width,
      y: trackIndex * this.trackHeight + this.trackHeight / 2 + calculatedFontSize / 2,
      speed: this.speed,
      fontSize: calculatedFontSize,
      opacity: 1,
      textWidth: totalWidth,
      trackIndex,
      isVoice,
      audioUrl,
      audio: null,
      button: null,
      isPlaying: false,
      likes,
      isPaused: false // 悬停暂停状态
    };

    // 如果是语音弹幕，创建音频和按钮
    if (isVoice && audioUrl) {
      danmaku.audio = new Audio(getResourceUrl(audioUrl));
      danmaku.button = this.createVoiceButton(danmaku);
    }

    this.danmakus.push(danmaku);

    // 更新轨道信息
    this.tracks[trackIndex].lastDanmakuTime = Date.now();
    this.tracks[trackIndex].lastDanmakuX = this.canvas.width;
  }

  createVoiceButton(danmaku) {
    const button = document.createElement('button');
    button.className = 'voice-play-button';
    button.style.position = 'absolute';
    button.style.width = '24px';
    button.style.height = '24px';
    button.style.borderRadius = '50%';
    button.style.background = '#FF4444';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.pointerEvents = 'auto';
    button.style.transition = 'transform 0.2s';
    button.style.zIndex = '20';
    button.style.padding = '0';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';

    // 创建播放图标（三角形）
    const icon = document.createElement('div');
    icon.className = 'play-icon';
    icon.style.width = '0';
    icon.style.height = '0';
    icon.style.borderLeft = '8px solid white';
    icon.style.borderTop = '5px solid transparent';
    icon.style.borderBottom = '5px solid transparent';
    icon.style.marginLeft = '2px';
    button.appendChild(icon);

    // 鼠标悬停效果
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });

    // 点击播放/暂停
    button.addEventListener('click', (e) => {
      e.stopPropagation();

      if (danmaku.isPlaying) {
        // 暂停
        danmaku.audio.pause();
        danmaku.isPlaying = false;
        // 变回三角形
        icon.style.width = '0';
        icon.style.height = '0';
        icon.style.borderLeft = '8px solid white';
        icon.style.borderTop = '5px solid transparent';
        icon.style.borderBottom = '5px solid transparent';
        icon.style.marginLeft = '2px';
        icon.style.borderRadius = '0';
      } else {
        // 播放
        danmaku.audio.play().catch(err => {
          console.error('播放音频失败:', err);
        });
        danmaku.isPlaying = true;
        // 变成正方形
        icon.style.width = '8px';
        icon.style.height = '8px';
        icon.style.borderLeft = 'none';
        icon.style.borderTop = 'none';
        icon.style.borderBottom = 'none';
        icon.style.background = 'white';
        icon.style.marginLeft = '0';
        icon.style.borderRadius = '1px';
      }
    });

    // 音频播放结束时重置状态
    danmaku.audio.addEventListener('ended', () => {
      danmaku.isPlaying = false;
      icon.style.width = '0';
      icon.style.height = '0';
      icon.style.borderLeft = '8px solid white';
      icon.style.borderTop = '5px solid transparent';
      icon.style.borderBottom = '5px solid transparent';
      icon.style.marginLeft = '2px';
      icon.style.background = 'transparent';
      icon.style.borderRadius = '0';
    });

    this.buttonContainer.appendChild(button);
    return button;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.danmakus = this.danmakus.filter(danmaku => {
      // 只有在非暂停状态且弹幕未被悬停时才移动弹幕
      if (!this.paused && !danmaku.isPaused) {
        danmaku.x -= danmaku.speed;

        // 更新轨道信息
        if (this.tracks[danmaku.trackIndex]) {
          this.tracks[danmaku.trackIndex].lastDanmakuX = danmaku.x;
        }
      }

      // 更新语音弹幕按钮位置
      if (danmaku.isVoice && danmaku.button) {
        const buttonX = danmaku.x;
        const buttonY = danmaku.y - this.fontSize / 2;
        danmaku.button.style.left = `${buttonX}px`;
        danmaku.button.style.top = `${buttonY}px`;
      }

      // 绘制弹幕
      if (danmaku.isVoice) {
        this.drawVoiceDanmaku(danmaku);
      } else {
        this.drawTextDanmaku(danmaku);
      }

      // 当弹幕完全移出屏幕左侧时移除
      const shouldKeep = danmaku.x + danmaku.textWidth > 0;

      // 如果弹幕要被移除，清理按钮
      if (!shouldKeep && danmaku.isVoice && danmaku.button) {
        this.buttonContainer.removeChild(danmaku.button);
        danmaku.button = null;
        if (danmaku.audio) {
          danmaku.audio.pause();
          danmaku.audio = null;
        }
      }

      return shouldKeep;
    });

    if (this.running) {
      requestAnimationFrame(() => this.render());
    }
  }

  start() {
    this.running = true;
    this.render();
  }

  // 绘制普通文本弹幕
  drawTextDanmaku(danmaku) {
    this.ctx.font = `bold ${danmaku.fontSize}px Arial`;
    this.ctx.fillStyle = danmaku.color;
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = danmaku.opacity;

    // 描边（黑色边框）
    this.ctx.strokeText(danmaku.text, danmaku.x, danmaku.y);
    // 填充文字
    this.ctx.fillText(danmaku.text, danmaku.x, danmaku.y);
  }

  // 绘制语音弹幕（只绘制文本，按钮由 DOM 元素处理）
  drawVoiceDanmaku(danmaku) {
    const buttonSize = 24;
    const padding = 8;
    const textX = danmaku.x + buttonSize + padding;

    // 绘制文本
    this.ctx.globalAlpha = danmaku.opacity;
    this.ctx.font = `bold ${danmaku.fontSize}px Arial`;
    this.ctx.fillStyle = danmaku.color;
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'alphabetic';

    this.ctx.strokeText(danmaku.text, textX, danmaku.y);
    this.ctx.fillText(danmaku.text, textX, danmaku.y);
  }

  stop() {
    this.running = false;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  clear() {
    this.danmakus = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // 重置轨道
    this.tracks = this.tracks.map(() => ({
      lastDanmakuTime: 0,
      lastDanmakuX: this.canvas.width
    }));
  }

  updateDanmakuLikes(danmakuId, newLikes) {
    this.danmakus.forEach(danmaku => {
      if (danmaku.id === danmakuId) {
        danmaku.likes = newLikes;
        // 重新计算字号
        const newFontSize = this.fontSize + Math.floor(newLikes / 10);
        danmaku.fontSize = newFontSize;
      }
    });
  }

}

export default DanmakuEngine;
