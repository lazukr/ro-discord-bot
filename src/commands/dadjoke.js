import Logger from '../utils/logger';
import Command from '../utils/command';
import Scraper from '../utils/scraper';

export default class Choose extends Command {
  constructor(bot) {
    super(bot, {
      name: "dadjoke",
      description: `${bot.name} tells you a dad joke.`,
      usage: `${bot.prefix}dadjoke`,
    });
  }

  async run(message, args) {
    const response = await Scraper.getDadJoke();
    if (response.status === 200) {
        message.channel.send(response.joke);
    }
  }
}

