#!/usr/bin/env node

// cli.js

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { connectDB } = require('./db');
const { initializeFastsqli, fetchSchema } = require('./schemaManager');
const { fetchDataFromTables, pushDataFromTables, pushDataToTable } = require('./index');
require('dotenv').config();  // Load environment variables

// Default database config, can be overridden by CLI flags
const DEFAULT_DB_CONFIG = {
    host: process.env.HOST || 'localhost',
    user: process.env.USER || 'root',
    password: process.env.PASSWORD || '',
    database: process.env.DATABASE || '',
};

// Fetch version from package.json for display
const { version } = require('../package.json');

// Helper function to connect to the database and handle errors
const createConnection = async (options) => {
    try {
        const connection = await connectDB({
            host: options.host || DEFAULT_DB_CONFIG.host,
            user: options.user || DEFAULT_DB_CONFIG.user,
            password: options.password || DEFAULT_DB_CONFIG.password,
            database: options.database || DEFAULT_DB_CONFIG.database,
        });
        return connection;
    } catch (error) {
        throw new Error(`Failed to connect to the database: ${error.message}`);
    }
};

// Main function to execute commands
const runCommand = async (command, options) => {
    try {
        const connection = await createConnection(options);

        switch (command) {
            case 'migrate':
                console.log('Starting schema migration...');
                await initializeFastsqli(connection, options.baseDir);
                console.log('Schema migration completed.');
                break;

            case 'fetch':
                console.log('Fetching data from database tables...');
                await fetchDataFromTables(connection, options.table, options.baseDir);
                console.log('Data fetching completed.');
                break;

            case 'push':
                if (!options.table) {
                    console.error('Error: You must specify a table using the -t flag.');
                    process.exit(1);
                }
                if (options.table.toLowerCase() === 'all') {
                    console.log('Pushing data for all tables...');
                    await pushDataFromTables(connection, options.baseDir);
                    console.log('Data push for all tables completed.');
                } else {
                    console.log(`Pushing data to table: ${options.table}`);
                    await pushDataToTable(connection, options.table, options.baseDir);
                    console.log(`Data push to table ${options.table} completed.`);
                }
                break;

            default:
                console.error(`Unknown command: ${command}`);
        }

        await connection.end();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Exit with failure code
    }
};

// Define the CLI options and commands
const defineCommandOptions = (yargs) => {
    return yargs
        .option('baseDir', {
            alias: 'b',
            type: 'string',
            description: 'Base directory for storing schema and data files',
            default: 'fastsqli',
        })
        .option('host', {
            alias: 'h',
            type: 'string',
            description: 'Database host',
        })
        .option('user', {
            alias: 'u',
            type: 'string',
            description: 'Database user',
        })
        .option('password', {
            alias: 'p',
            type: 'string',
            description: 'Database password',
        })
        .option('database', {
            alias: 'd',
            type: 'string',
            description: 'Database name',
        })
        .option('table', {
            alias: 't',
            type: 'string',
            description: 'The table to fetch or push data to. Use "all" for all tables.',
        });
};

// Set up the yargs CLI
yargs(hideBin(process.argv))
    .command(
        'migrate',
        'Generate or update the database schema JSON file',
        defineCommandOptions,
        (argv) => runCommand('migrate', argv)
    )
    .command(
        'fetch',
        'Fetch data from the database',
        defineCommandOptions,
        (argv) => runCommand('fetch', argv)  // Handle the fetch command here
    )
    .command(
        'push',
        'Push data to a specific database table from JSON files',
        defineCommandOptions,
        (argv) => runCommand('push', argv)
    )
    .demandCommand(1, 'Please specify a command to run.')
    .help() // Enable --help flag
    .version(version) // Show version from package.json
    .alias('v', 'version') // Use both --version and -v
    .alias('h', 'help') // Use both --help and -h
    .argv;


// #!/usr/bin/env node

// //cli.js

// const yargs = require('yargs');
// const { hideBin } = require('yargs/helpers');
// const { connectDB } = require('./db');
// const { initializeFastsqli , fetchSchema} = require('./schemaManager');
// const { fetchDataFromTables, pushDataFromTables, pushDataToTable } = require('./index');
// require('dotenv').config();  // Load environment variables

// // Default database config, can be overridden by CLI flags
// const DEFAULT_DB_CONFIG = {
//     host: process.env.HOST || 'localhost',
//     user: process.env.USER || 'root',
//     password: process.env.PASSWORD || '',
//     database: process.env.DATABASE || '',
// };

// // Fetch version from package.json for display
// const { version } = require('../package.json');

// // Helper function to connect to the database and handle errors
// const createConnection = async (options) => {
//     try {
//         const connection = await connectDB({
//             host: options.host || DEFAULT_DB_CONFIG.host,
//             user: options.user || DEFAULT_DB_CONFIG.user,
//             password: options.password || DEFAULT_DB_CONFIG.password,
//             database: options.database || DEFAULT_DB_CONFIG.database,
//         });
//         return connection;
//     } catch (error) {
//         throw new Error(`Failed to connect to the database: ${error.message}`);
//     }
// };

// // Main function to execute commands
// const runCommand = async (command, options) => {
//     try {
//         const connection = await createConnection(options);

//         switch (command) {
//             case 'migrate':
//                 console.log('Starting schema migration...');
//                 await initializeFastsqli(connection, options.baseDir);
//                 console.log('Schema migration completed.');
//                 break;

//             case 'fetch':
//                 console.log('Fetching data from database tables...');
//                 await fetchDataFromTables(connection, options.baseDir);
//                 console.log('Data fetching completed.');
//                 break;
//                 case 'push':
//                     if (!options.table) {
//                         console.error('Error: You must specify a table using the -t flag.');
//                         process.exit(1);
//                     }
                
//                     if (options.table.toLowerCase() === 'all') {
//                         console.log('Pushing data for all tables...');
//                         await pushDataFromTables(connection, options.baseDir);
//                         console.log('Data push for all tables completed.');
//                     } else {
//                         console.log(`Pushing data to table: ${options.table}`);
//                         await pushDataToTable(connection, options.table, options.baseDir);
//                         console.log(`Data push to table ${options.table} completed.`);
//                     }
//                     break;
                
//             default:
//                 console.error(`Unknown command: ${command}`);
//         }

//         await connection.end();
//     } catch (error) {
//         console.error(`Error: ${error.message}`);
//         process.exit(1); // Exit with failure code
//     }
// };

// // Define the CLI options and commands
// const defineCommandOptions = (yargs) => {
//     return yargs
//         .option('baseDir', {
//             alias: 'b',
//             type: 'string',
//             description: 'Base directory for storing schema and data files',
//             default: 'fastsqli',
//         })
//         .option('host', {
//             alias: 'h',
//             type: 'string',
//             description: 'Database host',
//         })
//         .option('user', {
//             alias: 'u',
//             type: 'string',
//             description: 'Database user',
//         })
//         .option('password', {
//             alias: 'p',
//             type: 'string',
//             description: 'Database password',
//         })
//         .option('database', {
//             alias: 'd',
//             type: 'string',
//             description: 'Database name',
//         })
//         .option('table', {
//             alias: 't',
//             type: 'string',
//             description: 'The table to push data to',
//         });
// };

// // Set up the yargs CLI
// yargs(hideBin(process.argv))
//     .command(
//         'migrate',
//         'Generate or update the database schema JSON file',
//         defineCommandOptions,
//         (argv) => runCommand('migrate', argv)
//     )
//     .command(
//         'fetch',
//         'Fetch all data from database tables and save as JSON files',
//         defineCommandOptions,
//         (argv) => runCommand('fetch-data', argv)
//     )
//     .command(
//         'push',
//         'Push data to a specific database table from JSON files',
//         defineCommandOptions,
//         (argv) => runCommand('push', argv)
//     )
//     .demandCommand(1, 'Please specify a command to run.')
//     .help() // Enable --help flag
//     .version(version) // Show version from package.json
//     .alias('v', 'version') // Use both --version and -v
//     .alias('h', 'help') // Use both --help and -h
//     .argv;


// // #!/usr/bin/env node

// // const yargs = require('yargs');
// // const { hideBin } = require('yargs/helpers');
// // const { connectDB } = require('./db');
// // const { initializeFastsqli } = require('./schemaManager');
// // const { connectDB, fetchDataFromTables, pushDataFromTables, pushDataToTable } = require('./index');
// // // const { fetchDataFromTables, } = require('../src/commands/fetchData');
// // // const {  pushDataToTable } = require('../src/commands/pushDataToTable');
// // // const {  pushDataFromTables,  } = require('../src/commands/pushDataFromTables');

// // require('dotenv').config();  // Load environment variables

// // // Default database config, can be overridden by CLI flags
// // const DEFAULT_DB_CONFIG = {
// //     host: process.env.HOST || 'localhost',
// //     user: process.env.USER || 'root',
// //     password: process.env.PASSWORD || '',
// //     database: process.env.DATABASE || '',
// // };

// // // Get version from package.json
// // const packageJson = require('../package.json');
// // const version = packageJson.version; // You can manually update this version or use the one from package.json

// // // Run the command based on the arguments
// // const runCommand = async (command, options) => {
// //     try {
// //         const connection = await connectDB({
// //             host: options.host || DEFAULT_DB_CONFIG.host,
// //             user: options.user || DEFAULT_DB_CONFIG.user,
// //             password: options.password || DEFAULT_DB_CONFIG.password,
// //             database: options.database || DEFAULT_DB_CONFIG.database,
// //         });

// //         switch (command) {
// //             case 'migrate':
// //                 console.log('Starting schema migration...');
// //                 await initializeFastsqli(connection, options.baseDir);
// //                 console.log('Schema migration completed.');
// //                 break;

// //             case 'fetch-data':
// //                 console.log('Fetching data from database tables...');
// //                 await fetchDataFromTables(connection, options.baseDir);
// //                 console.log('Data fetching completed.');
// //                 break;

// //             default:
// //                 console.error(`Unknown command: ${command}`);
// //                 break;
// //         }

// //         await connection.end();
// //     } catch (error) {
// //         console.error('Error:', error.message);
// //     }
// // };

// // // Define the CLI options and commands
// // yargs(hideBin(process.argv))
// //     .command(
// //         'migrate',
// //         'Generate or update the database schema JSON file',
// //         (yargs) => {
// //             yargs
// //                 .option('baseDir', {
// //                     alias: 'b',
// //                     type: 'string',
// //                     description: 'Base directory for storing schema and data files',
// //                     default: 'fastsqli',
// //                 })
// //                 .option('host', {
// //                     alias: 'h',
// //                     type: 'string',
// //                     description: 'Database host',
// //                 })
// //                 .option('user', {
// //                     alias: 'u',
// //                     type: 'string',
// //                     description: 'Database user',
// //                 })
// //                 .option('password', {
// //                     alias: 'p',
// //                     type: 'string',
// //                     description: 'Database password',
// //                 })
// //                 .option('database', {
// //                     alias: 'd',
// //                     type: 'string',
// //                     description: 'Database name',
// //                 });
// //         },
// //         (argv) => runCommand('migrate', argv)
// //     )
// //     .command(
// //         'fetch-data',
// //         'Fetch all data from database tables and save as JSON files',
// //         (yargs) => {
// //             yargs
// //                 .option('baseDir', {
// //                     alias: 'b',
// //                     type: 'string',
// //                     description: 'Base directory for storing schema and data files',
// //                     default: 'fastsqli',
// //                 })
// //                 .option('host', {
// //                     alias: 'h',
// //                     type: 'string',
// //                     description: 'Database host',
// //                 })
// //                 .option('user', {
// //                     alias: 'u',
// //                     type: 'string',
// //                     description: 'Database user',
// //                 })
// //                 .option('password', {
// //                     alias: 'p',
// //                     type: 'string',
// //                     description: 'Database password',
// //                 })
// //                 .option('database', {
// //                     alias: 'd',
// //                     type: 'string',
// //                     description: 'Database name',
// //                 });
// //         },
// //         (argv) => runCommand('fetch-data', argv)
// //     )
// //     .demandCommand(1, 'Please specify a command to run.')
// //     .help() // This enables the --help flag
// //     .version(version) // This enables the --version flag and uses the version from package.json
// //     .alias('v', 'version') // You can use both --version and -v
// //     .alias('h', 'help') // You can use both --help and -h
// //     .argv;
