import Logger from '../utils/logger';
import Command from '../utils/command';
import Nova from '../utils/nvro';
import PrettyPrinter from '../utils/prettyPrinter';

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

    args = args.join(' ').split(',').map(arg => arg.trim());

    if (!args.length) {
      message.channel.send(`Please specify the id of an item to search.`);
      return 'No args';
    }

    if (isNaN(args[0])) {
      const name = args.shift();
      const pagenum = parseInt(args.shift()) || undefined;
      await getSearchInfo(message, name, pagenum);
      return;
    } 
    
    await getItemInfo(message, args[0]);  
  }
}

async function getSearchInfo(message, name, pagenum) {
  Logger.log(`Getting search info: ${name}. Page: ${pagenum}`);
  const search = await Nova.getSearchData(name, pagenum);
  const reply = PrettyPrinter.tabulate(search);
  if (reply) {
    await message.channel.send(reply);
    return;
  }

  await message.channel.send(`No results found.`);
  return reply;
}

async function getItemInfo(message, itemId) {
  Logger.log(`Getting item info: ${itemId}`);
  const id = parseInt(itemId);
  const result = await Nova.getItemData(id);
  const reply = PrettyPrinter.itemInfo(result);  
  await message.channel.send(reply);
  return reply;
};
