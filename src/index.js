// index.js
const { connectDB } = require('./db');
const { initializeFastsqli } = require('./schemaManager');
const { fetchDataFromTables } = require('./commands/fetchData');
const { pushDataFromTables } = require('./commands/pushDataFromTables'); //All data from tables in data folder
const { pushDataToTable } = require('./commands/pushDataToTable'); // A specified data in the data folder


module.exports = {
    connectDB,
    initializeFastsqli,
    fetchDataFromTables,
    pushDataFromTables, pushDataToTable,
};