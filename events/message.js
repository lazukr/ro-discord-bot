const logger = require('../logger.js')("message module");
module.exports = (discordBot, message) => {
  // ignore bots
  if (message.author.bot) return;
  // ignore all messages that does not begin
  // with the command prefix defined in the config
  if (message.content.indexOf(discordBot.config.commandPrefix) !== 0) return;

  const args = message.content.slice(discordBot.config.commandPrefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  logger.info(`${command}`);
  const cmd = discordBot.commands.get(command);

  if (!cmd) {
    logger.debug(`${cmd} was not loaded or not found.`);
    return;
  }

  logger.info(`message-module: ${message.author.username}(${message.author.id}) ran command ${cmd.info.name} with arguments: ${args}`);
  cmd.run(discordBot, message, args);
};
