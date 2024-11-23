## **fastsqli CLI Tool Documentation**

---

### **Overview**

The **fastsqli** library simplifies the management of database schemas and data extraction for MySQL databases. It helps users dynamically create tables, fetch data, and update schema configurations, all within a convenient CLI tool. **fastsqli** facilitates easier handling of SQL databases alongside MongoDB-like model definitions, providing an efficient approach to schema migrations, data extraction, and JSON exports.

---

### **Project Structure**

```
project/
|-- fastsqli/
    |-- createmodel/     # Directory for MongoDB model files that create new SQL tables
    |-- data/            # Holds data tables in JSON format
    |-- schema/          # Contains schema configuration files and models
```

---

### **Directory Breakdown**

#### **`fastsqli/createmodel/`**

This folder contains MongoDB model files, which define the structure of new models. These models are used to automatically generate corresponding tables in the SQL database.

**Example MongoDB model:**

```js
// test.js
const mongoose = require('mongoose');
const testSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true },
        name: { type: String },
        role: { type: String },
    },
    { 
        timestamps: true // MongoDB automatically handles createdAt and updatedAt
    }
);

module.exports = mongoose.model('Test', testSchema);
```

---

#### **`fastsqli/data/`**

This directory holds data tables in JSON format. These JSON files represent data extracted from SQL tables and can be used for exporting or manipulating data in a portable format.

**Example data file:**

```json
// test.json
[
    {
        "id": 1,
        "name": "Mawuli Stephen",
        "role": "Admin"
    }
]
```

---

#### **`fastsqli/schema/`**

Contains schema configuration files that define the structure and relationships of database tables.

**Example schema file (`schema.json`):**

```json
{
    "test": {
        "columns": [
            {
                "column_name": "id",
                "column_type": "int",
                "is_nullable": "NO"
            },
            {
                "column_name": "name",
                "column_type": "varchar",
                "is_nullable": "YES"
            },
            {
                "column_name": "category",
                "column_type": "varchar",
                "is_nullable": "YES"
            },
            {
                "column_name": "createdAt",
                "column_type": "datetime",
                "is_nullable": "YES"
            },
            {
                "column_name": "updatedAt",
                "column_type": "datetime",
                "is_nullable": "YES"
            }
        ],
        "relationships": []
    }
}
```

This file represents a table with its columns, types, nullable attributes, and any relationships (foreign keys).

---

#### **`fastsqli/schema/models/`**

Contains MongoDB-like models for each table, helping structure the schema and assisting in the table creation process.

**Example model for `test` table:**

```js
// test.js
const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    id: { type: 'int', required: true },
    name: { type: 'varchar' },
    category: { type: 'varchar' },
    createdAt: { type: 'datetime' },
    updatedAt: { type: 'datetime' }
}, { timestamps: true });

module.exports = mongoose.model('test', testSchema);
```

---

### **Table Structure Example**

For the `test` table, the structure is as follows:

| **Column Name** | **Type**     | **Attributes**                        |
|-----------------|--------------|---------------------------------------|
| id              | int          | PRIMARY KEY, AUTO_INCREMENT           |
| name            | varchar      |                                       |
| category        | varchar      |                                       |
| createdAt       | datetime     |                                       |
| updatedAt       | datetime     |                                       |

---

### **Features of fastsqli**

1. **Dynamic Table Creation (via Mongoose Models)**
   The `createmodel` directory contains MongoDB-like model definitions that, when executed, will automatically create the corresponding SQL tables in your database.

2. **Schema Representation with `schema.json`**
   The `schema.json` file in the `schema` folder represents your database schema, which includes tables, columns, data types, and relationships. This provides a blueprint for creating or updating your schema in the SQL database.

3. **Data Extraction in JSON Format**
   You can extract data from your SQL tables and save it in JSON format using the scripts in the `data` directory. This functionality is useful for exporting data or generating datasets for further processing.

---

### **Usage**

#### **Installation**

To install **fastsqli**, run the following npm command:

```bash
npm install -g fastsqli
```

Alternatively, you can install it locally within your project:

```bash
npm install --save-dev fastsqli
```

#### **Configuration**

Before using the CLI tool, set up your environment with the necessary database credentials. You can define these credentials using environment variables or specify them directly in the CLI commands.

Create a `.env` file in the root directory of your project to store the database credentials:

```
HOST=localhost
USER=root
PASSWORD=my-secret-password
DATABASE=my_database
```

These values can also be passed as flags in the CLI commands.

#### **CLI Commands**

There are two main commands available: **migrate** and **fetch-data**.

1. **Migrate Command**  
   This command generates or updates the database schema based on the provided configuration files.

   **Usage:**

   ```bash
   fastsqli migrate --baseDir <directory> --host <db_host> --user <db_user> --password <db_password> --database <db_name>
   ```

   **Options:**
   - `--baseDir` or `-b`: Directory for storing schema and data files (default is `fastsqli`).
   - `--host` or `-h`: Database host (default is `localhost`).
   - `--user` or `-u`: Database username.
   - `--password` or `-p`: Database password.
   - `--database` or `-d`: Database name.

   **Example:**

   ```bash
   fastsqli migrate --baseDir ./fastsqli --host localhost --user root --password mysecretpassword --database mydatabase
   ```

   This command will start the schema migration process and generate the necessary schema files.

2. **Fetch Data Command**  
   This command fetches data from the SQL tables and saves it as JSON files in the specified directory.

   **Usage:**

   ```bash
   fastsqli fetch-data --baseDir <directory> --host <db_host> --user <db_user> --password <db_password> --database <db_name>
   ```

   **Options:**
   - `--baseDir` or `-b`: Directory for storing schema and data files (default is `fastsqli`).
   - `--host` or `-h`: Database host (default is `localhost`).
   - `--user` or `-u`: Database username.
   - `--password` or `-p`: Database password.
   - `--database` or `-d`: Database name.

   **Example:**

   ```bash
   fastsqli fetch-data --baseDir ./fastsqli --host localhost --user root --password mysecretpassword --database mydatabase
   ```

   This will fetch the data from all tables in the specified database and save it as JSON files in the given directory.

---

### **Version and Help**

To check the version or get help on the available commands, use the following commands:

```bash
fastsqli --version
fastsqli --help
```