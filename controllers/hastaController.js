const Hasta = require('../models/Hasta');

const hastalariGetir = async (req, res) => {
    try {
        const hastalar = await Hasta.findAll({ order: [['kayitTarihi', 'DESC']] });
        res.status(200).json(hastalar);
    } catch (error) {
        res.status(500).json({ mesaj: 'Hastalar getirilemedi.', hata: error.message });
    }
};

// Yeni: Hasta Bul (TC Kimlik ile)
const hastaBul = async (req, res) => {
    try {
        const { tcKimlik } = req.query;
        if (!tcKimlik) {
            return res.status(400).json({ mesaj: 'TC Kimlik numarası gerekli.' });
        }

        // Gelen TC'yi temizle (sadece rakamlar)
        const temizTc = tcKimlik.replace(/\D/g, '');

        const hasta = await Hasta.findOne({ where: { tcKimlik: temizTc } });
        
        if (!hasta) return res.status(404).json({ mesaj: 'Kayıt bulunamadı.' });

        res.status(200).json(hasta);
    } catch (error) {
        res.status(500).json({ mesaj: 'Arama hatası.', hata: error.message });
    }
};

// Hasta Güncelle
const hastaGuncelle = async (req, res) => {
    try {
        const { id } = req.params;
        const hasta = await Hasta.findByPk(id);
        if (!hasta) {
            return res.status(404).json({ mesaj: 'Hasta bulunamadı.' });
        }
        await hasta.update(req.body);
        res.status(200).json({ mesaj: 'Hasta bilgileri güncellendi.', veri: hasta });
    } catch (error) {
        res.status(500).json({ mesaj: 'Güncelleme hatası.', hata: error.message });
    }
};

// Hasta Sil
const hastaSil = async (req, res) => {
    try {
        const { id } = req.params;
        const hasta = await Hasta.findByPk(id);
        if (!hasta) {
            return res.status(404).json({ mesaj: 'Hasta bulunamadı.' });
        }
        await hasta.destroy();
        res.status(200).json({ mesaj: 'Hasta silindi.' });
    } catch (error) {
        res.status(500).json({ mesaj: 'Silme hatası.', hata: error.message });
    }
};

module.exports = { hastalariGetir, hastaBul, hastaGuncelle, hastaSil };
