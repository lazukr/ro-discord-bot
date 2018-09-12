const logger = require('logger.js')("Command module: scheduler");
const moment = require('moment-timezone');
const storage = require('node-persist');
const userdir = 'src/userdb';
const userdb = storage.create();

userdb.init({
  dir: userdir, 
});

exports.run = async (discordBot, message, args) => {

  if (args.length === 0) {
    message.channel.send("Need to specify input");
    return;
  }
  
  if (args == "clear") {
    await discordBot.scheduler.clear();
    message.channel.send("All reminders are cleared");
    return;
  }

  if (args == "list") {
    const list = await discordBot.scheduler.getList();
    message.channel.send(`\`\`\`${list.join('\n')}\`\`\``);
    return;
  }
  
  const scheduledItem = await discordBot.scheduler.add(
      message.channel.id,
      message.author.id,
      "message",
      args);

  if (!scheduledItem) {
    message.channel.send(`Failed to add message, perhaps add an \`in\` clause or \`at\` clause. Refer to the description`);
    return;
  }
  
  const timezone = await userdb.getItem(message.author.id);
  const scheduled = new Date(scheduledItem.scheduled);
  const localTime = moment(scheduled).tz(timezone).calendar(); 

  message.channel.send(`Message successfully added and you will be reminded ${localTime}`);  

};

exports.info = {
  name: "remind",
  alias: "rmb",
  category: "general",
  description: "idk yet",
  usage: "@schedule <message> <date/pattern> <recurring flag>",
};
