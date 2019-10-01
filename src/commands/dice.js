import Logger from '../utils/logger';
import Command from '../utils/command';
import getRandom from '../utils/random';

const numToWordMap = Object.freeze({
  1: "\:one:",
  2: "\:two:",
  3: "\:three:",
  4: "\:four:",
  5: "\:five:",
  6: "\:six:",
});

export default class Dice extends Command {
  constructor(bot) {
    super(bot, {
      name: "dice",
      description: "Rolls a dice.",
      usage: `${bot.prefix}dice`,
      alias: ["roll"],
    });
  }

  async run(message, args) {

    const chosen = numToWordMap[getRandom(5) + 1];
    await message.channel.send(`${chosen}`); 
  }

}
