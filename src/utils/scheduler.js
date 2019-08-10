import MongoClient from 'mongodb';
import Logger from './logger';
import cron from 'node-cron';

export default class Scheduler {
  constructor(bot, url) {
    this.url = url;
    this.bot = bot;
  }

  async init() {
    const mongo = await MongoClient.connect(this.url, { useNewUrlParser: true });
    const db = mongo.db('test');
    this.collection = db.collection('jobs');

    // begin the scheduler
    cron.schedule(`0 */${this.bot.aminterval} * * * *`, async () => {
      await this.processAutomarkets();
    });

    Logger.log("Automarkets");
    const automarketEntries = await this.list({
      command: "market",
    });
    automarketEntries.forEach(am => {
      Logger.log(JSON.stringify(am));
    });
  }

  async processAutomarkets() {

    const list = await this.list({
      command: "market",
    });

    const cmd = this.bot.commands.get("market");

    await Promise.all(list.map(async (entry) => {
      Logger.log(`Processing ${JSON.stringify(entry)}`);
      const { channelid, owner, args } = entry;
      const message = {
        channel: this.bot.client.channels.get(channelid),
        author: this.bot.client.users.get(owner),
      };
      const originalArgs = args ? JSON.parse(args).join(", ").split(" ") : [];
      await cmd.run(message, originalArgs, true);
    }));
    const usedAfter = process.memoryUsage();
    const ht = "heapTotal";
    Logger.debug(`${ht}: ${Math.round(usedAfter[ht] / 1024 / 1024 * 100) / 100} MB`);

  }

  async clear({
    command,
    owner = null,
  }) {
    
    const clearParams = {
      command: command,
    };

    if (owner) {
      clearParams.owner = owner;
    }

    return await this.collection.deleteMany(clearParams);
  }

  async remove(id) {
    return await this.collection.deleteOne({
      _id: id,
    });
  }

  async get(id) {
    return await this.collection.findOne({
      _id: id,
    });
  }

  async list({
    command,
    owner = null,
  }) {
    
    const findParams = {
      command: { $eq: command },
    };

    if (owner) {
      findParams.owner = { $eq: owner };
    }

    const cursor = await this.collection.find(findParams);
    cursor.sort({
      sleepUntil: 1,
    });
    
    const list = await cursor.toArray();
    return list;
  }

  async insert({
    channelid,
    command,
    owner,
    args,
    name,
    itemid,
    sleepUntil = null,
    interval = null,
    autoRemove = false,
  }) {

    const params = {
      channelid: channelid,
      command: command,
      owner: owner,
      itemid: itemid,
      args: args,
      name: name,
    };

    if (sleepUntil) {
      params.sleepUntil = sleepUntil;
    }

    if (interval) {
      params.interval = interval;
    }

    if (autoRemove) {
      params.autoRemove = autoRemove;
    }

    return await this.collection.insertOne(params);
  }
}
