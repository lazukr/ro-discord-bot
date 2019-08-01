import Logger from '../utils/logger';
import Command from './command';

class Ping extends Command {
  constructor(client) {
    super(client, {
      name: "Ping",
      description: "Pings a response from the bot",
      category: "System",
      usage: `${client.prefix}ping`,
      aliases: ["poke"],
    });
  }

  async run(message, args) {
    try {
      const msg = await message.channel.send("🏓 Ping!");
      msg.edit(`🏓 Pong! (Roundtrip took: ${msg.createdTimestamp - message.createdTimestamp}ms. Client: ${Math.round(this.client.ping)}ms.)`);
    } catch (e) {
      Logger.error(e);
    }
  }
}
