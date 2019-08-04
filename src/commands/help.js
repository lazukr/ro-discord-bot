import Logger from '../utils/logger';
import Command from '../utils/command';

export default class Help extends Command {
  constructor(bot) {
    super(bot, {
      name: "help",
      description: "Provides information about the commands.",
      usage: `${bot.prefix}help [<command>]`,
      aliases: ["command", "cmd", "h"],
    });
  }

  async run(message, args) {
    if (!args.length) {
      message.channel.send(`Here are a list of all the available commands: ${this.bot.commandList.toString()}`); 
      return;
    }

    const name = args.shift();
    const command = this.bot.commands.get(name) ||
      this.bot.commands.get(this.bot.aliases.get(name));

    if (!command) {
      message.channel.send(`${this.bot.name} does not know of this command.`);
      this.run(message, []);
      return;
    }
    
    const reply = '' +
      `Name: ${command.help.name}\n` +
      `Description: ${command.help.description}\n` +
      `Category: ${command.help.category}\n` +
      `Usage: ${command.help.usage}\n` +
      `Aliases: ${command.configuration.aliases.toString()}\n`;

    message.channel.send(reply);
  }

}
