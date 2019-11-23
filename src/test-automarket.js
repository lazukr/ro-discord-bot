const tf = require('task-factory'); 
const nvro = require('nova-market-commons');
const taskFactory = new tf.TaskFactory();
const dt = require('data-tables');




const channel = {
  send: (input) => {
    return new Promise((res, rej) => { 
      if (input.length < 2000) {
        console.log(input);
        res("Successfully logged");
      } else {
        rej("error hi");
      }
    })
  },
};

const itemData = {
  id: 9841221,
  name: 'Oridecon012345678901234567890123456789012345678901',
};

const testItem = {
  itemID: itemData.id,
  name: itemData.name,
  ownerid: 'tester',
  filters: {
    'Price': 25000, 
    
  },
};

const props = {
  type: tf.AUTOMARKET,
  ...testItem,
  
};

console.log(props);

const header = {
  Price: 'Price',
  Qty: 'Qty',
  Location: 'Location',
};

const lessThan = {
  Price: '20000',
  Qty: '5',
  Location: 'less-than',
};

const lessThan2 = {
  Price: '21000',
  Qty: '10',
  Location: 'less-than2',
};

const greaterThan = {
  Price: '30000',
  Qty: '10',
  Location: 'greater-than',
};

const greaterThan2 = {
  Price: '40000',
  Qty: '50',
  Location: 'greater-than2',
};

const fillTest = {
  Price: '25000',
  Qty: '1234512345',
  Location: 'hellohellohellohellohellohellohellohellohellohellohellohellohellohellohel',
};

const noResults = {
  error: nvro.ERROR.NO_RESULT,  
  id: itemData.id,
  name: itemData.name,
};

const noFilteredResults = {
  error: nvro.ERROR.NONE,
  table: new dt.MarketTable(header, [
    greaterThan, 
  ]),
  id: itemData.id,
  name: itemData.name, 
};

const noFilteredResults2 = {
  error: nvro.ERROR.NONE,
  table: new dt.MarketTable(header, [
    greaterThan, 
    greaterThan2,
  ]),
  id: itemData.id,
  name: itemData.name, 
};



const filteredResults = {
  error: nvro.ERROR.NONE,
  table: new dt.MarketTable(header, [
    lessThan,
    greaterThan,
  ]),
  id: itemData.id,
  name: itemData.name,
};

const filteredResults2 = {
  error: nvro.ERROR.NONE,
  table: new dt.MarketTable(header, [
    lessThan,
    greaterThan,
    lessThan2,
  ]),
  id: itemData.id,
  name: itemData.name,
};

const filteredResults3 = {
  error: nvro.ERROR.NONE,
  table: new dt.MarketTable(header, [
    lessThan,
    lessThan2,
  ]),
  id: itemData.id,
  name: itemData.name,
};

const fillTestResults = {
  error: nvro.ERROR.NONE,
  table: new dt.MarketTable(header, [
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
    fillTest,
  ]),
  id: itemData.id,
  name: itemData.name,
};

const amTask = taskFactory.getTask(props);

async function test() {
  console.log('\n\n - No Results 1\n\n');
  await amTask.process(channel, noResults);
  console.log('\n\n - No Results 2\n\n');
  await amTask.process(channel, noResults);
  console.log('\n\n - No Filtered Results 1\n\n');
  await amTask.process(channel, noFilteredResults);
  console.log('\n\n - No Filtered Results 2\n\n');
  await amTask.process(channel, noFilteredResults);
  console.log('\n\n - No Filtered Results Alt\n\n');
  await amTask.process(channel, noFilteredResults2);
  console.log('\n\n - Yes Filtered Results 1\n\n');
  await amTask.process(channel, filteredResults);
  console.log('\n\n - Yes Filtered Results 2\n\n');
  await amTask.process(channel, filteredResults);
  console.log('\n\n - Yes Filtered Results Alt 1\n\n');
  await amTask.process(channel, filteredResults2);
  console.log('\n\n - Yes Filtered Results Alt 2\n\n');
  await amTask.process(channel, filteredResults3); 
  console.log('\n\n - No Results 3\n\n');
  await amTask.process(channel, noResults);
  console.log('\n\n - Yes Filtered Results Alt 1\n\n');
  await amTask.process(channel, filteredResults2);
  console.log('\n\n - No Filtered Results 3\n\n');
  await amTask.process(channel, noFilteredResults2);
  console.log('\n\n - No Results 4\n\n');
  await amTask.process(channel, noResults); 
  console.log('\n\n - Fill Test \n\n');
  await amTask.process(channel, fillTestResults);
}
test();
