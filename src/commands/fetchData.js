const fs = require('fs');
const path = require('path');

/**
 * Fetches data from database tables and saves them as JSON files.
 *
 * @param {object} connection - Database connection object.
 * @param {string} targetTable - Table name or "all" for all tables.
 * @param {string} baseDir - Base directory for saving data.
 */
async function fetchDataFromTables(connection, targetTable, baseDir) {
    try {
        const schemaPath = path.join(baseDir, 'schema', 'schema.json');
        if (!fs.existsSync(schemaPath)) {
            console.log('Schema file not found.');
            return;
        }

        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        if (Object.keys(schema).length === 0) {
            console.log('No tables found in the schema for the specified table(s).');
            return;
        }

        const tables = targetTable === 'all'
            ? Object.keys(schema)
            : [targetTable];

        for (const table of tables) {
            const query = `SELECT * FROM ${table}`;
            const [rows] = await connection.query(query);

            const dataPath = path.join(baseDir, 'data', `${table}.json`);
            fs.writeFileSync(dataPath, JSON.stringify(rows, null, 4), 'utf8');
            console.log(`Data saved for table ${table} at ${dataPath}`);
        }
    } catch (error) {
        console.error('An error occurred while fetching data:', error.message);
    }
}

module.exports = { fetchDataFromTables };

// const fs = require('fs');
// const path = require('path');
// const { initializeDirectories } = require('../utils');

// const fetchDataFromTables = async (connection, targetTable, baseDir = 'fastsqli') => {
//     const { dataPath } = initializeDirectories(baseDir);

//     const schemaFilePath = path.join(baseDir, 'schema', 'schema.json');
//     if (!fs.existsSync(schemaFilePath)) {
//         throw new Error('Schema file not found. Please generate it first.');
//     }

//     const schema = JSON.parse(fs.readFileSync(schemaFilePath, 'utf8'));

//     // Determine tables to fetch
//     const tablesToFetch = targetTable === 'all'
//         ? Object.keys(schema)
//         : [targetTable];

//     for (const tableName of tablesToFetch) {
//         if (!schema[tableName]) {
//             console.error(`Table "${tableName}" does not exist in the schema.`);
//             continue;
//         }
//         try {
//             const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
//             const filePath = path.join(dataPath, `${tableName}.json`);
//             fs.writeFileSync(filePath, JSON.stringify(rows, null, 4), 'utf8');
//             console.log(`Data saved for table ${tableName} at ${filePath}`);
//         } catch (error) {
//             console.error(`Failed to fetch data for table "${tableName}": ${error.message}`);
//         }
//     }
// };

// module.exports = { fetchDataFromTables };


// // // fetchData.js

// // const fs = require('fs');
// // const path = require('path');
// // const { initializeDirectories } = require('../utils');

// // const fetchDataFromTables = async (connection, baseDir = 'fastsqli') => {
// //     const { dataPath } = initializeDirectories(baseDir);

// //     const schemaFilePath = path.join(baseDir, 'schema', 'schema.json');
// //     if (!fs.existsSync(schemaFilePath)) {
// //         throw new Error('Schema file not found. Please generate it first.');
// //     }

// //     const schema = JSON.parse(fs.readFileSync(schemaFilePath, 'utf8'));
// //     for (const tableName of Object.keys(schema)) {
// //         const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
// //         const filePath = path.join(dataPath, `${tableName}.json`);
// //         fs.writeFileSync(filePath, JSON.stringify(rows, null, 4), 'utf8');
// //         console.log(`Data saved for table ${tableName} at ${filePath}`);
// //     }    
// // };

// // module.exports = { fetchDataFromTables };

// // //library folder
// // auto-sql
// //     src/
// //     |___ commands
// //         |___fetchData.js
// //         |___ pushDataFromAllTables.js
// //         |____pushDataToTable.js 
// //     |
// //     |___ cli.js 
// //     |
// //     |___ db.js 
// //     |
// //     |___ index.js 
// //     |
// //     |___ schemaManger.js
// // .env
// // .gitignore
// // .package.json
// // README.md