const logger = require('logger.js')('General module: Google Sheets API');
const {google} = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const CRED = require('./credentials.json');
const SCOPE = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_PATH = 'spreadsheets.json';
const TOKEN_PATH = 'token.json'; 

const ERRMSG = Object.freeze({
  NAS: "Please specify an argument.", // no argument specified
  VR: "Value required.",
  ISI: "Invalid sheet name. Not in list",
  SW: "Something is wrong. Either you are not specifying a value or this user cannot be found.",
  NNA: "Could not find name or attendance columns.",
  NU: "Could not find discord username or specified username.",
  UE: "Could not update the spreadsheet.",
});

function msgHandler(msg, reply, block = false) {
  if (!block) {
    msg.channel.send(reply);
  } else {
    msg.channel.send(`\`\`\`${reply}\`\`\``);
  }
  logger.info(reply);
}

async function authorize(cred, cb, args) {
  const {client_secret, client_id, redirect_uris} = cred.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  await fs.readFile(TOKEN_PATH, async (err, token) => {
    if (err) {
      return getNewToken(oAuth2Client, cb);
    }
    oAuth2Client.setCredentials(JSON.parse(token));
    await cb(oAuth2Client, args);
  });
}

async function getNewToken(oAuth2Client, cb, args) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPE,
  });
  
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  rl.question('Enter the code from that page here: ', async (code) => {
    rl.close();
    oAuth2Client.getToken(code, async (err, token) => {
      if (err) {
        return console.error('Error while trying to retrieve access token', err);
      }
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), async (err) => {
        if (err) {
          console.error(err);
        }
        console.log(`Token stored to ${TOKEN_PATH}`);
      });
      await cb(oAuth2Client, args);
    });
  });
}

async function attend(auth, args) {
  const msg = args.message;
  const id = args.sheetId;
  const value = args.value
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
  const username = args.username ?
    args.username.toLowerCase().replace(/^\w/, c => c.toUpperCase()) :
    msg.author.username;
  
  logger.info(`${username}, ${value}`);
  
  const sheets = google.sheets({
    version: 'v4',
    auth,
  });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: 'A:F'
  });

  const rows = response.data.values;
  if (!rows.length) {
    // no data
    const reply = 'No data found.';
    msgHandler(msg, reply);
  } else {
    // yes data
    const header = rows.shift();
    const nameRegex = /^.*name.*$/gi;
    
    const nameIndex = header.findIndex(v => nameRegex.test(v));
    const attendIndex = nameIndex + 1;

    // no corresponding headers
    if (nameIndex === -1) {
      msgHandler(msg, ERRMSG.NNA);
      return;
    }

    // no corresponding username
    const usernameList = rows.map(row => row[nameIndex]);
    const userIndex = usernameList.findIndex(v => v.match(username));
    if (userIndex === -1) {
      msgHandler(msg, ERRMSG.NU);
      return;
    } 
    logger.info(`username: ${username}. Username Index: ${userIndex}. Attendance Index: ${attendIndex}`);
    
    const rq = {
      spreadsheetId: id,
      range: `${numToChar(attendIndex)}${userIndex + 2}`, // +2 because we took out header and counts from 1
      valueInputOption: 'RAW',
      resource: {
        values: [[value]]
      },
    }

    sheets.spreadsheets.values.update(rq, (err, res) => {
      if (err) {
        const reply = `${ERRMSG.UE}: ${err}`;
        msgHandler(msg, reply);
      } else {
        const reply = `Bear has successfully set ${username} attendance to \`${value}\`!`;
        msgHandler(msg, reply);
      }
    });
  }
}

function numToChar(num) {
  return String.fromCharCode(65 + num);
}

function isToFString(string) {
  const regex = /^(yes|no)$/gi;
  return regex.test(string);
}

function getSheets() {
  return JSON.parse(fs.readFileSync(SHEET_PATH));
}

function setSheets(json) {
  fs.writeFileSync(SHEET_PATH, JSON.stringify(json));
}

exports.run = async (bot, msg, args) => {
  logger.info(args);

  if (args.length === 0) {
    msgHandler(msg, ERRMSG.NAS);
    return;
  }
  
  if (args.length === 1) {
    if (args[0] === "--list") {
      const sheetList = getSheets();
      const list = Object.entries(sheetList)
        .map(entry => `${entry[0]}  =>  ${entry[1]}`)
        .join("\n");
      msgHandler(msg, list, true); 
    
    } else {
      msgHandler(msg, ERRMSG.VR);
    }
    return;
  }

  if (args.length ===2 &&
    args[0] === "--remove") {
    const sheetList = getSheets();
    if (sheetList[args[1]]) {
      delete sheetList[args[1]];
      setSheets(sheetList);
      const reply = `Sheet with name ${args[1]} successfully removed.`;
      msgHandler(msg, reply);
    } else {
      const reply = `Could not find specified sheet name ${args[1]} to remove.`;
      msgHandler(msg, reply);
    }
    return;
  }

  if (args.length === 3 &&
      args[0] === "--add") {
    const sheetList = getSheets();
    sheetList[args[1]] = args[2];
    setSheets(sheetList);
    const reply = `Successfully set sheet list ${args[1]} with id ${args[2]}`;
    msgHandler(msg, reply);
    return;
  }

  const sheetList = getSheets();
  const sheetId = sheetList[args[0]];
  const params = {
    message: msg,
    sheetId: sheetId,
  };

  // invalid sheetId
  if (!sheetId) {
    msgHandler(msg, ERRMSG.ISI);
    return;
  }

  // look up using discord name
  if (isToFString(args[1])) {
    params.value = args[1];
    await authorize(CRED, attend, params);

  } else if (isToFString(args[2])) {
  // assume args[1] is the discord name

    params.username = args[1];
    params.value = args[2];
    await authorize(CRED, attend, params);

  } else {
    msgHandler(msg, ERRMSG.SW);
  }
};


exports.info = {
  name: "gsheets",
  alias: "gs",
  category: "general",
  description: "use this to register attendance on a google sheet.",
  usage: "\n\n" +
  "\tList: @gsheets --list\n\n" +
  "\tAdd: @gsheets --add key id, key is the name you want to use to refer to it. Id is the google spreadsheetID\n\n" +
  "\tRemove: @gsheets --remove key\n\n" +
  "\tAttend: @gsheets key [name] yes/no. [name] is optional and when not included will use the sender's discord username.",
};
