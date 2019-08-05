import Logger from "../utils/logger";
import Command from "../utils/command";

export default class NovaAutoMarket extends Command {
  constructor(bot) {
    super(bot, {
      name: "automarket",
      description: "Gets market information of a particular item directly from Nova RO's website on a regular basis. When results exist, the bot will notify the user.",
      usage: `${bot.prefix}automarket <item id> [, <refine>] [, <price>] [, <additional properties>].`,
      aliases: ["am"],
      category: "Nova",
      subCommands: ["list", "clear", "remove", "interval"],
    });
  }

  async run(message, args) {
    
    // reject empty messages
    if (!args.length) {
      const reply = `Please specify the id of an item to queue automarket.`;
      await message.channel.send(reply);
      return "No args";
    }

    // handle subcommands 
    const subCommand = super.getSubCommand(args[0]);
    if (subCommand) {
      if (!this.help.subCommands.includes(subCommand)) {
        const reply = `\`${subCommand}\` is not a valid sub command.`;
        await message.channel.send(reply);
        return reply;
      }

      // remove the subcommand from argument list
      // so it is not passed into the subcommands
      args.shift();
      await super.runSubCommand(subCommand, message, args);
      return subCommand;
    }

    // continue to normal action
  }

  async clear(message, args) {
    Logger.log(`Clearing automarket...`);
  }

  async list(message, args) {
    Logger.log(`Listing automarket...`);
  }

  async remove(message, args) {
    Logger.log(`Removing automarket entry...`);
  }

  async interval(message, args) {
    Logger.log(`Setting automarket interval...`);
  }
}
