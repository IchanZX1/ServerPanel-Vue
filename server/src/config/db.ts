import mysql from 'mysql2/promise'
import { env } from './env.js'

export const db = mysql.createPool({
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT, 10),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: parseInt(env.DB_CONNECTION_LIMIT, 10),
  waitForConnections: true,
  queueLimit: 0,
  timezone: '+00:00',           // simpan semua datetime sebagai UTC di MySQL
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
})

export async function testDbConnection(): Promise<void> {
  const conn = await db.getConnection()
  await conn.ping()
  conn.release()
  console.info('[db] MySQL connection pool ready')
}
