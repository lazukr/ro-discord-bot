import Logger from './logger';

const ENTRIES_PER_PAGE = [50, 40, 30, 25, 20, 15, 10, 5, 1];
const WORD_LIMIT = 1950;
const HIGHLIGHT = 'JSON';

export default class PrettyPrinter {
  static tabulate({
    table,
    name,
    supressEntryText,
    page,
  }) {
    const printTable = new Tabulator({
      name: name,
      table: table,
      supressEntryText: supressEntryText,
    });

    if (!printTable.hasResults) {
      const reply = `\`\`\`${HIGHLIGHT}\n` +
      `${name ? name + '\n\n' : ""}` +
      `No results found. :(\n` +
      `\`\`\``;
      return {
        reply: reply,
        result: false,
      };
    }
    return {
      reply: printTable.get(page),
      result: true,
    };
  }    

  static itemInfo({
    info,
    description,
    drops,
    icon,
    image,
    url,
    preview,
  }) {
    const message = {
      title: info.type,
      author: {
        name: `${info["Item ID"]} - ${info.Name}`,
        icon_url: icon,
        url: url,
      },
      thumbnail: {
        url: image,
      },
      description: description,
    };
  
    if (drops.length) {
      const fields = drops.map(drop => {
        return {
          name: drop["Drop Rate"],
          value: `${drop.Id} - ${drop.Name}`,
          inline: true,
        };
      });
  
      message.fields = fields;
    }
  
    if (preview) {
      message.image = {
        url: preview,
      };
    }
    return {
      embed: message, 
    };
  }
  
};

// class for handling pretty printing a table
class Tabulator {
  constructor({
    name,
    table,
    supressEntryText = false,
  }) {
    table.finalize();
    const { header, contents } = table;
    this.originalLength = table.originalLength;
    this.name = name;
    this.suppressEntryText = supressEntryText;
    this.keys = Object.keys(header);
    this.columnWidths = this._getColumnWidths(header, contents); 
    this.header = this._prettify([header, this._getSeparators()]);
    this.contents = this._prettify(contents);
    const { pages, entriesPerPage } = this._paginate();
    this.pages = pages;
    this.entriesPerPage = entriesPerPage;
  }

  get hasResults() {
    return this.contents.length ? true : false;
  }

  // figure out the widths of each column
  _getColumnWidths(header, contents) {
    return this.keys.reduce((acc, cur) => {
      acc[cur] = Math.max(header[cur].length,
        ...(contents.map(row => {
        return row[cur].length;
        })));
      return acc;
    }, {});
  }

  // create separators for headers / contents
  _getSeparators() {
    return this.keys.reduce((acc, cur) => {
      acc[cur] = '-'.repeat(this.columnWidths[cur]);
      return acc;
    }, {});
  }

  // add padding so all columns are properly aligned
  _pad(table) {
    return table.map(row => {
      return this.keys.reduce((acc, cur) => {
        acc[cur] = row[cur].padEnd(this.columnWidths[cur]);
        return acc;
      }, {});
    });  
  }

  // join each row into text
  _prettify(table) {
    const padded = this._pad(table);
    return padded.map(row => {
      return Object.values(row).join('  ');
    });
  }

  // create pages for the table
  _paginate() {
    const rowLength = this.header[0].length + 2;
    const maxTableSize = WORD_LIMIT - rowLength * 4;
    let i = 0;
    while ((ENTRIES_PER_PAGE[i] + 1) * rowLength > maxTableSize) {
      i++;
    }
    const entriesPerPage = ENTRIES_PER_PAGE[i];
    const contents = this.contents.slice(0);
    const pages = [];
    while (contents.length) {
      pages.push(contents.splice(0, entriesPerPage)); 
    }
    return {
      pages: pages,
      entriesPerPage: entriesPerPage, 
    };
  }

  // returns a string that contains the table of the results
  get(page = 1) {
    // count from 0
    page = Math.min(page - 1, this.pages.length - 1);
    let reply = `\`\`\`${HIGHLIGHT}\n` +
      `${this.name ? this.name + '\n\n' : ""}` +
      `${this.header.join('\n')}\n` +
      `${this.pages[page].join('\n')}\n`;

    if (!this.supressEntryText) {
      const startEntry = Math.min(this.contents.length, this.entriesPerPage * page + 1);
      const endEntry = Math.min(this.contents.length, this.entriesPerPage * (page + 1));
      reply += '\n' +
        `Page ${page + 1} of ${this.pages.length}. Entries ${startEntry} to ${endEntry} of ${this.contents.length}.`; 
    }

    if (this.originalLength) {
      reply += ` Total: ${this.originalLength}.`;
    }

    reply += '\`\`\`';
    return reply;
  }

};

