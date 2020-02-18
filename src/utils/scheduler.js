import MongoClient from 'mongodb';
import Logger from './logger';
import cron from 'node-cron';
import Scraper from './scraper';
import Nova from "../utils/nvro";

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
    cron.schedule(`0 */1 * * * *`, async () => {
      await this.processAutomarkets();
    });

    Logger.log("Automarkets");
    const automarketEntries = await this.list({
      command: "market",
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
      command: "marketqueue",
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
      command: "marketqueue",
    });

    const marketList = await this.list({
      command: "market",
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
    const cmd = this.bot.commands.get("market");
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



  async processAutomarkets(inputOwner = null) {

    if (!await Scraper.login()) {
      return;
    }

    const list = await this.list({
      command: "market",
      owner: inputOwner,
    });

    const cmd = this.bot.commands.get("market");
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
        await this.update(_id, {$set: {
          result: marketResult.reply,
        }});
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

  async update(id, values) {
    return await this.collection.updateOne({
      _id: id,
    }, values);
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
