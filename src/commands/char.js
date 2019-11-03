import Logger from '../utils/logger';
import Command from '../utils/command';
import ROChargenPHP from '../utils/rochargenphp';

export const MAX_ACTION = 25;
export const MAX_ROTATION = 7;

export default class Char extends Command {
  constructor(bot) {
    super(bot, {
      name: "char",
      description: `Gets the sprite of a Nova RO character. To specify action and rotation respectively, include a #/# after the name. Action seems to go from 0 - ${MAX_ACTION}. Rotation seems to go from 0 - ${MAX_ROTATION}.`,
      usage: `${bot.prefix}char <name> [#/#]`,
      aliases: [],
      category: "Nova",
    });
  } 

  async run(message, args) {
    return await ROChargenPHP({
      message: message,
      args: args,
      max_values: [MAX_ACTION, MAX_ROTATION],
      type: 'char',
    });
  }
}
