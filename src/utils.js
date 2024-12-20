// utils.js
const fs = require('fs');
const path = require('path');

const initializeDirectories = (baseDir = 'fastsqli') => {
    // Define the folder structure
    const dataPath = path.join(baseDir, 'data');
    const schemaPath = path.join(baseDir, 'schema');
    const modelsPath = path.join(schemaPath, 'models');
    // const createModelPath = path.join(schemaPath, 'createmodel');

    // Check if directories exist, if not create them
    const directories = [dataPath, schemaPath, modelsPath, ];
    // createModelPath

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    return { dataPath, schemaPath, modelsPath,  };
};

module.exports = { initializeDirectories };
