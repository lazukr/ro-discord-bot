import Logger from './logger';
import Scraper from './scraper';
import cheerio from 'cheerio';
import NovaROUtils, { MARKET_COLUMNS } from './nvro';
import { MARKET } from '../commands/automarket';
export default class DataTable {
  constructor({
    header,
    contents,
  }) {

    if (header.hasOwnProperty("")) {
      delete header[""];
      contents.forEach(row => {
        delete row[""];
      });
    }

    this.header = header;
    this.contents = contents;
  }

  get length() {
    return this.contents.length;
  }

  hasColumn(col) {
    if (this.header[col]) {
      return true;
    }
    //Logger.warn(`This table does not have the column: ${col}`);
    return false;
  } 

  sort(col) {
    if (!this.hasColumn(col)) {
      return this;
    }
    this.contents.sort((a, b) => {
      return a[col] - b[col];
    });
  }

  // turns string integers into actual integers
  quantify(col) {
    if (!this.hasColumn(col)) {
      return;
    }

    this.contents = this.contents.map(row => { 
      row[col] = parseInt(row[col].replace(/,|\+g/g, ""));
      return row;
    });
  }

  stringify(col, prefix = "", postfix = "") {
    if (!this.hasColumn(col)) {
      return;
    }

    this.contents = this.contents.map(row => {
      row[col] = `${prefix}${row[col].toLocaleString()}${postfix}`;
      return row;
    });
  }

  finalize() {

  }
};

export class MarketDataTable extends DataTable {
  constructor(config) {
    super(config);
    this.originalLength = super.length;
    this.filters = config.filters;
    this.id = config.id;
    //this.convertAddProps();
    //this.convertItem();
    //this.quantify(MARKET_COLUMNS.PRICE);
    //this.quantify(MARKET_COLUMNS.REFINE);
    //this.quantify(MARKET_COLUMNS.QUANTITY);
    this.sort(MARKET_COLUMNS.PRICE);
    this.processPrice();
    this.processRefine();
    this.processAddProps();

    this.locationfy();
    this.shortenHeaders(MARKET_COLUMNS.REFINE, "rfn");
    this.shortenHeaders(MARKET_COLUMNS.ADDPROPS, "add props");
  }

  shortenHeaders(col, name) {
    if (this.hasColumn(col)) {
      this.header[col] = name;
    }
  }

  processRefine() {
    if (!this.filters.REFINE ||
        !this.header[MARKET_COLUMNS.REFINE]) {
      return;    
    }

    this.contents = this.contents
      .filter(row => {
        return row[MARKET_COLUMNS.REFINE]
        >= parseInt(this.filters.REFINE);
      });
  }

  processPrice() {
    if (!this.filters.PRICE ||
        !this.header[MARKET_COLUMNS.PRICE]) {
      return;
    }

    this.contents = this.contents
      .filter(row => {
        const price = row[MARKET_COLUMNS.PRICE];
        return parseInt(price) <= parseInt(this.filters.PRICE);
      });
  }

  processAddProps() {
    if (!this.filters.ADDPROPS ||
        !this.header[MARKET_COLUMNS.ADDPROPS]) {
      return;
    }

    const addprops = this.filters.ADDPROPS.map(addprop => {
      return addprop.split(',').map(prop => prop.trim());
    });

    this.contents = this.contents.filter(row => {
      const rowprops = row[MARKET_COLUMNS.ADDPROPS]
        .toLowerCase()
        .split(/(?<![Ll]v)\.|,/)
        .map(prop => prop.trim())
        .filter(prop => prop !== "");

      let count = 0;
      const alreadyMatched = [];

      addprops.forEach(addprop => {
        rowprops.some((rowprop, propindex) => {
          const match = addprop.every(ap => {
            return rowprop.includes(ap);
          });
          
          if (match &&
              !alreadyMatched.includes(propindex)) {
            alreadyMatched.push(propindex);
            count++;
            return true;
          }
        });
      });
      return Boolean(count === addprops.length);
    }); 
  }

  finalize() {
    this.stringify(MARKET_COLUMNS.PRICE, "", "z");
    this.stringify(MARKET_COLUMNS.REFINE, "+");
    this.stringify(MARKET_COLUMNS.QUANTITY);
  }

  locationfy() {
    this.contents = this.contents.map(row => {
      const location = row[MARKET_COLUMNS.LOCATION].trim().split(',');
      row[MARKET_COLUMNS.LOCATION] = location[0] == "nova_vend" ? 
        `@sj ${location[1]} ${location[2]}` :
        `@navi ${location[0]} ${location[1]}/${location[2]}`;
      return row;
    });
  }
};
