// Connect to MySQL
const mysql = require('mysql2/promise')

var pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'local_events_hub',
  dateStrings: true,
  connectionLimit: 10
})

async function execute(sql, values) {
  var result = await pool.execute(sql, values)
  return result[0]
}

// Use this one for LIMIT and OFFSET
async function query(sql, values) {
  var result = await pool.query(sql, values)
  return result[0]
}

module.exports = {
  execute: execute,
  query: query
}
