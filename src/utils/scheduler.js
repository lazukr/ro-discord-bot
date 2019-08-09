import MongoClient from 'mongodb';
import Logger from './logger';
import { MongoCron } from 'mongodb-cron';
import { default as config } from '../../config.json';
export default class Scheduler {
  constructor(bot, url) {
    this.url = url;
    this.bot = bot;
  }

  async init() {
    const mongo = await MongoClient.connect(this.url, { useNewUrlParser: true });
    const db = mongo.db('test');
    this.collection = db.collection('jobs');
    const cron = new MongoCron({
      collection: this.collection,
      onDocument: async (doc) => this.process(doc),
      onError: async (err) => Logger.error(err),
      reprocessDelay: 1000,
      lockDuration: 10000,
    });
    cron.start();


    // default interval is 5 minutes. 
    // If it doesn't exist, we create it.

    
    await this.collection.deleteOne({
      command: "interval",
    });

    const interval = await this.getInterval();
    const date = new Date();
    const coeff = 1000 * 60 * config.aminterval;

    const rounded = new Date(Math.ceil(date.getTime() / coeff) * coeff);

    if (!interval.length) {
      this.insert({
        command: "interval",
        interval: `0 */${config.aminterval} * * * *`,
        sleepUntil: rounded,
        owner: null,
        channelid: null,
      });
    }

    Logger.log("Interval");
    Logger.log(JSON.stringify(await this.getInterval()));
    Logger.log("Automarkets");
    const automarketEntries = await this.list({
      command: "market",
    });
    automarketEntries.forEach(am => {
      Logger.log(JSON.stringify(am));
    });
  }

  async getInterval() {
    return await this.list({
      command: 'interval',
    }); 
  }

  async process(cronjob) {
   
    const { command } = cronjob;

    if (command === "interval") {

      const sleep = new Date(cronjob.sleepUntil);

      const current = new Date();

      // must queue time vs execution time must be within 5 seconds
      // otherwise, it is deemed too long and will be skipped
      if (current - sleep > 1000 * 5) {
        Logger.log("This will be skipped as too much time has passed");
        return;
      }

      Logger.log(`Automarket: ${JSON.stringify(cronjob)}`);
      const list = await this.list({
        command: "market",
      });
     
      const cmd = this.bot.commands.get("market");

      Logger.log("Memory profile before loop:");
      const used = process.memoryUsage();

      for (let key in used) {
        Logger.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
      }

      list.forEach(async (entry) => {
        Logger.log(`Processing ${JSON.stringify(entry)}`);
        const { channelid, owner, args } = entry;
        const message = {
          channel: this.bot.client.channels.get(channelid),
          author: this.bot.client.users.get(owner),
        };
        const originalArgs = args ? JSON.parse(args).join(", ").split(" ") : [];
        await cmd.run(message, originalArgs, true);
      });
      Logger.log("Memory profile after loop:");
      const used = process.memoryUsage();

      for (let key in used) {
        Logger.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
      }
    }
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
