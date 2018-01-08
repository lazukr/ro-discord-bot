const logger = require('../logger.js')("Event Module: Message");
module.exports = (discordBot, message) => {
  // ignore bots
  if (message.author.bot) return;
  // ignore all messages that does not begin
  // with the command prefix defined in the config
  if (message.content.indexOf(discordBot.config.commandPrefix) !== 0) return;
  const args = message.content.slice(discordBot.config.commandPrefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const cmd = discordBot.commands.get(command);
  if (!cmd) {
    logger.debug(`${cmd} was not loaded or not found.`);
    return;
  }
  logger.info(`${message.author.username}(${message.author.id}) ran command ${cmd.info.name} with arguments: ${args}`);
  cmd.run(discordBot, message, args)
    .catch(err => {
      console.log(err);
    });
};
