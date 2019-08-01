import chalk from 'chalk';
import moment from 'moment';

const LogType = Object.freeze({
  Log: ' LOG ',
  Warn: ' WRN ',
  Error: ' ERR ',
  Debug: ' DBG ',
});


export default class Logger {
  
  static getTimestamp() {
    return `[${moment().format('YYYY-MM-DD HH:mm:ss:SSS')}]`;
  }

  static _buildMessage(message, type) {
    return console.log(`${Logger.getTimestamp()} ${type}: ${message}`);
  }

  static log(message) {
    Logger._buildMessage(chalk.green(message), chalk.black.bgGreen(LogType.Log));
  }

  static warn(message) {
    Logger._buildMessage(chalk.yellow(message), chalk.black.bgYellow(LogType.Warn));
  }

  static error(message) {
    Logger._buildMessage(chalk.red(message), chalk.black.bgRed(LogType.Error));
  }

  static debug(message) {
    Logger._buildMessage(chalk.blue(message), chalk.black.bgBlue(LogType.Debug));
  }

}

