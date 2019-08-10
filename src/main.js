import Bot from './bot';
import config from '../config.json';

const bot = new Bot(config);
bot.start();
