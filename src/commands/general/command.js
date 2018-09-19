const logger = require('logger.js')('General module: command');
exports.run = async (discordBot, message, args) => {
  logger.info(args);

  const cmdSymbol = discordBot.config.commandPrefix;
  if (args.length === 0) {
    const commandArrayString = discordBot.commandList.keyArray().toString();    
    await message.channel.send(`List of commands: \`${commandArrayString}\` \n` +
                               `Use \`${cmdSymbol}command <command_name>\` to list out the specifics of a particular command`);  
    return;
  }

  const cmd = discordBot.commandList.get(args[0]) ||
              discordBot.commandAliasList.get(args[0]);
  if (!cmd) {
    await message.channel.send(`The command ${args[0]} does not exist.`);
    return;
  }

  const cmdInfo = cmd.cmd.info;
  const usageString = cmdInfo.usage.replace("@", cmdSymbol);
  
  const msg = `\`\`\`name: ${cmdInfo.name}\n\
alias: ${cmdInfo.alias ? cmdInfo.alias : "none"}\n\
category: ${cmdInfo.category}\n\
description: ${cmdInfo.description}\n\
usage: ${usageString}\`\`\``;

  await message.channel.send(msg);
};

exports.info = {
  name: "command",
  alias: "cmd",
  category: "general",
  description: "use this to get info on all commands",
  usage:  "\`@command\` to list out all commands \n" +
          "\`@command <command>\` to list out specifics of a particular command",
};
