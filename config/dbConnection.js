// const mongoose = require("mongoose");

// const connectDb = async () => {
//     try {

//         const connect = await mongoose.connect(process.env.CONNECTION_STRING);
//         console.log("Database connected:",connect.connection.host,connect.connection.name);
   
//         }
//     catch (err) {
//         console.log(err);
//         process.exit(1);
//     }
// };

// module.exports = connectDb;

const { Pool } = require('pg');

// Set up the pool instance to manage multiple clients
const pool = new Pool({
  user: process.env.PGUSER,      // Use environment variables for sensitive info
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
});

const connectDb = async () => {
  try {
    // Test the connection
    const client = await pool.connect();
    console.log("Connected to PostgreSQL");
    client.release(); // release the connection back to the pool
  } catch (err) {
    console.error("Failed to connect to PostgreSQL:", err);
    process.exit(1); // Exit if unable to connect
  }
};

module.exports = { pool, connectDb };
