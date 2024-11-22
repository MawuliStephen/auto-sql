// index.js
const { connectDB } = require('./db');
const { updateSchema } = require('./schemaManager');
const { fetchDataFromTables } = require('./dataFetcher');

module.exports = {
    connectDB,
    updateSchema,
    fetchDataFromTables,
};