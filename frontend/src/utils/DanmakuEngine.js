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

  add(text, color = '#FFFFFF', type = 'scroll') {
    // 测量文本宽度
    this.ctx.font = `${this.fontSize}px Arial`;
    const textWidth = this.ctx.measureText(text).width;

    // 找到可用的轨道
    const trackIndex = this.findAvailableTrack(textWidth);

    const danmaku = {
      text,
      color,
      type,
      x: this.canvas.width,
      y: trackIndex * this.trackHeight + this.trackHeight / 2 + this.fontSize / 2,
      speed: this.speed,
      fontSize: this.fontSize,
      opacity: 1,
      textWidth,
      trackIndex
    };

    this.danmakus.push(danmaku);

    // 更新轨道信息
    this.tracks[trackIndex].lastDanmakuTime = Date.now();
    this.tracks[trackIndex].lastDanmakuX = this.canvas.width;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.danmakus = this.danmakus.filter(danmaku => {
      // 只有在非暂停状态下才移动弹幕
      if (!this.paused) {
        danmaku.x -= danmaku.speed;

        // 更新轨道信息
        if (this.tracks[danmaku.trackIndex]) {
          this.tracks[danmaku.trackIndex].lastDanmakuX = danmaku.x;
        }
      }

      // 绘制弹幕
      this.ctx.font = `bold ${danmaku.fontSize}px Arial`;
      this.ctx.fillStyle = danmaku.color;
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 3;
      this.ctx.globalAlpha = danmaku.opacity;

      // 描边（黑色边框）
      this.ctx.strokeText(danmaku.text, danmaku.x, danmaku.y);
      // 填充文字
      this.ctx.fillText(danmaku.text, danmaku.x, danmaku.y);

      // 当弹幕完全移出屏幕左侧时移除
      return danmaku.x + danmaku.textWidth > 0;
    });

    if (this.running) {
      requestAnimationFrame(() => this.render());
    }
  }

  start() {
    this.running = true;
    this.render();
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
}

export default DanmakuEngine;
