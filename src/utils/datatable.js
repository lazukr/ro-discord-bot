import Logger from './logger';
import Scraper from './scraper';
import { MarketHeaders } from './nvro';


export default class DataTable {
  constructor({
    page,
    table,
    type,
  }) {
    const { header, contents } = Scraper.getTableContent({
      page: page,
      table: table,
      type: type,
    });

    if (header.hasOwnProperty('')) {
      delete header[''];
      contents.forEach(row => {
        delete row[''];
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
    console.log(`This table does not have the column: ${col}`);
    return false;
  } 

  sort(col) {
    if (!this.hasColumn(col)) {
      return this;
    }
    this.contents.sort((a, b) => {
      return a[col] - b[col];
    });
    return this;
  }

  // turns string integers into actual integers
  quantify(col) {
    if (!this.hasColumn(col)) {
      return this;
    }

    this.contents = this.contents.map(row => {
      row[col] = parseInt(row[col].replace(/,|\+g/, ''));
    });
    return this;
  }
};

export class MarketDataTable extends DataTable {
  constructor(config) {
    super(config);
    this.id = config.id;
  }

  processRefine(refine) {
    if (!refine || !refine.length) {
      console.log('No refine specified');
      return this;
    }

    const ref = refine.split('+');
    if (ref[0] === "<") {
      this.contents = this.contents
        .filter(row => {
          return row[MarketHeaders.Refine] 
          <= parseInt(ref[1]);
        });
    }

    this.contents = this.contents
      .filter(row => {
        return row[MarketHeaders.Refine]
        >= parseInt(ref[1]);
      });

    return this;
  }

  processPrice(price) {
    if (!price || !price.length) {
      console.log('No price specified');
      return this;
    }
    
    this.contents = this.contents
      .filter(row => {
        return parseInt(row) <= parseInt(price);
      });

  }

};
