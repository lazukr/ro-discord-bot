import Logger from '../utils/logger';
import chalk from 'chalk'; 

export class Message {
  constructor(client) {
    this.client = client;
  }

  async run (message) {
    // avoid responding to bots
    if (message.author.bot) {
      return;
    }

    // avoid any message that does not start with the designated prefix
    if (message.content.indexOf(this.client.prefix) !== 0) {
      return;
    }

    // decode the message so that we get the command name and an array of the arguments defined
    const args = message.content.slice(this.client.prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    // try to find the command
    const command = this.client.commands.get(commandName) ||
      this.client.commands.get(this.client.aliases.get(commandName));
    if (!cmd) {
      Logger.warn(`Command "${commandName}" was not found.`);
      return;
    }

    Logger.log(`${message.author.username}(${message.author.id}) ran the command ${chalk.black.bgMagenta(commandName)} with arguments: ${args}`);
   command.run(message, args); 
  }
}
