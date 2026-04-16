const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IletisimMesaji = sequelize.define('IletisimMesaji', {
    adSoyad: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    konu: { type: DataTypes.STRING },
    mesaj: { type: DataTypes.TEXT, allowNull: false },
    okunduMu: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = IletisimMesaji;