export default class Command {
  constructor(bot, {
    name = null,
    description = "No description provided.",
    category = "Miscellaneous",
    usage = "No usage provided.",
    enabled = true,
    aliases = new Array(),
  }) {
    this.bot = bot;
    this.configuration = { enabled, aliases};
    this.help = { name, description, category, usage };
  }

}
