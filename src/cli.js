#!/usr/bin/env node

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { connectDB } = require('./db');
const { updateSchema } = require('./schemaManager');
const { fetchDataFromTables } = require('./dataFetcher');
require('dotenv').config();  // Load environment variables

// Default database config, can be overridden by CLI flags
const DEFAULT_DB_CONFIG = {
    host: process.env.HOST || 'localhost',
    user: process.env.USER || 'root',
    password: process.env.PASSWORD || '',
    database: process.env.DATABASE || '',
};

// Get version from package.json
const packageJson = require('../package.json');
const version = packageJson.version; // You can manually update this version or use the one from package.json

// Run the command based on the arguments
const runCommand = async (command, options) => {
    try {
        const connection = await connectDB({
            host: options.host || DEFAULT_DB_CONFIG.host,
            user: options.user || DEFAULT_DB_CONFIG.user,
            password: options.password || DEFAULT_DB_CONFIG.password,
            database: options.database || DEFAULT_DB_CONFIG.database,
        });

        switch (command) {
            case 'migrate':
                console.log('Starting schema migration...');
                await updateSchema(connection, options.baseDir);
                console.log('Schema migration completed.');
                break;

            case 'fetch-data':
                console.log('Fetching data from database tables...');
                await fetchDataFromTables(connection, options.baseDir);
                console.log('Data fetching completed.');
                break;

            default:
                console.error(`Unknown command: ${command}`);
                break;
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
};

// Define the CLI options and commands
yargs(hideBin(process.argv))
    .command(
        'migrate',
        'Generate or update the database schema JSON file',
        (yargs) => {
            yargs
                .option('baseDir', {
                    alias: 'b',
                    type: 'string',
                    description: 'Base directory for storing schema and data files',
                    default: 'auto-sql',
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
                });
        },
        (argv) => runCommand('migrate', argv)
    )
    .command(
        'fetch-data',
        'Fetch all data from database tables and save as JSON files',
        (yargs) => {
            yargs
                .option('baseDir', {
                    alias: 'b',
                    type: 'string',
                    description: 'Base directory for storing schema and data files',
                    default: 'auto-sql',
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
                });
        },
        (argv) => runCommand('fetch-data', argv)
    )
    .demandCommand(1, 'Please specify a command to run.')
    .help() // This enables the --help flag
    .version(version) // This enables the --version flag and uses the version from package.json
    .alias('v', 'version') // You can use both --version and -v
    .alias('h', 'help') // You can use both --help and -h
    .argv;
