import Logger from '../utils/logger';
import Command from '../utils/command';
import Nova from '../utils/nvro';
import PrettyPrinter from '../utils/prettyPrinter';
import { getSearch, getItem } from '../utils/nvrocmd';


export default class NovaItemInfo extends Command {
  constructor(bot) {
    super(bot, {
      name: "nvii",
      description: "Gets information of a particular item directly from Nova RO's website.",
      usage: `${bot.prefix}nvii <item name | item id> [, <page number>]`,
      aliases: ["ii"],
    });
  }

  async run(message, args) {

    args = args
      .join(' ')
      .split(',')
      .map(arg => arg.trim())
      .filter(arg => args != '');

    if (!args.length) {
      await message.channel.send(`Please specify the name or id of an item to search.`);
      return 'No args';
    }

    if (isNaN(args[0])) {
      Logger.log(`First argument is not a number. Assuming name.`);
      const name = args.shift();
      const pagenum = parseInt(args.shift()) || undefined;
      const reply = await getSearch({
        params: name,
        pagenum: pagenum,
      });

      if (!isNaN(reply)) {
        return this.run(message, [reply]);
      }
      await message.channel.send(reply);
      return reply;
    } 
    
    const reply = await getItem(args[0]);
    await message.channel.send(reply);
    return reply;
  }
}
