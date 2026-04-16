const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Blog = sequelize.define('Blog', {
    baslik: { type: DataTypes.STRING, allowNull: false },
    icerik: { type: DataTypes.TEXT, allowNull: false },
    gorselUrl: { type: DataTypes.STRING },
    yazar: { type: DataTypes.STRING, defaultValue: 'Rana Klinik' },
    yayinlandiMi: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = Blog;