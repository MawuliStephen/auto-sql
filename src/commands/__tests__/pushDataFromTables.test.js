const fs = require('fs');
const { pushDataFromTables } = require('../pushDataFromTables');
const { pushDataToTable } = require('../pushDataToTable');
const { initializeDirectories } = require('../../utils');

jest.mock('fs');
jest.mock('../pushDataToTable');
jest.mock('../../utils');

describe('pushDataFromTables', () => {
    let mockConnection;

    beforeEach(() => {
        mockConnection = {}; // Mocked database connection object
        initializeDirectories.mockReturnValue({ dataPath: 'mock/data/path' });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should push data to all tables when targetTable is "all"', async () => {
        fs.readdirSync.mockReturnValue(['table1.json', 'table2.json']);
        pushDataToTable.mockResolvedValue();

        await pushDataFromTables(mockConnection, 'all', 'mockBaseDir', 500);

        expect(fs.readdirSync).toHaveBeenCalledWith('mock/data/path');
        expect(pushDataToTable).toHaveBeenCalledTimes(2);
        expect(pushDataToTable).toHaveBeenCalledWith(mockConnection, 'table1', 'mockBaseDir', 500);
        expect(pushDataToTable).toHaveBeenCalledWith(mockConnection, 'table2', 'mockBaseDir', 500);
    });

    test('should push data to a specific table when targetTable is provided', async () => {
        fs.readdirSync.mockReturnValue([]); // Simulate no unrelated files
        pushDataToTable.mockResolvedValue();

        await pushDataFromTables(mockConnection, 'table1', 'mockBaseDir', 500);

        // Verify that specific table data was pushed
        expect(pushDataToTable).toHaveBeenCalledTimes(1);
        expect(pushDataToTable).toHaveBeenCalledWith(mockConnection, 'table1', 'mockBaseDir', 500);
    });

    test('should log a message if no data files are found', async () => {
        fs.readdirSync.mockReturnValue([]); // Simulate no files found
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await pushDataFromTables(mockConnection, 'all', 'mockBaseDir', 500);

        expect(consoleSpy).toHaveBeenCalledWith('No data files found for the specified table(s).');
        expect(pushDataToTable).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    test('should log an error if pushing data to a table fails', async () => {
        fs.readdirSync.mockReturnValue(['table1.json']);
        pushDataToTable.mockRejectedValue(new Error('Test error'));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        await pushDataFromTables(mockConnection, 'all', 'mockBaseDir', 500);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Failed to push data to table "table1": Test error')
        );

        consoleErrorSpy.mockRestore();
    });
});


// const fs = require('fs');
// const { pushDataFromTables } = require('../pushDataFromTables');
// const { pushDataToTable } = require('../pushDataToTable');
// const { initializeDirectories } = require('../../utils');

// jest.mock('fs');
// jest.mock('../pushDataToTable');
// jest.mock('../../utils');

// describe('pushDataFromTables', () => {
//     let mockConnection;

//     beforeEach(() => {
//         mockConnection = {}; // Mocked database connection object
//         initializeDirectories.mockReturnValue({ dataPath: 'mock/data/path' });
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     test('should push data to all tables when targetTable is "all"', async () => {
//         fs.readdirSync.mockReturnValue(['table1.json', 'table2.json']);
//         pushDataToTable.mockResolvedValue();

//         await pushDataFromTables(mockConnection, 'all', 'mockBaseDir', 500);

//         expect(fs.readdirSync).toHaveBeenCalledWith('mock/data/path');
//         expect(pushDataToTable).toHaveBeenCalledTimes(2);
//         expect(pushDataToTable).toHaveBeenCalledWith(mockConnection, 'table1', 'mockBaseDir', 500);
//         expect(pushDataToTable).toHaveBeenCalledWith(mockConnection, 'table2', 'mockBaseDir', 500);
//     });

//     test('should push data to a specific table when targetTable is provided', async () => {
//         fs.readdirSync.mockReturnValue([]);
//         pushDataToTable.mockResolvedValue();

//         await pushDataFromTables(mockConnection, 'table1', 'mockBaseDir', 500);

//         expect(pushDataToTable).toHaveBeenCalledTimes(1);
//         expect(pushDataToTable).toHaveBeenCalledWith(mockConnection, 'table1', 'mockBaseDir', 500);
//     });

//     test('should log a message if no data files are found', async () => {
//         fs.readdirSync.mockReturnValue([]);
//         const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

//         await pushDataFromTables(mockConnection, 'all', 'mockBaseDir', 500);

//         expect(consoleSpy).toHaveBeenCalledWith('No data files found for the specified table(s).');
//         expect(pushDataToTable).not.toHaveBeenCalled();

//         consoleSpy.mockRestore();
//     });

//     test('should log an error if pushing data to a table fails', async () => {
//         fs.readdirSync.mockReturnValue(['table1.json']);
//         pushDataToTable.mockRejectedValue(new Error('Test error'));
//         const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

//         await pushDataFromTables(mockConnection, 'all', 'mockBaseDir', 500);

//         expect(consoleErrorSpy).toHaveBeenCalledWith(
//             expect.stringContaining('Failed to push data to table "table1": Test error')
//         );

//         consoleErrorSpy.mockRestore();
//     });
// });
