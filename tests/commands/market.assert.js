import Nova, { MARKET_COLUMNS } from '../../src/utils/nvro';
import NovaMarket, { getFilters } from '../../src/commands/market';
import PrettyPrinter from '../../src/utils/prettyPrinter';
import chalk from 'chalk';


const marketName = 'poring';
const marketId = 2964;

// setup
const bot = {
  prefix: "!",
};

const message = {
  channel: {
    send: (text) => console.log(text),
  }
};

const novamarket = new NovaMarket(bot);

describe(`Running ${chalk.cyan('market')} tests with:`, async () => {


  it('Filter Test. No filters.', async () => {
    const expected = getDefaultFilters({});
    const actual = getFilters([]);
    expect(actual).toEqual(expected);
  });

  it('Filter Test. Refine Only.', async () => {
    const refine = '+7';
    const expected = getDefaultFilters({
      REFINE: 7,
    });
    const actual = getFilters([refine]);
    expect(actual).toEqual(expected);
  });

  it('Filter Test. Price Only k.', async () => {
    const price = '30k';
    const expected = getDefaultFilters({
      PRICE: 30000,
    });
    const actual = getFilters([price]);
    expect(actual).toEqual(expected); 
  });

  it('Filter Test. Price Only m.', async () => {
    const price = '30m';
    const expected = getDefaultFilters({
      PRICE: 30000000,
    });
    const actual = getFilters([price]);
    expect(actual).toEqual(expected);
  });

  it('Filter Test. Price only b.', async () => {
    const price = '3b';
    const expected = getDefaultFilters({
      PRICE: 3000000000,
    });
    const actual = getFilters([price]);
    expect(actual).toEqual(expected);
  });

  it('Filter Test. Add prop filter', async () => {
    const addprop = ["3%", "2%"];
    const expected = getDefaultFilters({
      ADDPROPS: ["3%", "2%"],
    });

    const actual = getFilters(addprop);
    expect(actual).toEqual(expected);
  });
});

function makeArgs(args) {
  return args.join(', ').split(' ');
}

function getDefaultFilters({
  PAGE = 1,
  PRICE = NaN,
  REFINE = NaN,
  ADDPROPS = null,
}) {
  return Object.assign({...MARKET_COLUMNS}, {
    PAGE: PAGE,
    PRICE: PRICE,
    REFINE: REFINE, 
    ADDPROPS: ADDPROPS,
    QUANTITY: null,
    LOCATION: null,
    ITEM: null,
  });
};
