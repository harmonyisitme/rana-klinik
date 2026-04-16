const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Hasta = sequelize.define('Hasta', {
    adSoyad: { type: DataTypes.STRING, allowNull: false },
    tcKimlik: { type: DataTypes.STRING, unique: true },
    telefon: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    cinsiyet: { type: DataTypes.STRING },
    dogumTarihi: { type: DataTypes.DATE },
    kayitTarihi: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = Hasta;