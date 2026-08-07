// Debug MySQL connection
// Run: node debug-mysql.js

import mysql from 'mysql2/promise'

const config = {
  host: '45.13.237.80',
  port: 3306,
  user: 'ichanzx',
  password: 'ichan1507',
  database: 'panel_server_v2',
  connectTimeout: 10000,
}

console.log('Connecting to MySQL...')
console.log(`  Host     : ${config.host}:${config.port}`)
console.log(`  User     : ${config.user}`)
console.log(`  Database : ${config.database}`)
console.log('')

async function main() {
  let conn

  // Step 1: test tanpa database
  console.log('[1] Testing connection WITHOUT database...')
  try {
    conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      connectTimeout: config.connectTimeout,
    })
    console.log('    OK - server reachable, credentials valid')
    const [dbs] = await conn.execute('SHOW DATABASES')
    console.log('    Databases visible:', dbs.map(r => r.Database))
    await conn.end()
  } catch (err) {
    console.error('    FAILED:', err.code, '-', err.message)
    if (err.code === 'ECONNREFUSED')  console.error('    -> MySQL port not open / firewall blocking')
    if (err.code === 'ETIMEDOUT')     console.error('    -> Host unreachable or port filtered')
    if (err.code === 'ER_ACCESS_DENIED_ERROR') console.error('    -> Wrong user/password')
    process.exit(1)
  }

  // Step 2: test dengan database
  console.log('')
  console.log('[2] Testing connection WITH database panel_server_v2...')
  try {
    conn = await mysql.createConnection(config)
    console.log('    OK - database accessible')
    const [rows] = await conn.execute('SELECT 1 + 1 AS result')
    console.log('    Query test: SELECT 1+1 =', rows[0].result)
    await conn.end()
  } catch (err) {
    console.error('    FAILED:', err.code, '-', err.message)
    if (err.code === 'ER_DBACCESS_DENIED_ERROR') {
      console.error('    -> Database exists but user has no GRANT on it')
      console.error('    -> Fix: GRANT ALL PRIVILEGES ON panel_server_v2.* TO \'ichanzx\'@\'%\';')
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('    -> Database does not exist')
      console.error('    -> Fix: CREATE DATABASE panel_server_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
    }
    process.exit(1)
  }

  console.log('')
  console.log('All checks passed. MySQL is ready.')
}

main()
