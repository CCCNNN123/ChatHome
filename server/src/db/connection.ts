import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// 先创建数据库连接（不指定数据库）
export async function createDatabaseIfNotExists() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  })

  await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
  await connection.end()
  console.log('Database created or already exists')
}

// 正常的数据库连接池
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function initDatabase() {
  try {
    // 禁用外键检查
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0;')

    // 删除所有可能存在的旧表
    const tablesToDrop = ['room_members', 'room_users', 'messages', 'knowledge_docs', 'rooms', 'users']
    for (const table of tablesToDrop) {
      try {
        await pool.execute(`DROP TABLE IF EXISTS ${table};`)
        console.log(`Dropped table ${table} if existed`)
      } catch (err) {
        console.log(`Could not drop table ${table}:`, (err as Error).message)
      }
    }

    // 先创建不依赖其他表的表
    await pool.execute(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(50),
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await pool.execute(`
      CREATE TABLE rooms (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    // 创建有外键的表
    await pool.execute(`
      CREATE TABLE room_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_room_user (room_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await pool.execute(`
      CREATE TABLE messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        emoji VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await pool.execute(`
      CREATE TABLE knowledge_docs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        chunk_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    // 最后重新启用外键检查
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1;')

    console.log('Database tables recreated successfully')
  } catch (error) {
    // 即使出错也要重新启用外键检查
    try {
      await pool.execute('SET FOREIGN_KEY_CHECKS = 1;')
    } catch {
      console.warn('Could not re-enable foreign key checks')
    }
    console.error('Error initializing database:', error)
    throw error
  }
}
