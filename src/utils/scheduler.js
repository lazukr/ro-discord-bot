import MongoClient from 'mongodb';
import Logger from './logger';
import { MongoCron } from 'mongodb-cron';

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
      nextDelay: 10000,
      reprocessDelay: 10000,
    });
    cron.start();


    // default interval is 5 minutes. 
    // If it doesn't exist, we create it.
    const interval = await this.getInterval();
    if (!interval.length) {
      this.insert({
        command: 'interval',
        args: '5',
        sleepUntil: null,
        owner: null,
        channelid: null,
      });
    }
  }

  async getInterval() {
    return await this.list({
      command: 'interval',
    }); 
  }

  async process({
    channelid,
    command,
    owner,
    args,
  }) {

    const cmd = this.bot.commands.get(command);
    const message = {
      channel: this.bot.client.channels.get(channelid),
    };
    
    args = args ? JSON.parse(args).join(", ").split(" ") : [];
    cmd.run(message, args, true);
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
    sleepUntil = 1,
    interval = null,
    autoRemove = false,
  }) {

    const params = {
      channelid: channelid,
      command: command,
      owner: owner,
      itemid: itemid,
      args: args,
      sleepUntil: sleepUntil,
      name: name,
    };

    if (command === "market") {
      const interval = await this.getInterval();
      params.interval = `* */${interval[0].args} * * * *`;
    }

    if (autoRemove) {
      params.autoRemove = true;
    }

    return await this.collection.insertOne(params);
  }
}
