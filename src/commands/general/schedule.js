const logger = require('logger.js')("Command module: scheduler");
const scheduler = require('node-schedule');

exports.run = async (discordBot, message, args) => {
  console.log(args);
  
  const t = scheduler.scheduleJob('0 */1 * * * *', (fireDate) => {
    console.log(fireDate);
  }); 


};

exports.info = {
  name: "scheduler",
  category: "general",
  description: "idk yet",
  usage: "@schedule <message> <date/pattern> <recurring flag>",
};
