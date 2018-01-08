const novaSigLink = 'https://www.novaragnarok.com/ROChargenPHP/newsig/' 
const logger = require('../../logger.js')("Nova Command module: sig");
const POSE_MAX = 12;
const BG_MAX = 10;
exports.run = async (discordBot, message, args) => {
  logger.info(args);
  if (!args) {
    message.channel.send("Need to specify a name.");
    return;
  }
  const lastArg = args.length > 1 ? args[args.length - 1] : ""; // only get last argument if greater than 1, else empty string
  const bgPose = checkBGPoseValues(lastArg);
  const bgVal = bgPose.bg > 0 ? bgPose.bg : getRandInt(0, BG_MAX); // check if valid bg, else random
  const poseVal = bgPose.pose > 0 ? bgPose.pose : getRandInt(0, POSE_MAX); // check if valid pose, else random
  if (bgPose.bg > 0 || bgPose.pose > 0) { // if either bg or pose is valid, ignore last arg for character name
    args.pop();
  }
  const charaName = args.join('_');
  const timestamp = Date.now(); // used to force cache every time it is called, prevents previous cached version from being used
  const msg = await message.channel.send(`${novaSigLink}${charaName}/${bgVal}/${poseVal}?${timestamp}`);
};

exports.info = {
  name: "sig",
  category: "Nova",
  description: "creates a signature for Nova RO characters. #/# indicates the background and pose respectively. Background goes from 0 - 10, pose goes from 0 - 12.",
  usage: "<cmd_prefix>sig #/#",
};

function getRandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function inBetween(value, min, max) {
  return (value >= min && value <= max);
}

function checkBGPoseValues(string) {
  const bgPose = string.split('/');
  let bg = -1;
  let pose = -1; 
  if (bgPose.length > 1) { // has a / in string
    bg = !isNaN(bgPose[0]) && inBetween(bgPose[0], 0, BG_MAX) ? bgPose[0] : bg;       // check if is integer and in bound
    pose = !isNaN(bgPose[1]) && inBetween(bgPose[1], 0, POSE_MAX) ? bgPose[1] : pose; // same as above
  }
  return {
    bg: bg,
    pose: pose
  }
}
