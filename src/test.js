const fs = require('fs');
const market = require('nova-market-commons');
const dpapi = require('divine-pride-api');
const config = require('./config.json'); 
const mobTestID = 1002;
const logger = require('logger.js')("Test module: ");
const cheerio = require('cheerio');
const rp = require('request-promise');
const url = 'https://www.novaragnarok.com';
const scheduler = require('node-schedule');
const uuidv5 = require('uuid/v5');
const uuidv4 = require('uuid/v4');
const QTY = 'Qty';
const PRICE = 'Price';
const MSG_LIM = 2000;

const market_qs = {
  "module": "vending",
  "action": "item",
};

//const url = dpapi.getAPILink(dpapi.types.mob.apiName, mobTestID);
//console.log(url + `?apiKey=${config.divinePrideToken}`);

//const result = dpapi.getJSONReply(url, config.divinePrideToken);





//console.log(result);

async function testMarket() {
  const itemID = "22010";
  const result = await market.getLiveMarketData(itemID); 
  if (!result.header) {
    return;
  }

  if (result.header[QTY]) {
    result.table = getStringIntsInCol(result.table, QTY);
  }

  result.table = getStringIntsInCol(result.table, PRICE);

  result.table.unshift(result.header);
  paddedTable = formatTable(result.header, result.table);
  
  const rowLength = paddedTable[0].length + 1;
  const numRows = paddedTable.length;

  if (rowLength * numRows < MSG_LIM) {
    console.log(paddedTable.join("\n"));
    return;
  }

  const threshold = MSG_LIM / rowLength;

  const multiMessage = [];
  while(paddedTable.length) {
    multiMessage.push(paddedTable.splice(0, threshold)); 
  }

  multiMessage.forEach(msg => {
    console.log(msg.join("\n"));
  });
  return;
}

// joins every item in the row into one string
function stringifyTable(table) {
  return table.map(row => {
    return Object.values(row).join(' | ');
  }); 
}

// creates a separator to divide the header from
// the actual table content
function getTableSeparator(headerList, padValues) {
  return headerList.reduce((result, value) => {
    result[value] = '-'.repeat(padValues[value]);
    return result;
  }, {});
}

// converts integer columns back to strings
// inserts the commas (,) for thousands separating
function getStringIntsInCol(array, col) {
  return array.map(row => {
    row[col] = row[col].toLocaleString();
    return row;
  });
}

// formats the table to be in a printable form
function formatTable(header, table) {
  const headerList = Object.keys(header);
  const tablePadValues = getDictOfMaxStrInCols(headerList, table);
  const tableSeparator = getTableSeparator(headerList, tablePadValues);
  
  // inserts the header / table separator 
  table.splice(1, 0, tableSeparator);
  const paddedTable = table.map(row => {
    return headerList.reduce((result, value) => {
      result[value] = row[value].padEnd(tablePadValues[value]);
      return result; 
    }, {});  
  });
  return stringifyTable(paddedTable);
}

// gets max string length in each column
// returns as dictionary
function getDictOfMaxStrInCols(headerList, table) {
  return headerList.reduce((result, value) => {
    result[value] = Math.max(...(table.map(col => {
      return col[value].length;
    })));
    return result; 
  }, {});
}

function commandParser(input) {
  return input.split();
}


// ------------------------- SCHEDULER TEST
//

// this denotes a delay in the reminder system
// e.g. *in* 5 hours.
function inDurationDatetime(timeArgs) {
  const remindDate = new Date();
  // time regex object
  const durationRegexObj = {
    second: "\\ssec(ond)?(s)?",
    minute: "\\smin(ute)?(s)?",
    hour:   "\\sh(ou)?r(s)?",
    day:    "\\sday(s)?",
    week:   "\\sw(ee)?k(s)?",
  };
 
  const duration = getDurationObj(durationRegexObj, timeArgs);
  remindDate.setSeconds(remindDate.getSeconds() + duration.second);
  remindDate.setMinutes(remindDate.getMinutes() + duration.minute);
  remindDate.setHours(remindDate.getHours() + duration.hour);
  remindDate.setDate(remindDate.getDate() + duration.day);
  remindDate.setDate(remindDate.getDate() + duration.week * 7);
  return remindDate;
}

function getDurationObj(regexObj, args) {
  
  // any amount of digits, duration does not care
  const inDigitRegex = "\\s\\d+";

  // returns object of the duration result of each time unit.
  // if not found, that time unit will be 0 instead.
  return Object.keys(regexObj)
    .reduce((result, value) => {
      const curExp = new RegExp(inDigitRegex + regexObj[value]);
      const match = args.match(curExp);
      result[value] = match
        ? parseInt(match[0])
        : 0;
      return result;
    }, {});
}



// this denotes a specific datetime for the reminder
// e.g. *at* :3ndex: 2, input: 'in 1 hr' ]
//
function atSpecificDatetime(args) {

}


ARGS = 0;
TIME = 1;
RECUR = 2;


const inRegex = /^[iI][nN]\s/;
const atRegex = /^[aA][tT]\s|^[@]\s/;




function getTaskObj(args) {
  const cmdString = args.join(' ').split(',').map(arg => arg.trim());
  const scheduled = cmdString[TIME]; 

  let remindAt;
  if (inRegex.test(scheduled)) {
    remindAt = inDurationDatetime(scheduled);
  } 

  if (atRegex.test(scheduled)) {
  }
  
  return {
    id: uuidv5(args.join(' '), uuidv4()),
    task: {
      owner: "",
      type: "",
      args: cmdString[ARGS],
      issued: new Date(),
      scheduled: remindAt,
      recur: cmdString[RECUR],
    },
  };



  //const currentReminderList = JSON.parse(fs.readFileSync('./src/schedules.json'));
  //console.log(currentReminderList);
  //fs.writeFileSync('./src/schedules.json', JSON.stringify(list));
}

function readScheduledJSON() {
  const read = fs.readFileSync('./src/schedules.json');
  try {
    return JSON.parse(read);
  } catch (err) {
    return [];
  }
}

function writeScheduledJSON(schedule) {
  fs.writeFileSync('./src/schedules.json', JSON.stringify(schedule));
}

const listArgs = [
  "actual test, in 2 seconds",
  "combined test, in 3 hrs 45 min",
  "combined test, in 5 hrs 23 min",
  "abbreviated hours, in 3 hrs",
  "written hours, in 3 hours",
  "abbreviated hour, in 1 hr",
  "written hour, in 1 hour",
  "abbreviated minutes, in 5 mins",
  "written minutes, in 5 minutes",
  "abbreviated minute, in 1 min",
  "written minute, in 1 minute",
];

function schedulerTest() {
  const currentTaskList = readScheduledJSON();
  
  console.log(currentTaskList);
  const splitArgs = listArgs.map(test => test.split(' '));
  const schedule = splitArgs.map(args => getTaskObj(args));
  console.log(schedule);
  writeScheduledJSON(schedule);
}

schedulerTest();
