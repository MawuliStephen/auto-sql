// pushDataToTable.js

const fs = require('fs');
const path = require('path');

// Ensure directories utility
const { initializeDirectories } = require('../utils');

const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

const ensurePrimaryKeyExists = async (connection, tableName) => {
    const [results] = await connection.query(`
        SELECT COLUMN_NAME, COLUMN_KEY 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE() AND COLUMN_KEY IN ('PRI', 'UNI')
    `, [tableName]);

    if (results.length === 0) {
        throw new Error(`Table ${tableName} must have a primary or unique key.`);
    }
};

/**
 * Pushes data to a specified database table.
 * 
 * @param {Object} connection - Database connection object
 * @param {string} tableName - Name of the table to update
 * @param {string} baseDir - Base directory for data files
 * @param {number} batchSize - Number of rows to insert per batch
 */

const pushDataToTable = async (connection, tableName, baseDir = 'fastsqli', batchSize = 500) => {
    try {
        const { dataPath } = initializeDirectories(baseDir);

        // Ensure the table has a primary/unique key
        await ensurePrimaryKeyExists(connection, tableName);

        const filePath = path.join(dataPath, `${tableName}.json`);
        if (!fs.existsSync(filePath)) {
            console.error(`Data file for table "${tableName}" not found.`);
            return;
        }

        const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (rows.length === 0) {
            console.log(`No data to push for table "${tableName}".`);
            return;
        }

        const [currentData] = await connection.query(`SELECT * FROM ${tableName}`);
        if (JSON.stringify(rows) === JSON.stringify(currentData)) {
            console.log(`Table "${tableName}" is already up-to-date.`);
            return;
        }

        await connection.beginTransaction();

        const chunks = chunkArray(rows, batchSize);
        for (const chunk of chunks) {
            const columns = Object.keys(chunk[0]);
            const values = chunk.map(row => columns.map(col => row[col]));

            const query = `
                INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ?
                ON DUPLICATE KEY UPDATE ${columns.map(col => `${col} = VALUES(${col})`).join(', ')}
            `;
            await connection.query(query, [values]);
        }

        await connection.commit();
        console.log(`Data for table "${tableName}" has been successfully updated.`);
    } catch (error) {
        await connection.rollback();
        console.error(`Error updating table "${tableName}": ${error.message}`);
    }
};

/**
 * Pushes data for all tables in the data directory.
 * 
 * @param {Object} connection - Database connection object
 * @param {string} baseDir - Base directory for data files
 * @param {number} batchSize - Number of rows to insert per batch
 */
const pushDataForAllTables = async (connection, baseDir = 'fastsqli', batchSize = 500) => {
    const { dataPath } = initializeDirectories(baseDir);

    // Get all JSON files in the data directory
    const files = fs.readdirSync(dataPath).filter(file => file.endsWith('.json'));
    if (files.length === 0) {
        console.log('No data files found in the specified directory.');
        return;
    }

    console.log('Pushing data for all tables...');
    for (const file of files) {
        const tableName = path.basename(file, '.json');
        console.log(`Processing table: ${tableName}`);
        await pushDataToTable(connection, tableName, baseDir, batchSize);
    }
    console.log('Data push for all tables completed.');
};

module.exports = { pushDataToTable, pushDataForAllTables };


// const fs = require('fs');
// const path = require('path');

// // Ensure directories utility
// const { initializeDirectories } = require('../utils');

// const chunkArray = (array, size) => {
//     const chunks = [];
//     for (let i = 0; i < array.length; i += size) {
//         chunks.push(array.slice(i, i + size));
//     }
//     return chunks;
// };

// const ensurePrimaryKeyExists = async (connection, tableName) => {
//     const [results] = await connection.query(`
//         SELECT COLUMN_NAME, COLUMN_KEY 
//         FROM INFORMATION_SCHEMA.COLUMNS 
//         WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE() AND COLUMN_KEY IN ('PRI', 'UNI')
//     `, [tableName]);

//     if (results.length === 0) {
//         throw new Error(`Table ${tableName} must have a primary or unique key.`);
//     }
// };

// /**
//  * Pushes data to a specified database table.
//  * 
//  * @param {Object} connection - Database connection object
//  * @param {string} tableName - Name of the table to update
//  * @param {string} baseDir - Base directory for data files
//  * @param {number} batchSize - Number of rows to insert per batch
//  */
// const pushDataToTable = async (connection, tableName, baseDir = 'fastsqli', batchSize = 500) => {
//     try {
//         const { dataPath } = initializeDirectories(baseDir);

//         // Ensure the table has a primary/unique key
//         await ensurePrimaryKeyExists(connection, tableName);

//         // Start a database transaction
//         await connection.beginTransaction();

//         // Path to the JSON file containing the table data
//         const filePath = path.join(dataPath, `${tableName}.json`);
//         if (!fs.existsSync(filePath)) {
//             throw new Error(`Data file for table "${tableName}" not found at path: ${filePath}`);
//         }

//         // Read and parse the data file
//         const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
//         if (rows.length === 0) {
//             console.log(`No data to push for table "${tableName}".`);
//             return;
//         }

//         // Fetch current table data
//         const [currentData] = await connection.query(`SELECT * FROM ${tableName}`);
//         if (JSON.stringify(rows) === JSON.stringify(currentData)) {
//             console.log(`Table "${tableName}" is already up-to-date.`);
//             return;
//         }

//         // Split rows into chunks for batch processing
//         const chunks = chunkArray(rows, batchSize);

//         for (const chunk of chunks) {
//             const columns = Object.keys(chunk[0]);
//             const values = chunk.map(row => columns.map(col => row[col]));

//             const query = `
//                 INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ?
//                 ON DUPLICATE KEY UPDATE ${columns.map(col => `${col} = VALUES(${col})`).join(', ')}
//             `;
//             await connection.query(query, [values]);
//         }

//         // Commit the transaction
//         await connection.commit();
//         console.log(`Data for table "${tableName}" has been successfully updated.`);
//     } catch (error) {
//         // Rollback the transaction in case of an error
//         await connection.rollback();
//         console.error(`Error updating table "${tableName}":`, error.message);
//     }
// };

// module.exports = { pushDataToTable };


// // const fs = require('fs');
// // const path = require('path');

// // const chunkArray = (array, size) => {
// //     const chunks = [];
// //     for (let i = 0; i < array.length; i += size) {
// //         chunks.push(array.slice(i, i + size));
// //     }
// //     return chunks;
// // };

// // const ensurePrimaryKeyExists = async (connection, tableName) => {
// //     const [results] = await connection.query(`
// //         SELECT COLUMN_NAME, COLUMN_KEY 
// //         FROM INFORMATION_SCHEMA.COLUMNS 
// //         WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE() AND COLUMN_KEY IN ('PRI', 'UNI')
// //     `, [tableName]);

// //     if (results.length === 0) {
// //         throw new Error(`Table ${tableName} must have a primary or unique key.`);
// //     }
// // };

// // const pushDataToTable = async (connection, tableName, dataPath, batchSize = 500) => {
// //     try {
// //         await ensurePrimaryKeyExists(connection, tableName);
// //         await connection.beginTransaction();

// //         const filePath = path.join(dataPath, `${tableName}.json`);
// //         if (!fs.existsSync(filePath)) {
// //             throw new Error(`Data file for table ${tableName} not found.`);
// //         }

// //         const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
// //         const [currentData] = await connection.query(`SELECT * FROM ${tableName}`);

// //         if (JSON.stringify(rows) === JSON.stringify(currentData)) {
// //             console.log(`Table ${tableName} is up to date.`);
// //             return;
// //         }

// //         const chunks = chunkArray(rows, batchSize);

// //         for (const chunk of chunks) {
// //             const columns = Object.keys(chunk[0]);
// //             const values = chunk.map(row => columns.map(col => row[col]));

// //             const query = `
// //                 INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ?
// //                 ON DUPLICATE KEY UPDATE ${columns.map(col => `${col} = VALUES(${col})`).join(', ')}
// //             `;
// //             await connection.query(query, [values]);
// //         }

// //         await connection.commit();
// //         console.log(`Data for table ${tableName} has been updated.`);
// //     } catch (error) {
// //         await connection.rollback();
// //         console.error(`Error updating table ${tableName}:`, error.message);
// //     }
// // };

// // module.exports = { pushDataToTable };


// // // const fs = require('fs');
// // // const path = require('path');

// // // const pushDataToTable = async (connection, tableName, dataPath) => {
// // //     const filePath = path.join(dataPath, `${tableName}.json`);
// // //     if (!fs.existsSync(filePath)) {
// // //         throw new Error(`Data file for table ${tableName} not found.`);
// // //     }

// // //     const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// // //     // Fetch current data from the table
// // //     const [currentData] = await connection.query(`SELECT * FROM ${tableName}`);

// // //     // Compare the data
// // //     if (JSON.stringify(rows) === JSON.stringify(currentData)) {
// // //         console.log(`Table ${tableName} is up to date.`);
// // //         return;
// // //     }

// // //     // If data is different, update the table
// // //     for (const row of rows) {
// // //         const columns = Object.keys(row);
// // //         const values = columns.map(col => row[col]);

// // //         // Build the update query
// // //         const updateQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (?) 
// // //                              ON DUPLICATE KEY UPDATE ${columns.map(col => `${col} = VALUES(${col})`).join(', ')}`;
// // //         await connection.query(updateQuery, [values]);
// // //     }

// // //     console.log(`Data for table ${tableName} has been updated.`);
// // // };

// // // module.exports = { pushDataToTable };
