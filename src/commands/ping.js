import Logger from '../utils/logger';
import Command from '../utils/command';

export default class Ping extends Command {
  constructor(bot) {
    super(bot, {
      name: "ping",
      description: "Latency and API response times.",
      usage: `${bot.prefix}ping`,
      aliases: ["poke", "pong", "ack"],
    });
  }

  async run(message, args) {
    try {
      const msg = await message.channel.send("🏓 Ping!");
      msg.edit(`🏓 Pong! (Roundtrip took: ${msg.createdTimestamp - message.createdTimestamp}ms. Client: ${Math.round(this.bot.client.ping)}ms.)`);
    } catch (e) {
      Logger.error(e);
    }
  }
}
