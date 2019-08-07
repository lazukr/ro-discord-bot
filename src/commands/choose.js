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
      const reply = `${this.bot.name} cannot choose something that is not there.`;
      await message.channel.send(reply);
      return reply;
    }

    const list = args.join(' ').split(',').map(text => text.trim());
    const allSame = list.every(arg => {
      return arg === list[0];
    });
    if (list.length === 1 || allSame) {
      const reply = `${this.bot.name} was forced to choose \`${list[0]}\` as there was nothing else to choose from.`;
      await message.channel.send(reply);
      return reply;
    }

    const chosen = list[choose(list.length)];
    const reply = `\`${chosen}\``;
    await message.channel.send(reply);
    return reply;
  }
}

function choose(max) {
  return Math.floor(Math.random() * max);
}
