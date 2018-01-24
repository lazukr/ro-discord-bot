const logger = require('logger.js')('General module: dice');
exports.run = async (discordBot, message, args) => {
  const intArgs = args.filter(string => {
    return !isNaN(string) && parseInt(string) > 0;
  });
  if (!intArgs.length) {
    const msg = await message.channel.send("Invalid arguments. Please use \`!help\` to understand usage");
    return;
  }
  const numberOfDice = args[0] || 1;
  const maxDiceValue = args[1] || 6;
  const rolls = await Array.apply(null, {length: numberOfDice}).map(value => rollDice(maxDiceValue));
  logger.info(rolls);
  const msg = message.channel.send(`\`${rolls}\``);
};

exports.info = {
  name: "dice",
  category: "general",
  description: "roles n dices of m sides, default: n = 1, m = 6",
  usage: "\`<cmd_prefix>dice n m\`. n and m must be integers.",
};

function rollDice(max) {
  return Math.floor(Math.random() * max + 1);
}
