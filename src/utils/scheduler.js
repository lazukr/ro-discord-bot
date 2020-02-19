import MongoClient from 'mongodb';
import Logger from './logger';
import schedule from 'node-schedule';
import Scraper from './scraper';
import Nova from "../utils/nvro";
import { TIMEZONE, REMIND } from "../commands/remind";
import { MARKET } from "../commands/automarket";
import { MARKETQUEUE } from "../commands/market";

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
    schedule.scheduleJob(`*/1 * * * *`, async () => {
      await this.processAutomarkets();
      await this.processReminders();
    });

    Logger.log("Reminders");
    const reminderEntries = await this.list({
      command: REMIND,
    });

    Logger.log("Automarkets");
    const automarketEntries = await this.list({
      command: MARKET,
    });

    reminderEntries.forEach(rm => {
      const { channelid, owner, args, _id, } = rm;
      Logger.log(`id=${_id} owner=${owner} channelid=${channelid} msg=${args}`);
    });

    automarketEntries.forEach(am => {
      const { channelid, owner, args, _id, itemid, } = am;
      Logger.log(`id=${_id} owner=${owner} channelid=${channelid} itemid=${itemid} args=${args}`);
    });

    Logger.log("Market Queues");
    const automarketqueueEntries = await this.list({
      command: "marketqueue",
    });
    automarketqueueEntries.forEach(amq => {
      Logger.log(JSON.stringify(amq));
    });  
  }

  async processQueues() {
    const marketQueueList = await this.list({
      command: MARKETQUEUE,
    });

    const marketCmd = this.bot.commands.get("market");
    await Promise.all(marketQueueList.map(async (entry) => {
      Logger.log(`Processing market queues ${JSON.stringify(entry)}`);
      const { channelid, owner, args } = entry;
      const message = {
        channel: this.bot.client.channels.get(channelid),
        author: this.bot.client.users.get(owner),
      };
      const originalArgs = args ? JSON.parse(args).join(", ").split(" ") : [];
      await marketCmd.run(message, originalArgs);
    }));

    await this.clear({
      command: MARKETQUEUE,
    });

    const marketList = await this.list({
      command: MARKET,
    });

    const noNames = marketList.filter((entry) => !entry.name);


    await Promise.all(noNames.map(async (entry) => {
      Logger.log(`Processing ${JSON.stringify(entry)}`);
      const {_id, itemid, name} = entry;
      
      console.log(_id);
      const dt = await Nova.getMarketData(itemid);
      await this.update(_id, {$set: {
        name: dt.name,
      }});
    }));
  }

  async _processAutomarkets(list) {
    const cmd = this.bot.commands.get(MARKET);
    return await Promise.all(list.map(async (entry) => {
      
      const { channelid, owner, args, result, _id, itemid, } = entry;
      Logger.log(`Processing id=${_id} owner=${owner} itemid=${itemid} args=${args}`);
      const message = {
        channel: this.bot.client.channels.get(channelid),
        author: this.bot.client.users.get(owner),
      };
      const originalArgs = args ? JSON.parse(args).join(", ").split(" ") : [];
      return await cmd.run(message, originalArgs, true);
    }));
  }

  async processReminders() {
    const list = await this.list({
      command: REMIND,
    });

    



  }

  async processAutomarkets(inputOwner = null) {

    if (!await Scraper.login()) {
      return;
    }

    const list = await this.list({
      command: MARKET,
      owner: inputOwner,
    });

    const cmd = this.bot.commands.get(MARKET);
    return await Promise.all(list.map(async (entry) => {
      console.log(entry);
      const { channelid, owner, args, result, _id, itemid, } = entry;
      Logger.log(`Processing id=${_id} owner=${owner} itemid=${itemid} args=${args}`);
      const message = {
        channel: this.bot.client.channels.get(channelid),
        author: this.bot.client.users.get(owner),
      };
      const originalArgs = args ? JSON.parse(args).join(", ").split(" ") : [];
      const marketResult = await cmd.run(message, originalArgs, true);

      if (result != marketResult.reply) {
        Logger.log(`There were changes for ${_id}: ${owner} - ${args}`);
        await this.update(_id, {
          result: marketResult.reply,
        });
        if (!inputOwner) {
          await message.channel.send(`${message.author.toString()}${marketResult.reply}`);
        }
        if (inputOwner) {
          return marketResult;
        }
      }

      if (inputOwner) {
        return marketResult;
      }
      Logger.log(`No changes for ${_id}: ${owner} - ${args}`);
    }));
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

  async update(id, values, upsert = false) {
    return await this.collection.updateOne({
      _id: id,
    }, {$set: values}, {upsert: upsert});
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
    name = null,
    itemid = null,
    result = null,
    msg = null,
    type = null,
    sleepUntil = null, // denotes when next time should occur for reminder
    interval = null, // denotes cron for reminder
    autoRemove = false,
  }) {

    const params = {
      channelid: channelid,
      command: command,
      owner: owner,
      args: args,
    };

    if (command === TIMEZONE) {
      params._id = owner;
    }

    if (msg) {
      params.msg = msg;
    }

    if (type) {
      params.type = type;
    }

    if (name) {
      params.name = name;
    }

    if (itemid) {
      params.itemid = itemid;
    }

    if (result) {
      params.result = result;
    }

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
