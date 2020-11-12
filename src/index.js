require = require("esm")(module);
module.exports = require("./main.js");

process.on('unhandledRejection', error => {
    console.log('Unhandled Promise rejection:', error);
});