const nvro = require('nova-market-commons');
const sc = require('scrape-commons');
const market = require('./commands/nova/market');

class Test {
  constructor() {

  }

  async foreverLogin() {
    await sc.login();
    setTimeout(this.foreverLogin.bind(this), 2 * 24 * 60 * 60 * 1000);
  }

}

const message = {
  channel: {
    send: (input) => console.log(input),
  }
}


async function testlogins() {
  let data; 
 
  console.log(market);

  await market.getFromLive(message, 604, 1, {});  
  
  
  
  //data = await nvro.getLiveMarketData(604, 1);
  //console.log(data);
   

  /*
  const test = new Test();
  await test.foreverLogin();
  data = await nvro.getLiveMarketData(22010);
  console.log(data.id, data.name, data.table.contents.length);
  data = await nvro.getLiveMarketData(603);
  console.log(data.id, data.name, data.table.contents.length);
  */
}

testlogins();
