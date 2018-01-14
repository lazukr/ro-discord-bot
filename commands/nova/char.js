const novaCharLink = 'https://www.novaragnarok.com/ROChargenPHP/character/';
const logger = require('../../logger.js')("Nova Command module: char");
const ACTION_MAX = 25;
const ROTATE_MAX = 7;
const INVALID = -1;

exports.run = async (discordBot, message, args) => {
  logger.info(args);
  if (args.length === 0) {
    message.channel.send("Need to specify a name.");
    return;
  }
  
  const lastArg = args.length > 1 ? args[args.length - 1] : "";
  const actionRotate = checkActionRotateValues(lastArg);
  const actionVal = actionRotate.action > INVALID ? actionRotate.action : getRandInt(0, ACTION_MAX);
  const rotateVal = actionRotate.rotate > INVALID ? actionRotate.rotate : getRandInt(0, ROTATE_MAX);
  
  if (actionRotate.action > INVALID || actionRotate.rotate > INVALID) {
    args.pop();
  }
  const charaName = args.join('_');
  const timestamp = Date.now();
  const msg = await message.channel.send(`${novaCharLink}${charaName}/${actionVal}/${rotateVal}?${timestamp}`);
};

exports.info = {
  name: "char",
  category: "Nova",
  description: "displays a character for Nova RO characters. #/# indicates the action and rotation of the character respectively. Actions seems to go from 0 - 25, rotation goes from 0 - 7.",
  usage: "<cmd_prefix>char #/#",
};

function getRandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function inBetween(value, min, max) {
  return (value >= min && value <= max);
}

function checkActionRotateValues(string) {
  const actionRotate = string.split('/');
  let action = -1;
  let rotate = -1;
  if (actionRotate.length > 1) {
    action = !isNaN(actionRotate[0]) && inBetween(actionRotate[0], 0, ACTION_MAX) ? actionRotate[0] : action;
    rotate = !isNaN(actionRotate[1]) && inBetween(actionRotate[1], 0, ROTATE_MAX) ? actionRotate[1] : rotate;
  }
  logger.debug(`action: ${action}, rotate: ${rotate}`);
  return {
    action: action,
    rotate: rotate,
  }
}
