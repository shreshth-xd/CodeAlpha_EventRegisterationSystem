const { Pool } = require("pg");
require("dotenv").config();

const dbUrl = process.env.DATABASE_URL;

// if (!dbUrl) {
//     console.error("DATABASE_URL is missing!");
// } else {
//     const url = new URL(dbUrl);

//     console.log({
//         protocol: url.protocol,
//         username: url.username,
//         host: url.hostname,
//         port: url.port,
//         database: url.pathname,
//         passwordLength: url.password.length
//     });
// }

const pool = new Pool({
    connectionString: dbUrl
});

module.exports = pool;