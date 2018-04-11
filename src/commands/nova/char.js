const novaCharLink = 'https://www.novaragnarok.com/ROChargenPHP/character/';
const logger = require('logger.js')("Nova Command module: char");
const getCharaLink = require('ro-chargen-php-link.js');
const ACTION_MAX = 25;
const ROTATE_MAX = 7;
const INVALID = -1;

exports.run = async (discordBot, message, args) => {
  logger.info(args);
  getCharaLink(message, args, [ACTION_MAX, ROTATE_MAX], novaCharLink); 
};

exports.info = {
  name: "char",
  category: "Nova",
  description: "displays a character for Nova RO characters. #/# indicates the action and rotation of the character respectively. Actions seems to go from 0 - 25, rotation goes from 0 - 7.",
  usage: "@char #/#",
};
