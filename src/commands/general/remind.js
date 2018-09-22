const logger = require('logger.js')("Command module: scheduler");
const taskFactory = require('task-factory.js');

exports.run = async (discordBot, message, args) => {

  if (args.length === 0) {
    message.channel.send("Need to specify input");
    return;
  }
  
  if (args == "clear") {
    await discordBot.scheduler.clear(taskFactory.MSG);
    message.channel.send("All reminders are cleared");
    return;
  }

  if (args == "list") {
    const list = await discordBot.scheduler.getMessageList();
    list.forEach(msg => {
      message.channel.send(`\`\`\`${msg.join("\n")}\`\`\``);
    });
    return;
  }

  if (args[0] == taskFactory.REMOVE) {
    if (isNaN(args[1])) {
      message.channel.send("Please specify the idnex on the list to remove the item.");
      return;
    }
    const removedMsg = await discordBot.scheduler.remove(taskFactory.MSG, args[1]);
    console.log(removedMsg);
    message.channel.send(removedMsg);
    return;
  }

  const props = {
    channel: message.channel.id,
    ownerid: message.author.id,
    owner: message.author.username,
    type: taskFactory.MSG,
    args: args,
  };
  
  const scheduledItem = await discordBot.scheduler.add(props);

  if (!scheduledItem) {
    message.channel.send(`Failed to add message, perhaps add an \`in\` clause or have valid times after the \`in\` clause. Refer to the description`);
    return;
  }
  
  const localTime = await discordBot.scheduler.timeLocalize(message.author.id, scheduledItem.scheduled);
  
  logger.info(`Message set to go off at ${scheduledItem.scheduled}(${localTime})`);
    
  message.channel.send(`Message successfully added and you will be reminded ${localTime}`);  

};

exports.info = {
  name: "remind",
  alias: "rmb",
  category: "general",
  description: `Set a reminder so that the bot will automatically remind you. There are several sub commands to use. Here are an explanation of them all:
  clear: use this to clear all message entries.
  list: use this to list all active message entries.
  remove <index>: remove an entry based on the index given by the list.
  <message>, in <duration>: sets a reminder for the bot to remind you IN <duration> amount of time.
  <message>, at <time>: sets a reminder for the bot to remind you AT the specified <time>. (Currently unsupported)`,
  usage: "@remind <message>, in/at <time pattern>",
};
