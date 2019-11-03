const dp = require('divine-pride-commons.js');
const logger = require('logger.js')("Divine Pride Mob Module");

exports.info = {
  name: "mob",
  alias: "mi",
  category: "Divine Pride",
  description: "Gets information of a mob from the divine pride database. Displays limited information, but provides link to divine pride's mob database for the rest.",
  usage: "@mob <mob_id>",
};

exports.run = async (discordBot, message, args) => {
  args = args.join(' ').split(',');
  args = args.map(i => i.trim());
  
  logger.info(args);
  
  const mob = await dp.getData(message, args, dp.SEARCH.MOB);
};

