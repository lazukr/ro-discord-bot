const dpapi = require('divine-pride-api.js');
const logger = require('logger.js')("Divine Pride Mob Module");
const mobType = dpapi.types.mob;

exports.info = {
  name: "mob",
  alias: "ms",
  category: "Divine Pride",
  description: "Gets information of a mob from the divine pride database. Displays limited information, but provides link to divine pride's mob database for the rest.",
  usage: "@mob <mob_id>",
};

exports.run = async (discordBot, message, args) => {
  const apiKey = discordBot.config.divinePrideToken;
  const jsonReply = await dpapi.getApiJSON(message, args, apiKey, mobType.apiName);

  if (!jsonReply || jsonReply.name == null) {
    const notlikeblob = discordBot.client.emojis.find("name", "notlikeblob"); 
    message.channel.send(`Bear has no data on this. ${notlikeblob}`);
    return;
  }

  logger.info(`Requested mob: ${jsonReply.name}, ${jsonReply.id}`);

  const element = dpapi.getElement(jsonReply.stats.element); 
  const scale = dpapi.getScale(jsonReply.stats.scale);
  const race = dpapi.getRace(jsonReply.stats.race);
  const dburl = dpapi.getDBLink(mobType.typeName, jsonReply.id);
  const spriteurl = dpapi.getSpriteLink(mobType.spriteName, jsonReply.id);
  const iconurl = dpapi.getIconLink(mobType.iconName);

  const drops = jsonReply.drops;

  const embedReply = {
    "embed": {
      "color": element.type.colour,
      "title": `Level ${jsonReply.stats.level}`,
      "description": `[**${jsonReply.name}**](${dburl})`,
      "author": {
        "name": jsonReply.id,
        "icon_url": iconurl,
      },
      "thumbnail": {
        "url": spriteurl,
      },
      "fields": [
        {
          "name": "Race",
          "value": race,
          "inline": true,
        },
        {
          "name": "Aggro Range",
          "value": jsonReply.stats.aggroRange,
          "inline": true,
        },
        {
          "name": "Element",
          "value": `${element.type.name} ${element.level}`,
          "inline": true, 
        },
        {
          "name": "Escape Range",
          "value": jsonReply.stats.escapeRange,
          "inline": true,
        },
        {
          "name": "Scale",
          "value": scale, 
          "inline": true,
        },
        {
          "name": "Attack Range",
          "value": jsonReply.stats.attackRange,
          "inline": true,
        },
        {
          "name": "Health",
          "value": jsonReply.stats.health,
          "inline": true,
        },
        {
          "name": "Movement Speed",
          "value": jsonReply.stats.movementSpeed,
          "inline": true,
        },
        {
          "name": "Attack",
          "value": jsonReply.stats.attack.minimum + " - " + jsonReply.stats.attack.maximum,
          "inline": true,
        },
        {
          "name": "Attack Speed",
          "value": jsonReply.stats.attackSpeed,
          "inline": true,
        },
        {
          "name": "_ _",
          "value": "_ _",
        },
        {
          "name": "Drops",
          "value": "_ _",
        }
      ]
    },
  };

  const dropList = await Promise.all(drops
    .filter(drop => drop.chance > 0)
    .map(async drop => {
      return {
        json: await dpapi.getJSONReply(dpapi.types.item.apiName, drop.itemId, apiKey),
        chance: drop.chance,
      };
    })).then(results => {
      return results.map(drop => {
        const itemurl = dpapi.getDBLink(dpapi.types.item.typeName, drop.json.id);
        const droprate = (drop.chance / 100).toString();
        embedReply.embed.fields.push({
          "name": `${drop.json.id} - ${droprate}%`,
          "value": `[**${drop.json.name}**](${itemurl})`,
          "inline": true,
        });
        return drop.json.id;
      }); 
    })
    .catch(err => {
      logger.error(err);
    });

  logger.info("drops:", dropList);
  message.channel.send(embedReply);
};

