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
    
    const embed = {
      embed: {
        title: `**${command.help.name}**`,
        description: command.help.description,
        fields: [{
          name: "**Alias**",
          value: `${command.configuration.aliases.join(', ')}`,
        }, {
          name: "**Category**",
          value: command.help.category,
        }, {
          name: "**Usage**",
          value: command.help.usage,
        }],
      },

    };


    const reply = '```\n' +
      `Name: ${command.help.name}\n\n` +
      `Aliases: ${command.configuration.aliases.toString()}\n\n` +
      `Description: ${command.help.description}\n\n` +
      `Category: ${command.help.category}\n\n` +
      `Usage: ${command.help.usage}\n\n` +
      '```';
    message.channel.send(embed);
  }

}
