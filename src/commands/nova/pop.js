const logger = require('logger.js')("Nova Command module: Pop");

const nvro = require('nova-market-commons');

exports.run = async (discordBot, message, args) => {
    const pop = await nvro.getPopulation();
    message.channel.send(`Current population: ${pop}`);
};

exports.info = {
    name: "population",
    alias: "pop",
    category: "Nova",
    description: `Gets the current population on the server.`,
};
