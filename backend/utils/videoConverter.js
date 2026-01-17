const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

/**
 * 检查视频格式是否需要转码
 * @param {string} filePath - 视频文件路径
 * @returns {boolean} - 是否需要转码
 */
function needsConversion(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  // 浏览器原生支持的格式
  const browserSupportedFormats = ['.mp4', '.webm', '.ogg'];
  return !browserSupportedFormats.includes(ext);
}

/**
 * 将视频转码为 MP4 格式
 * @param {string} inputPath - 输入视频路径
 * @param {string} outputPath - 输出视频路径
 * @returns {Promise} - 转码完成的 Promise
 */
function convertToMP4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // console.log(`开始转码: ${inputPath} -> ${outputPath}`);

    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .format('mp4')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-movflags +faststart'
      ])
      .on('start', (commandLine) => {
        // console.log('FFmpeg 命令:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          // console.log(`转码进度: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        // console.log('转码完成:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('转码失败:', err.message);
        reject(err);
      })
      .run();
  });
}

module.exports = {
  needsConversion,
  convertToMP4
};
