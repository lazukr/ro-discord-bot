const logger = require('logger.js')("Divine Pride Mob 2 Module");
const cheerio = require('cheerio');
const rp = require('request-promise');
const moblink = "https://www.divine-pride.net/database/monster/";


exports.info = {
  name:         "mob2",
  category:     "Divine Pride",
  description:  "html scrap version of mob",
  usage:        "@mob2 <mob_id>",
};

exports.run = async (discordBot, message, args) => {
  logger.info(args);

  if (isNaN(args)) {
    message.channel.send("I don't know what you are trying to do");
    return;
  }

  logger.info(`${moblink}${args}`);

  const request = {
    uri: `${moblink}${args}`,
    transform: function (body) {
      return cheerio.load(body);
    },
  }; 

  const result = await rp(request)
    .then(data => {
      return data;
    })
    .catch(err => {
      logger.info(err);
    });

  const name = result('.entry-title').text().trim().split("\n")[0];


  logger.info(name);
};
