/**
 * Run reset_tables_9x13.sql against Supabase (9 rows x 13 columns = 117 tables).
 * Requires DATABASE_URL in .env.local (Supabase: Project Settings > Database > Connection string URI)
 */
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL or SUPABASE_DB_URL in .env.local')
  console.error('Get it from: Supabase Dashboard > Project Settings > Database > Connection string (URI)')
  process.exit(1)
}

async function main() {
  const { Client } = require('pg')
  const client = new Client({ connectionString: DATABASE_URL })
  const sqlPath = path.join(__dirname, '..', 'reset_tables_9x13.sql')
  let sql = fs.readFileSync(sqlPath, 'utf8')
  sql = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  try {
    await client.connect()
    await client.query(sql)
    console.log('Database reset successfully. 117 tables (9 rows x 13 columns) created.')
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
