const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteAyarlari = sequelize.define('SiteAyarlari', {
    logo: { type: DataTypes.STRING, defaultValue: '' },
    favicon: { type: DataTypes.STRING, defaultValue: '' },
    heroGorsel: { type: DataTypes.STRING, defaultValue: '' },
    haritaEmbed: { type: DataTypes.TEXT, defaultValue: '' },
    anaRenk: { type: DataTypes.STRING, defaultValue: '#0056b3' },
    ikincilRenk: { type: DataTypes.STRING, defaultValue: '#e94560' },
    hakkimizda: { type: DataTypes.JSON },
    yasalMetinler: { type: DataTypes.JSON },
    iletisim: { type: DataTypes.JSON },
    calismaSaatleri: { type: DataTypes.JSON },
    sosyalMedya: { type: DataTypes.JSON },
    hizmetler: { type: DataTypes.JSON }
});

module.exports = SiteAyarlari;