import { neon } from '@neondatabase/serverless'

// Create a SQL query function using Neon's serverless driver
export const sql = neon(process.env.DATABASE_URL!)
