const fs = require("fs-extra");
const request = require("request");

module.exports.config = {
    name: "ckuser",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
    description: "Check user information",
    commandCategory: "Media",
    usages: "[reply | @tag | uid]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    let id;
    
    // ✅ যদি শুধু কমান্ড ব্যবহার করে (কোনো uid/tag না থাকে)
    if (!args[0]) {
        if (event.type == "message_reply") id = event.messageReply.senderID;
        else id = event.senderID;
    } 
    // ✅ যদি mention করে
    else if (Object.keys(event.mentions).length > 0) {
        id = Object.keys(event.mentions)[0];
    } 
    // ✅ যদি সরাসরি uid দেওয়া হয়
    else {
        id = args[0];
    }

    try {
        let data = await api.getUserInfo(id);
        let user = data[id];

        let url = user.profileUrl;
        let isFriend = user.isFriend ? "Yes ✅" : "No ❌";
        let sn = user.vanity || "N/A";
        let name = user.name || "Unknown";
        let sex = user.gender;
        let gender = sex == 2 ? "Male" : sex == 1 ? "Female" : "Unknown";

        let callback = () => api.sendMessage(
            {
                body: `👤 Name: ${name}\n🔗 Profile: ${url}\n🆔 UID: ${id}\n📛 Username: ${sn}\n🚻 Gender: ${gender}\n🤝 Friend with bot: ${isFriend}`,
                attachment: fs.createReadStream(__dirname + "/cache/ckuser.png")
            },
            event.threadID,
            () => fs.unlinkSync(__dirname + "/cache/ckuser.png"),
            event.messageID
        );

        return request(
            encodeURI(`https://graph.facebook.com/${id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
        ).pipe(fs.createWriteStream(__dirname + "/cache/ckuser.png")).on("close", () => callback());

    } catch (e) {
        return api.sendMessage("⚠️ User info আনতে সমস্যা হচ্ছে!", event.threadID, event.messageID);
    }
};
