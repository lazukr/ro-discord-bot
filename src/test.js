const fs = require('fs');
const market = require('./commands/nova/market.js');
const dpapi = require('divine-pride-api');
const config = require('./config.json'); 
const mobTestID = 1002;
const logger = require('logger.js')("Test module: ");
const cheerio = require('cheerio');
const rp = require('request-promise');
const url = 'https://www.novaragnarok.com';
const market_qs = {
  "module": "vending",
  "action": "item",
};

//const url = dpapi.getAPILink(dpapi.types.mob.apiName, mobTestID);
//console.log(url + `?apiKey=${config.divinePrideToken}`);

//const result = dpapi.getJSONReply(url, config.divinePrideToken);





//console.log(result);

async function testGetLink(url, qs, id) {
  const actual_qs = qs;
  actual_qs.id = `${id}`;
  console.log(actual_qs);
   
  const options = {
    method: 'GET',
    uri:    url,
    qs: actual_qs,
    transform: function(body) {
      return cheerio.load(body);
    },
  };

  return rp(options)
    .then($ => {
      return $;
    })
    .catch(error => {
      console.log(`An error occurred: ${error}`);
    });

};


function testMarket(html, func, byFile = true) {
  if (!byFile) {
    const result = func(html);
    console.log(result);
    return;
  }


  fs.readFile(html, 'utf8', (err, html) => {
    if(err) {
      console.log(err);
      return;
    }

    const result = func(cheerio.load(html));
    console.log(result);
     
  });
}



async function test() {
  testMarket('./src/market-result.html', market.getMarketTable);
  testMarket('./src/market-no-result.html', market.getMarketTable);
  const result = await testGetLink(url, market_qs, 6607);
  testMarket(result, market.getMarketTable, false);
}

test();


