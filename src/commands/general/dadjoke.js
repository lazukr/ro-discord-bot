const logger = require('logger.js')('General module: dadjoke');
const sc = require('scrape-commons');

exports.run = async (DiscordBot, message, args) => {
    const response = await sc.getDadJoke();
    logger.log(response.joke)
    await message.channel.send(response.joke);
};

exports.info = {
  name: "dadjoke",
  category: "general",
  description: "tells you a dad joke",
  usage: "@dadjoke",
};

