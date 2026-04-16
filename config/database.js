const { Sequelize } = require('sequelize');
const path = require('path');

// Veritabanı bağlantı ayarları
let sequelize;

if (process.env.DATABASE_URL) {
  // Üretim: PostgreSQL kullan
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // Geliştirme: SQLite kullan
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH || path.join(__dirname, '../rana_klinik.sqlite'),
    logging: false
  });
}

module.exports = sequelize;