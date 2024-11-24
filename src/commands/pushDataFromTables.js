//pushDataFromTables.js

const fs = require('fs');
const path = require('path');
const { pushDataToTable } = require('./pushDataToTable');
const { initializeDirectories } = require('../utils');

/**
 * Push data to specified or all tables.
 * @param {Object} connection - Database connection object.
 * @param {string} targetTable - Name of the target table or 'all' for all tables.
 * @param {string} baseDir - Base directory for data files.
 * @param {number} batchSize - Batch size for data chunks.
 */
const pushDataFromTables = async (connection, targetTable = 'all', baseDir = 'fastsqli', batchSize = 500) => {
    const { dataPath } = initializeDirectories(baseDir);

    // If pushing all tables, gather all data files
    const files = targetTable === 'all'
        ? fs.readdirSync(dataPath).filter(file => file.endsWith('.json'))
        : [`${targetTable}.json`];

    if (files.length === 0) {
        console.log('No data files found for the specified table(s).');
        return;
    }

    if (targetTable === 'all') {
        console.log('Pushing data for all tables...');
    }

    for (const file of files) {
        const tableName = path.basename(file, '.json');

        try {
            console.log(`Pushing data to table: ${tableName}`);
            await pushDataToTable(connection, tableName, baseDir, batchSize);
            console.log(`Data push to table ${tableName} completed.`);
        } catch (error) {
            console.error(`Failed to push data to table "${tableName}": ${error.message}`);
        }
    }

    if (targetTable === 'all') {
        console.log('Data push for all tables completed.');
    }
};

module.exports = { pushDataFromTables };

// const fs = require('fs');
// const path = require('path');
// const { pushDataToTable } = require('./pushDataToTable');
// const { initializeDirectories } = require('../utils');

// const pushDataFromTables = async (connection, baseDir = 'fastsqli') => {
//     const { dataPath } = initializeDirectories(baseDir);

//     const schemaFilePath = path.join(baseDir, 'schema', 'schema.json');
//     if (!fs.existsSync(schemaFilePath)) {
//         throw new Error('Schema file not found. Please generate it first.');
//     }

//     const schema = JSON.parse(fs.readFileSync(schemaFilePath, 'utf8'));

//     // Push data for all tables
//     for (const tableName of Object.keys(schema)) {
//         await pushDataToTable(connection, tableName, dataPath);
//     }
// };

// module.exports = { pushDataFromTables };
