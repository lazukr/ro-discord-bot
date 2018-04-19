const logger = require('logger.js')('General module: choose');
exports.run = async (DiscordBot, message, args) => {
  
  logger.info(args);

  if (args.length === 0) {
    message.channel.send("Bear can't choose something that is not there");
    return;
  }

  const list = args.join(' ').split(',');


  if (list.length === 1) {
    message.channel.send(`\`${args}\`, there was nothing else to choose from.`);
    return;
  };

  const chosen = list[choose(list.length)]; 
  const msg = message.channel.send(`\`${chosen}\``); 
};

exports.info = {
  name: "choose",
  category: "general",
  description: "choose a random item in a list deliminated by commas",
  usage: "@choose a,b,...,z",
};

function choose(max) {
  return Math.floor(Math.random() * (max));
};
