const OpenAI = require('openai');
const fs = require('fs').promises;

/**
 * 阿里云百炼语音识别服务
 */
class ASRService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });
  }

  /**
   * 将音频文件转换为 Base64 编码
   * @param {string} audioPath - 音频文件路径
   * @returns {Promise<string>} Base64 编码的音频数据
   */
  async audioToBase64(audioPath) {
    try {
      const audioBuffer = await fs.readFile(audioPath);
      return audioBuffer.toString('base64');
    } catch (error) {
      console.error('读取音频文件失败:', error);
      throw error;
    }
  }

  /**
   * 调用阿里云百炼进行语音识别
   * @param {string} audioPath - 音频文件路径
   * @returns {Promise<string>} 识别出的文本
   */
  async transcribe(audioPath) {
    try {
      console.log('开始语音识别，音频文件:', audioPath);

      // 将音频文件转换为 Base64
      const audioBase64 = await this.audioToBase64(audioPath);

      // 调用阿里云百炼 ASR API
      const completion = await this.client.chat.completions.create({
        model: 'qwen-audio-turbo',
        messages: [
          {
            role: 'system',
            content: [{ text: '你是一个语音识别助手，请将音频内容转换为文字。' }]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: {
                  data: audioBase64,
                  format: 'webm'
                }
              }
            ]
          }
        ],
        stream: false
      });

      const transcribedText = completion.choices[0].message.content;
      console.log('语音识别成功:', transcribedText);

      return transcribedText;
    } catch (error) {
      console.error('语音识别失败:', error);
      throw error;
    }
  }
}

module.exports = new ASRService();
