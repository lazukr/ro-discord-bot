const logger = require('logger.js')("Event Module: Message");
module.exports = (discordBot, message) => {
  // ignore bots
  if (message.author.bot) return;
  // ignore all messages that does not begin
  // with the command prefix defined in the config
  if (message.content.indexOf(discordBot.config.commandPrefix) !== 0) return;
  const args = message.content.slice(discordBot.config.commandPrefix.length).trim().split(/ +/g);
  const commandKey = args.shift().toLowerCase();
  const command = discordBot.commandList.get(commandKey) || discordBot.commandAliasList.get(commandKey);
  if (!command) {
    logger.debug(`${commandKey} was not loaded or not found.`);
    message.channel.send(`${commandKey} was not loaded or not found. Please use \`${discordBot.config.commandPrefix}command\` to see a list of the commands`);
    return;
  }
  logger.info(`${message.author.username}(${message.author.id}) ran command ${command.cmd.info.name} with arguments: ${args}`);
  command.cmd.run(discordBot, message, args)
    .catch(err => {
      logger.error(err);
    });
};
