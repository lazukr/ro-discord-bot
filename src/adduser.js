const storage = require('node-persist');
const logger = require('logger.js')("Add Users...");
const userDir = 'src/userdb';

storage.init({
  dir: userDir, 
});

async function addUser(id, timezone) {
  const existingItem = await storage.getItem(id);
  if (!existingItem) {
    logger.info("Setting id and timezone");
    await storage.setItem(id, timezone);
    return;
  }
  logger.error("This user has already been set");
}

function printAllUsers() {
  storage.forEach(async (datum) => {
    await logger.info(`UserID: ${datum.key}, Timezone: ${datum.value}`);
  });
}

// add your users here
printAllUsers();





