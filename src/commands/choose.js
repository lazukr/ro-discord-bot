import Logger from '../utils/logger';
import Command from '../utils/command';

export default class Choose extends Command {
  constructor(bot) {
    super(bot, {
      name: "choose",
      description: "Chooses a random item in a list deliminated by commas.",
      usage: `${bot.prefix}choose a,b,...,z`,
      aliases: ["select", "pick", "choice"],
    });
  }

  async run(message, args) {
    if (!args.length) {
      await message.channel.send(`${this.bot.name} cannot choose something that is not there.`);
      return;
    }

    const list = args.join(' ').split(',').map(text => text.trim());
    if (list.length === 1) {
      await message.channel.send(`${this.bot.name} was forced to choose this as there was nothing else to choose from.`);
      return;
    }

    const chosen = list[choose(list.length)];
    const msg = await message.channel.send(`\`${chosen}\``);
  }
}

function choose(max) {
  return Math.floor(Math.random() * max);
}
