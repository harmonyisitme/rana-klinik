const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Randevu = sequelize.define('Randevu', {
    adSoyad: { type: DataTypes.STRING, allowNull: false },
    telefon: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    hizmetTuru: { type: DataTypes.STRING, allowNull: false },
    tarih: { type: DataTypes.DATE, allowNull: false },
    randevuSaati: { type: DataTypes.STRING },
    mesaj: { type: DataTypes.TEXT },
    durum: { type: DataTypes.STRING, defaultValue: 'Bekliyor' },
    hastaId: { type: DataTypes.INTEGER }
});

module.exports = Randevu;