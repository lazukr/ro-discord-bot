const novaSigLink = 'https://www.novaragnarok.com/ROChargenPHP/newsig/'; 
const logger = require('logger.js')("Nova Command module: sig");
const getCharaLink = require('ro-chargen-php-link.js');
const POSE_MAX = 12;
const BG_MAX = 14;
const INVALID = -1;

exports.run = async (discordBot, message, args) => {
  logger.info(args);
  getCharaLink(message, args, [BG_MAX, POSE_MAX], novaSigLink);
};

exports.info = {
  name: "sig",
  category: "Nova",
  description: "creates a signature for Nova RO characters. #/# indicates the background and pose respectively. Background goes from 0 - 10, pose goes from 0 - 12.",
  usage: "@sig #/#",
};
