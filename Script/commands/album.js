module.exports.config = {
  name: "album",
  version: "1.0.0",
  hasPermission: 0,
  credits: "MR JUWEL",
  description: "Send a trending TikTok video",
  commandCategory: "video",
  usages: "",
  cooldowns: 3,
};

module.exports.run = async function({
  event: e,
  api: a,
  args: n
}) {
  if (!n[0]) {
    return a.sendMessage(
      "╭───•𝗠𝗥 𝗝𝗨𝗪𝗘𝗟•───╮\n\n━━💛𝚅𝙸𝙳𝙴𝙾🎀𝙰𝙻𝙱𝚄𝙼💛━━ \n!\n!➤1 𝙸𝚂𝙻𝙰𝙼 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤2 𝙰𝙽𝙸𝙼𝙴 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤3 𝚂𝙷𝙰𝙸𝚁𝙸 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤4 𝚂𝙷𝙾𝚁𝚃 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤5 𝚂𝙰𝙳𝚅𝙸𝙳𝙾◄┈╯\n!\n!➤6 𝚂𝚃𝙰𝚃𝚄𝚂 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤7 𝙵𝙾𝙾𝚃𝙱𝙰𝙻𝙻 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤8 𝙵𝚄𝙽𝙽𝚈 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤9 𝙻𝙾𝚅𝙴 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤10 𝙲𝙿𝙻 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤11 𝙱𝙰𝙱𝚈 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤12 𝙵𝚁𝙴𝙴 𝙵𝙸𝚁𝙴 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤13 𝙻𝙾𝙵𝙸 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤14 𝙷𝙰𝙿𝙿𝚈 𝚅𝙸𝙳𝙴𝙾◄┈╯\n!\n!➤15 𝙷𝚄𝙼𝙰𝙸𝚈𝚄𝙽 𝚂𝙸𝚁 𝚅𝙸𝙳𝙴𝙾◄┈╯\n━━━━━━━━━━━━━━\n𝙾𝚆𝙽𝙴𝚁: 𝙼𝚁 𝙹𝚄𝚆𝙴𝙻 𝙵𝚋 facebook.com/mrjuwel999\n━━━━━━━━━━━━━━━━━\n𝙰 𝙿 𝙸//𝙹𝚄𝚆𝙴𝙻\n╰──𝙼𝚁 𝙹𝚄𝚆𝙴𝙻 𝙿𝚁𝙾𝙹𝙴𝙲𝚃──╯\n\nReply with video number (1-15)", 
      e.threadID, 
      (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: e.senderID,
          type: "create"
        });
      }, 
      e.messageID
    );
  }
};

module.exports.handleReply = async ({
  api: e,
  event: a,
  client: n,
  handleReply: t
}) => {
  const axios = require("axios");
  const fs = require("fs");
  const path = require("path");
  
  if ("create" === t.type) {
    try {
      // Send loading message
      const waitMsg = await e.sendMessage("⏳ Loading video... Please wait", a.threadID);
      
      // Get video URL
      const videoUrl = await getVideoUrl(a.body);
      if (!videoUrl) {
        await e.sendMessage("❌ Invalid choice! Please send number 1-15", a.threadID);
        return e.unsend(waitMsg.messageID);
      }
      
      // Get video info
      const videoInfo = await getVideoInfo(videoUrl);
      if (!videoInfo) {
        await e.sendMessage("❌ No video found! Try again.", a.threadID);
        return e.unsend(waitMsg.messageID);
      }
      
      // Download video with timeout
      const videoPath = await downloadVideo(videoInfo.url);
      if (!videoPath) {
        await e.sendMessage("❌ Download failed! Try again.", a.threadID);
        return e.unsend(waitMsg.messageID);
      }
      
      // Delete loading message
      await e.unsend(waitMsg.messageID);
      
      // Send video
      await e.sendMessage({
        body: `🎬 ${videoInfo.title}\n📊 Total: ${videoInfo.count}\n⚡ Fast Delivery by MR JUWEL`,
        attachment: fs.createReadStream(videoPath)
      }, a.threadID, a.messageID);
      
      // Delete temp file
      fs.unlink(videoPath, (err) => {
        if (err) console.error("Delete error:", err);
      });
      
    } catch (error) {
      console.error("Error:", error);
      return e.sendMessage("❌ Error occurred! Try again.", a.threadID, a.messageID);
    }
  }
};

async function getVideoUrl(choice) {
  const axios = require("axios");
  try {
    const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json', {
      timeout: 5000
    });
    const baseUrl = apis.data.api;
    
    const options = {
      "1": "/video/islam",
      "2": "/video/anime",
      "3": "/video/shairi",
      "4": "/video/short",
      "5": "/video/sad",
      "6": "/video/status",
      "7": "/video/football",
      "8": "/video/funny",
      "9": "/video/love",
      "10": "/video/cpl",
      "11": "/video/baby",
      "12": "/video/kosto",
      "13": "/video/lofi",
      "14": "/video/happy",
      "15": "/video/humaiyun",
    };
    
    return `${baseUrl}${options[choice.trim()] || ""}`;
  } catch (error) {
    console.error("Get URL error:", error);
    return null;
  }
}

async function getVideoInfo(url) {
  const axios = require("axios");
  try {
    const response = await axios.get(url, {
      timeout: 10000
    });
    const data = response.data;
    
    if (!data || !data.data) return null;
    
    return {
      url: data.data,
      title: data.shaon || "🎬 Video",
      count: data.count || "N/A"
    };
  } catch (error) {
    console.error("Get info error:", error);
    return null;
  }
}

async function downloadVideo(url) {
  const axios = require("axios");
  const fs = require("fs");
  const path = require("path");
  
  try {
    const videoPath = path.join(__dirname, 'cache', `video_${Date.now()}.mp4`);
    
    // Create cache directory if not exists
    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
      fs.mkdirSync(path.join(__dirname, 'cache'));
    }
    
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 15000,
      maxRedirects: 5
    });
    
    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(videoPath));
      writer.on('error', reject);
      setTimeout(() => reject(new Error('Download timeout')), 20000);
    });
    
  } catch (error) {
    console.error("Download error:", error);
    return null;
  }
      }
