import Logger from '../utils/logger';
import chalk from 'chalk'; 

export default class Message {
  constructor(bot) {
    this.bot = bot;
  }

  async run (message) {

    // avoid responding to bots
    if (message.author.bot) {
      return;
    }

    // avoid any message that does not start with the designated prefix
    if (message.content.indexOf(this.bot.prefix) !== 0) {
      return;
    }

    // decode the message so that we get the command name and an array of the arguments defined
    const args = message.content.slice(this.bot.prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    // try to find the command
    const command = this.bot.commands.get(commandName) ||
      this.bot.commands.get(this.bot.aliases.get(commandName));
    if (!command) {
      Logger.warn(`Command "${commandName}" was not found.`);
      return;
    }

    Logger.log(`${message.author.username}(${message.author.id}) ran the command ${chalk.cyan(commandName)} with arguments: ${args}`);
   command.run(message, args); 
  }
}
