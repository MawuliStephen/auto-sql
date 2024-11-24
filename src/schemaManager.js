// schemaManager.js
const fs = require('fs');
const path = require('path');
const { initializeDirectories } = require('./utils');
const vm = require('vm');
const mongoose = require('mongoose');


const createTableFromModel = async (connection, modelFilePath) => {
    const modelCode = fs.readFileSync(modelFilePath, 'utf8');
    const script = new vm.Script(modelCode);
    const context = { require, module: {}, mongoose, console }; // Include mongoose in context
    script.runInNewContext(context);

    const model = context.module.exports;
    const schemaDefinition = model.schema.paths;

    const tableName = model.modelName.toLowerCase();

    // Filter out the `__v` and optionally `_id` fields
    const columns = Object.entries(schemaDefinition)
        .filter(([columnName]) => columnName !== '__v' && columnName !== '_id') // Exclude `__v` and `_id`
        .map(([columnName, columnSchema]) => {
            let sqlType;
            switch (columnSchema.instance.toLowerCase()) {
                case 'string':
                    sqlType = 'VARCHAR(255)';
                    break;
                case 'number':
                    sqlType = 'INT';
                    break;
                case 'date':
                    sqlType = 'DATETIME';
                    break;
                case 'boolean':
                    sqlType = 'TINYINT(1)';
                    break;
                default:
                    throw new Error(`Unsupported type for column ${columnName}: ${columnSchema.instance}`);
            }

            const notNull = columnSchema.options?.required ? 'NOT NULL' : '';
            return `\`${columnName}\` ${sqlType} ${notNull}`;
        });

    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            ${columns.join(',\n')}
        );
    `;

    console.log(`Creating table: ${tableName}`);
    await connection.query(createTableSQL);
};

const processCreateModelFiles = async (connection, createmodelPath) => {
    const modelFiles = fs.readdirSync(createmodelPath).filter((file) => file.endsWith('.js'));

    for (const modelFile of modelFiles) {
        const modelFilePath = path.join(createmodelPath, modelFile);
        await createTableFromModel(connection, modelFilePath);
    }
};

//we want a funtion that will the modelpath to create table in the database  if it does exist? 

// const createModelFile = (tableName, columns, modelsPath) => {
//     const modelPath = path.join(modelsPath, `${tableName}.js`);
//     if (fs.existsSync(modelPath)) {
//         console.log(`Model already exists for table: ${tableName}`);
//         return;
//     }

//     // Create Mongoose schema fields from columns
//     const fields = columns.map(col => {
//         let required = col.column_type !== 'VARCHAR' && col.is_nullable === 'NO' ? 'required: true' : '';
//         return `        ${col.column_name}: { type: '${col.column_type}', ${required} }`;
//     }).join(',\n');

//     // Create SQL table representation with aligned columns
//     const tableRepresentation = columns.map(col => {
//         let attributes = col.is_nullable === 'NO' ? 'NOT NULL' : '';
//         if (col.column_name === 'id') {
//             attributes = 'PRIMARY KEY, AUTO_INCREMENT';
//         }
//         // Format the columns for better visual representation
//         return `| ${col.column_name.padEnd(25)}| ${col.column_type.padEnd(10)}| ${attributes.padEnd(20)}|`;
//     }).join('\n');

//     // Construct Mongoose model file content
//     const modelContent = `
// const mongoose = require('mongoose');

// const ${tableName}Schema = new mongoose.Schema({
// ${fields}
// }, { timestamps: true });

// module.exports = mongoose.model('${tableName}', ${tableName}Schema);



// /* 
// // ===========================
//     Table: ${tableName}
// // ===========================

// Columns:
// --------------------------------------------------------------
// ${'Column Name'.padEnd(25)}| {'Type'.padEnd(10)}| {'Attributes'.padEnd(20)}
// --------------------------------------------------------------
// ${tableRepresentation}
// --------------------------------------------------------------
// */
//     `;

//     // Write the model file
//     fs.writeFileSync(modelPath, modelContent, 'utf8');
//     console.log(`Model file created for table: ${tableName} at ${modelPath}`);
// };

const createModelFile = (tableName, columns, modelsPath) => {
    const modelPath = path.join(modelsPath, `${tableName}.js`);
    if (fs.existsSync(modelPath)) {
        console.log(`Model already exists for table: ${tableName}`);
        return;
    }

    try {
        // Create Mongoose schema fields from columns
        const fields = columns.map(col => {
            let required = col.column_type !== 'VARCHAR' && col.is_nullable === 'NO' ? 'required: true' : '';
            let mongooseType;
            
            // Correct data type mapping
            switch (col.column_type.toUpperCase()) {
                case 'VARCHAR':
                    mongooseType = 'String';
                    break;
                case 'INT':
                    mongooseType = 'Number'; // Use Number for INT
                    break;
                case 'DATETIME':
                    mongooseType = 'Date';
                    break;
                case 'TINYINT':
                    mongooseType = 'Boolean'; // For TINYINT(1), use Boolean
                    break;
                default:
                    mongooseType = 'String'; // Default to String if the type is unknown
                    break;
            }

            return `        ${col.column_name}: { type: '${mongooseType}', ${required} }`;
        }).join(',\n');

        // Create SQL table representation with aligned columns
        const tableRepresentation = columns.map(col => {
            let attributes = col.is_nullable === 'NO' ? 'NOT NULL' : '';
            if (col.column_name === 'id') {
                attributes = 'PRIMARY KEY, AUTO_INCREMENT';
            }
            return `| ${col.column_name.padEnd(25)}| ${col.column_type.padEnd(10)}| ${attributes.padEnd(20)}|`;
        }).join('\n');

        // Construct Mongoose model file content
        const modelContent = `
const mongoose = require('mongoose');

const ${tableName}Schema = new mongoose.Schema({
${fields}
}, { timestamps: true });

module.exports = mongoose.model('${tableName}', ${tableName}Schema);


/* 
// ===========================
    Table: ${tableName}
// ===========================

Columns:
--------------------------------------------------------------
${'Column Name'.padEnd(25)}| {'Type'.padEnd(10)}| {'Attributes'.padEnd(20)}
--------------------------------------------------------------
${tableRepresentation}
--------------------------------------------------------------
*/
        `;

        // Write the model file
        fs.writeFileSync(modelPath, modelContent, 'utf8');
        console.log(`Model file created for table: ${tableName} at ${modelPath}`);
    } catch (error) {
        console.error(`Error creating model for table ${tableName}:`, error);
    }
};

const fetchSchema = async (connection) => {
    const [rows] = await connection.query(`
        SELECT 
            t.TABLE_NAME AS table_name,
            c.COLUMN_NAME AS column_name,
            c.DATA_TYPE AS column_type,
            c.IS_NULLABLE AS is_nullable,
            fk.REFERENCED_TABLE_NAME AS referenced_table,
            fk.REFERENCED_COLUMN_NAME AS referenced_column
        FROM 
            INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN 
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE fk
            ON c.TABLE_NAME = fk.TABLE_NAME 
            AND c.COLUMN_NAME = fk.COLUMN_NAME 
            AND c.TABLE_SCHEMA = fk.TABLE_SCHEMA
        JOIN 
            INFORMATION_SCHEMA.TABLES t
            ON c.TABLE_NAME = t.TABLE_NAME 
            AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
        WHERE 
            t.TABLE_TYPE = 'BASE TABLE' 
            AND c.TABLE_SCHEMA = DATABASE()
        ORDER BY 
            t.TABLE_NAME, c.ORDINAL_POSITION;
    `);

    const schema = {};
    rows.forEach(row => {
        const { table_name, column_name, column_type, is_nullable, referenced_table, referenced_column } = row;
        if (!schema[table_name]) {
            schema[table_name] = { columns: [], relationships: [] };
        }
        schema[table_name].columns.push({
            column_name,
            column_type,
            is_nullable
        });
        if (referenced_table) {
            schema[table_name].relationships.push({
                column_name,
                referenced_table,
                referenced_column
            });
        }
    });

    return schema;
};

const initializeFastsqli = async (connection, baseDir = 'fastsqli') => {
    const { schemaPath, modelsPath } = initializeDirectories(baseDir);

    // Define the path to the createmodel directory
    const createmodelPath = path.join(baseDir, 'createmodel');

    // Ensure the directory exists
    if (!fs.existsSync(createmodelPath)) {
        fs.mkdirSync(createmodelPath, { recursive: true });
    }

    const schema = await fetchSchema(connection);

    // Save schema.json
    const schemaFilePath = path.join(schemaPath, 'schema.json');
    fs.writeFileSync(schemaFilePath, JSON.stringify(schema, null, 4), 'utf8');
    console.log(`Schema saved to ${schemaFilePath}`);

    // Create models for each table
    for (const [tableName, tableData] of Object.entries(schema)) {
        createModelFile(tableName, tableData.columns, modelsPath);
    }

    // Process files in createmodelPath
    await processCreateModelFiles(connection, createmodelPath);
};

module.exports = { fetchSchema, initializeFastsqli };
// recreateTableFromModels