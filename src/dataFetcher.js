const fs = require('fs');
const path = require('path');
const { initializeDirectories } = require('./utils');

const fetchDataFromTables = async (connection, baseDir = 'auto-sql') => {
    const { dataPath } = initializeDirectories(baseDir);

    const schemaFilePath = path.join(baseDir, 'schema', 'schema.json');
    if (!fs.existsSync(schemaFilePath)) {
        throw new Error('Schema file not found. Please generate it first.');
    }

    const schema = JSON.parse(fs.readFileSync(schemaFilePath, 'utf8'));
    for (const tableName of Object.keys(schema)) {
        const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
        const filePath = path.join(dataPath, `${tableName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(rows, null, 4), 'utf8');
        console.log(`Data saved for table ${tableName} at ${filePath}`);
    }    
};

module.exports = { fetchDataFromTables };

