import MongoClient from 'mongodb';
import Logger from './logger';
import schedule from 'node-schedule-tz';
import Scraper from './scraper';
import Nova from "../utils/nvro";
import { TIMEZONE, REMIND } from "../commands/remind";
import { MARKET } from "../commands/automarket";
import { MARKETQUEUE } from "../commands/market";
import Reminder, { CRON_DATE } from './reminder';
import moment from 'moment';

export default class Scheduler {
  constructor(bot, url) {
    this.url = url;
    this.bot = bot;
    this.reminderer = new Reminder(bot);
  }

  async init() {
    const mongo = await MongoClient.connect(this.url, { useNewUrlParser: true });
    const db = mongo.db('test');
    this.collection = db.collection('jobs');
    this.reminderList = {};

    this.reminderer.on(REMIND, this.reminderer.process);

    await this.queueReminders();
    
    // to delete all reminders
    //await this.clear({command: REMIND });

    // begin the scheduler
    schedule.scheduleJob(`*/1 * * * *`, async () => {
      if (!Scraper.getPage) {
        Logger.warn(`Bot is not logged in.`);
        ////const adminChannel = this.bot.client.channels.get(this.bot.admin.channel);
        this.bot.adminChannel.send(`<@${this.bot.admin.id}> Bot is not logged in. Please login!`);
        return;
      }

      await this.processAutomarkets();
    });

    Logger.log("Reminders");
    const reminderEntries = await this.list({
      command: REMIND,
    });

    Logger.log(`# of: ${reminderEntries.length}`);

    for (const rm of reminderEntries) {
      const { channelid, owner, message, _id, } = rm;
      const author = await this.bot.client.users.fetch(owner);
      Logger.log(`id=${_id} owner=${author.tag}(${owner}) channelid=${channelid} message=${message}`);
    };

    Logger.log(`End of reading Reminders`);
    Logger.log("Automarkets");
    const automarketEntries = await this.list({
      command: MARKET,
    });

    Logger.log(`# of: ${automarketEntries.length}`);
    
    for (const am of automarketEntries) {
      const { channelid, owner, args, _id, itemid, creationDateTime, name } = am;
      const author = await this.bot.client.users.fetch(owner);
      Logger.log(`id=${_id} owner=${author.tag}(${owner}) channelid=${channelid} item=${name}(${itemid}) args=${args} creationDateTime=${creationDateTime}`);
    };

    Logger.log(`End of reading Automarkets`);
  }

  async loadReminder(reminder) {
    const id = reminder._id;
    if (id in this.reminderList) {
      Logger.log(`This is already queued in the list.`);
      return;
    }

    const expireDate = new Date(reminder.sleepUntil);
    const currentDate = new Date();

    const queueDate = moment(expireDate).isSame(moment(CRON_DATE))
      ? reminder.modifier 
      : currentDate > expireDate 
      ? currentDate.setSeconds(currentDate.getSeconds() + 1) 
      : expireDate;

    Logger.log(`Loading reminder: ${id}`);

    const paramsArray = [id.toString(), queueDate];

    if (moment(expireDate).isSame(CRON_DATE)) {
      paramsArray.push(reminder.timeElement); // modifier for modifying timezone
    }

    this.reminderList[id] = schedule.scheduleJob(...paramsArray, async () => {
      await this.reminderer.emit(REMIND, reminder);

      if (reminder.sleepUntil === CRON_DATE) {
        return;
      }

      if (reminder.repeat) {
        const now = new Date();
        let newSleepUntil = new Date(reminder.sleepUntil);
        while (newSleepUntil < now) {
          newSleepUntil = Reminder.applyDateTransform(newSleepUntil, reminder.modifier);
        }

        //const newSleepUntil = Reminder.applyDateTransform(now, reminder.modifier);
        const updateStatus = await this.update(id, {sleepUntil: newSleepUntil});
        const newReminder = await this.get(id);

        // already killed by now
        if (!newReminder) {
          return;
        }

        await this.cancelReminder(id);
        await this.loadReminder(newReminder);
        return;
      }

      Logger.log(`Deleting ${id} ...`);
      await this.cancelReminder(id);
      const removeStatus = await this.remove(id);
      if (removeStatus.deletedCount) {
        Logger.log(`Deleted ${id}.`);
      }
      //Logger.debug(removeStatus);
    });

    Logger.log(`Queued reminder: ${id}`);
  }

  async cancelReminder(key) {
    Logger.log(`Cancelling reminder: ${key}`);
    if (key in this.reminderList &&
      this.reminderList[key]) {
        this.reminderList[key].cancel();
        delete this.reminderList[key];
        Logger.log(`Dequeued ${key}.`);
      }
  }

  async queueReminders() {
    const list = await this.list({
      command: REMIND,
    });

    list.map(async (reminder) => {
      await this.loadReminder(reminder);
    });
  }

  async processAutomarkets(inputOwner = null) {
    const list = await this.list({
      command: MARKET,
      owner: inputOwner,
    });

    const cmd = this.bot.commands.get(MARKET);

    return await Promise.all(list.map(async (entry, i) => {
      return new Promise(async (res) => {
        setTimeout(async () => {
          const { 
            channelid,
            owner,
            args, 
            result,
            _id,
            itemid,
            name,
          } = entry;
          const message = {
            channel: await this.bot.client.channels.fetch(channelid),
            author: await this.bot.client.users.fetch(owner),
          };
          Logger.log(`DOING ${_id} ${owner} ${itemid.toString().padStart(5, '0')}`);

          const originalArgs = args ? JSON.parse(args).join(", ").split(" ") : [];
          const marketResult = await cmd.run(message, originalArgs, {
            silent: true,
            name: name,
          });

          if (!marketResult.result) {
            return;
          }

          if (result != marketResult.reply) {
            Logger.log(`Changes for ${_id}: ${message.author.tag}(${owner}) - ${args}`);
            Logger.log(marketResult.reply);
            await this.update(_id, {
              result: marketResult.reply,
              name: name || marketResult.name,
            });
            if (!inputOwner) {
              await message.channel.send(`${message.author.toString()}${marketResult.reply}`);
            }

            if (inputOwner) {
              res(marketResult);
            }
            return;
          }

          if (inputOwner) {
            res(marketResult);
          }
          //Logger.log(`No changes for ${_id}: ${message.author.tag}(${owner}) - ${args}`);
        }, 125 + 250 * i);
      });
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

    if (command === REMIND) {
      const list = await this.list(clearParams);
      await Promise.all(list.map(async (entry) => {
        return await this.cancelReminder(entry._id);
      }));
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
    
    //Logger.debug(`command: ${command} | owner: ${owner}`);

    const findParams = {
      command: { $eq: command },
    };

    if (owner) {
      findParams.owner = { $eq: owner };
    }

    const cursor = await this.collection.find(findParams);
    cursor.sort({
      creationDateTime: 1,
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
    message = null,
    type = null,
    creationDateTime = null,
    sleepUntil = null, // denotes when next time should occur for reminder
    repeat = false,
    cron = null,
    modifier = null,
    timeElement = null,
  }) {

    const params = {
      channelid: channelid,
      command: command,
      owner: owner,
      creationDateTime: creationDateTime,
    };

    if (command === TIMEZONE) {
      params._id = owner;
    }

    if (args) {
      params.args = args;
    }

    if (message) {
      params.message = message;
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

    if (repeat) {
      params.repeat = repeat;
    }

    if (creationDateTime) {
      params.creationDateTime = creationDateTime;
    }

    if (modifier) {
      params.modifier = modifier;
    }

    if (cron) {
      params.cron = cron;
    }

    if (timeElement) {
      params.timeElement = timeElement;
    }

    const insertResult = await this.collection.insertOne(params);
    if (command === REMIND) {
      await this.loadReminder(insertResult.ops[0]);
    }
    return insertResult;
  }
}
