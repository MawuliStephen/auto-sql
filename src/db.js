const mysql = require('mysql2/promise');
const { initializeDirectories } = require('./utils');
const fs = require('fs');
const path = require('path');

// Create tables if they do not exist
const checkAndCreateTables = async (connection, modelsPath) => {
    const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));

    for (const modelFile of modelFiles) {
        const tableName = path.basename(modelFile, '.js');
        const [rows] = await connection.query(`
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = '${tableName}';
        `);

        const tableExists = rows[0]['COUNT(*)'] > 0;
        if (!tableExists) {
            console.log(`Table ${tableName} does not exist. Creating...`);
            // Placeholder: Add logic to parse model file and create table dynamically.
        } else {
            console.log(`Table ${tableName} already exists.`);
        }
    }
};

const connectDB = async ({ host, user, password, database }) => {
    try {
        const connection = await mysql.createConnection({ host, user, password, database });
        console.log('AutoSql connected successfully!');

        const { modelsPath } = initializeDirectories();

        await checkAndCreateTables(connection, modelsPath);

        return connection;
    } catch (error) {
        throw new Error('Failed to connect to database: ' + error.message);
    }
};

module.exports = { connectDB };

