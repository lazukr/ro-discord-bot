const logger = require('../../logger.js')("Command module: ping");
exports.run = async (discordBot, message, args) => {
  const msg = await message.channel.send(`${discordBot.config.commandPrefix}ping`);
  msg.edit(`Pong! Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(discordBot.client.ping)}ms.`);
};

exports.info = {
  name: "ping",
  category: "general",
  description: "pings message and API",
  usage: "<cmd_prefix>ping",
};
