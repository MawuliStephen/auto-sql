const fs = require('fs');
const path = require('path'); // Import path module
const { fetchDataFromTables } = require('../fetchData');
const { initializeDirectories } = require('../../utils');

jest.mock('fs');
jest.mock('../../utils');

describe('fetchDataFromTables', () => {
    let mockConnection;

    beforeEach(() => {
        mockConnection = { query: jest.fn() }; // Mocked database connection object
        initializeDirectories.mockReturnValue({ dataPath: path.join('mock', 'data', 'path') });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch data from all tables when targetTable is "all"', async () => {
        fs.existsSync.mockReturnValue(true); // Simulate schema file exists
        fs.readFileSync.mockReturnValue(JSON.stringify({
            table1: {},
            table2: {}
        }));
        mockConnection.query.mockResolvedValueOnce([[{ id: 1, name: 'row1' }]]);
        mockConnection.query.mockResolvedValueOnce([[{ id: 2, name: 'row2' }]]);
        fs.writeFileSync.mockImplementation(() => {});

        await fetchDataFromTables(mockConnection, 'all', 'mockBaseDir');

        expect(fs.existsSync).toHaveBeenCalledWith(path.join('mockBaseDir', 'schema', 'schema.json'));
        expect(mockConnection.query).toHaveBeenCalledTimes(2);
        expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM table1');
        expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM table2');
        expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    test('should fetch data from a specific table when targetTable is provided', async () => {
        fs.existsSync.mockReturnValue(true); // Simulate schema file exists
        fs.readFileSync.mockReturnValue(JSON.stringify({
            table1: {}
        }));
        mockConnection.query.mockResolvedValueOnce([[{ id: 1, name: 'row1' }]]);
        fs.writeFileSync.mockImplementation(() => {});

        await fetchDataFromTables(mockConnection, 'table1', 'mockBaseDir');

        expect(mockConnection.query).toHaveBeenCalledTimes(1);
        expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM table1');
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            path.join('mock', 'data', 'path', 'table1.json'),
            JSON.stringify([{ id: 1, name: 'row1' }], null, 4),
            'utf8'
        );
    });

    test('should throw an error if schema file does not exist', async () => {
        fs.existsSync.mockReturnValue(false); // Simulate schema file missing

        await expect(fetchDataFromTables(mockConnection, 'table1', 'mockBaseDir'))
            .rejects.toThrow('Schema file not found. Please generate it first.');
    });

    test('should log an error if table does not exist in the schema', async () => {
        fs.existsSync.mockReturnValue(true); // Simulate schema file exists
        fs.readFileSync.mockReturnValue(JSON.stringify({}));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await fetchDataFromTables(mockConnection, 'nonExistentTable', 'mockBaseDir');

        expect(consoleSpy).toHaveBeenCalledWith(
            'Table "nonExistentTable" does not exist in the schema.'
        );

        consoleSpy.mockRestore();
    });

    test('should log an error if fetching data for a table fails', async () => {
        fs.existsSync.mockReturnValue(true); // Simulate schema file exists
        fs.readFileSync.mockReturnValue(JSON.stringify({
            table1: {}
        }));
        mockConnection.query.mockRejectedValue(new Error('Test error'));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        await fetchDataFromTables(mockConnection, 'table1', 'mockBaseDir');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to fetch data for table "table1": Test error'
        );

        consoleErrorSpy.mockRestore();
    });

    test('should log a message if no tables are found in the schema', async () => {
        fs.existsSync.mockReturnValue(true); // Simulate schema file exists
        fs.readFileSync.mockReturnValue(JSON.stringify({})); // Empty schema
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await fetchDataFromTables(mockConnection, 'all', 'mockBaseDir');

        expect(consoleLogSpy).toHaveBeenCalledWith(
            'No tables found in the schema for the specified table(s).'
        );

        consoleLogSpy.mockRestore();
    });
});



// const fs = require('fs');
// const path = require('path');
// const { fetchDataFromTables } = require('../../index');
// const { initializeDirectories } = require('../../utils');

// // jest.mock('../../utils');


// // Mocking the initializeDirectories function and fs.readFileSync

// jest.mock('fs');
// jest.mock('../fetchData ');
// jest.mock('path');
// jest.mock('../utils');

// // Mock the connection.query method
// const mockQuery = jest.fn();

// const mockConnection = {
//   query: mockQuery,
// };

// describe('fetchDataFromTables', () => {
//   beforeEach(() => {
//     // Clear mocks before each test
//     jest.clearAllMocks();
//   });

//   it('should throw an error if schema file is not found', async () => {
//     // Mock schema file path not found
//     fs.existsSync.mockReturnValueOnce(false);

//     await expect(fetchDataFromTables(mockConnection, 'someTable')).rejects.toThrow('Schema file not found. Please generate it first.');
//   });

//   it('should log an error if table is not found in the schema', async () => {
//     // Mock schema file found
//     fs.existsSync.mockReturnValueOnce(true);
//     fs.readFileSync.mockReturnValueOnce(JSON.stringify({}));

//     // Mock console.error to capture error messages
//     console.error = jest.fn();

//     await fetchDataFromTables(mockConnection, 'someTable');

//     expect(console.error).toHaveBeenCalledWith('Table "someTable" does not exist in the schema.');
//   });

//   it('should fetch data for the given table and save to file', async () => {
//     // Mock schema file and valid table
//     fs.existsSync.mockReturnValueOnce(true);
//     fs.readFileSync.mockReturnValueOnce(JSON.stringify({
//       someTable: {}
//     }));

//     // Mock query response
//     const mockRows = [{ id: 1, name: 'test' }];
//     mockQuery.mockResolvedValueOnce([mockRows]);

//     // Mock file path for saving data
//     const mockFilePath = '/mock/path/to/data/someTable.json';
//     fs.writeFileSync.mockImplementationOnce((path, data, encoding) => {
//       expect(path).toBe(mockFilePath);
//       expect(data).toBe(JSON.stringify(mockRows, null, 4));
//     });

//     // Mock initializeDirectories to return mock dataPath
//     initializeDirectories.mockReturnValueOnce({ dataPath: '/mock/path/to/data' });

//     // Call the function
//     await fetchDataFromTables(mockConnection, 'someTable');

//     // Check if the file write method was called
//     expect(fs.writeFileSync).toHaveBeenCalled();
//     expect(console.log).toHaveBeenCalledWith('Data saved for table someTable at /mock/path/to/data/someTable.json');
//   });

//   it('should skip fetching data for tables not in the schema', async () => {
//     // Mock schema file found
//     fs.existsSync.mockReturnValueOnce(true);
//     fs.readFileSync.mockReturnValueOnce(JSON.stringify({
//       someOtherTable: {}
//     }));

//     // Mock console.error to capture error messages
//     console.error = jest.fn();

//     // Call the function with a table that doesn't exist in the schema
//     await fetchDataFromTables(mockConnection, 'someTable');

//     // Check if the error for non-existing table is logged
//     expect(console.error).toHaveBeenCalledWith('Table "someTable" does not exist in the schema.');
//   });

//   it('should handle database query failure gracefully', async () => {
//     // Mock schema file and valid table
//     fs.existsSync.mockReturnValueOnce(true);
//     fs.readFileSync.mockReturnValueOnce(JSON.stringify({
//       someTable: {}
//     }));

//     // Mock query failure
//     mockQuery.mockRejectedValueOnce(new Error('Database error'));

//     // Mock initializeDirectories to return mock dataPath
//     initializeDirectories.mockReturnValueOnce({ dataPath: '/mock/path/to/data' });

//     // Mock console.error to capture error messages
//     console.error = jest.fn();

//     // Call the function
//     await fetchDataFromTables(mockConnection, 'someTable');

//     // Check if the error for failed query is logged
//     expect(console.error).toHaveBeenCalledWith('Failed to fetch data for table "someTable": Database error');
//   });
// });
