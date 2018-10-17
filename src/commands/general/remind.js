const logger = require('logger.js')("Command module: scheduler");
const tf = require('task-factory.js');

const ERRNUM = Object.freeze({
  NAS: 1, // no args
  NAONI: 2, // no arg or not int
  FA: 3, // fail add
});

exports.run = async (discordBot, message, args) => {
  logger.info(args);
  
  // No arguments
  if (args.length === 0) {
    invalidInput(message, ERRNUM.NAS);
    return;
  }

  switch (args[0]) {
    
    // invoke --list
    case `--${tf.CMD.LIST}`:
      const page = parseInt(args[1]) || 1;
      await list(message, discordBot, page);
      return;

    // invoke --clear
    case `--${tf.CMD.CLEAR}`:
      await clear(message, discordBot);
      return;

    // invoke --remove
    case `--${tf.CMD.REMOVE}`:
      const entry = parseInt(args[1]);
      if (!entry) {
        invalidInput(message, ERRNUM.NAONI);
        return;
      }
      await remove(message, discordBot, entry);
      return;

    // invoke message adding
    default:
      await addMessage(message, discordBot, args);
      return;
  }
}

function invalidInput(message, errnum) {
  switch (errnum) {
    case ERRNUM.NAS:
      message.channel.send(`Please specify an argument`);
      return;
    case ERRNUM.NAONI:
      message.channel.send(`Please provide a positive integer argument.`);
      return;
    case ERRNUM.FA:
      message.channel.send(`Failed to add message, perhaps add an \`in\` clause or have a valid time offset after the \`in\` clause.`);
      return;
  }
}

async function clear(message, bot) {
  await bot.scheduler.clear(tf.TYPE.MSG);
  message.channel.send(`All reminders have been cleared.`);
}

async function list(message, bot, page) {
  const list = await bot.scheduler.getMessageList(page);
  console.log(list);
  message.channel.send(list);
}

async function remove(message, bot, entry) {
  const removed = await bot.scheduler.remove(tf.TYPE.MSG, entry);
  console.log(removed);
  message.channel.send(`${removed}`);
}

async function addMessage(message, bot, args) {
  const props = {
    channel: message.channel.id,
    ownerid: message.author.id,
    owner: message.author.username,
    type: tf.TYPE.MSG,
    args: args,
  };
  const scheduledItem = await bot.scheduler.add(props);
  if (!scheduledItem) {
    invalidInput(message, ERRNUM.FA);
    return;
  }

  const parseDate = Date.parse(scheduledItem.scheduled);

  const localTime = isNaN(scheduledItem.scheduled) &&
    !isNaN(parseDate) ? 
    scheduledItem.scheduled :
    await bot.scheduler.timeLocalize(message.author.id, scheduledItem.scheduled);
  
  logger.info(`Message set to go off at ${scheduledItem.scheduled}(${localTime})`);
    
  message.channel.send(`Message successfully added and you will be reminded ${localTime}`);  
};

exports.info = {
  name: "remind",
  alias: "rmb",
  category: "general",
  description: `Set a reminder so that the bot will automatically remind you.`,
  usage: "\n\n" +
  "\tTo set a reminder in x amount of time:\n" + 
  "\t\t@remind <message> in <x time>\n\n" +
  "\t(Unavailable) To set a reminder at time x:\n" +
  "\t\t@remind <message at <time x>\n\n" +
  "\tTo list out all reminders:\n" +
  "\t\t@remind --list\n\n" +
  "\tTo remove the xth entry off the list:\n" +
  "\t\t@remind --remove #x\n\n" +
  "\tTo clear all entries\n" +
  "\t\t@remind --clear\n\n"
};
