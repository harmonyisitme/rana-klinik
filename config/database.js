const { Sequelize } = require('sequelize');
const path = require('path');

// SQLite veritabanı bağlantı ayarları
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '../rana_klinik.sqlite'), // Verilerin kaydedileceği dosya
  logging: false // Konsolu SQL sorgularıyla doldurmamak için kapattık
});

module.exports = sequelize;