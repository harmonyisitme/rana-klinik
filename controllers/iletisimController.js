const IletisimMesaji = require('../models/IletisimMesaji');

const mesajGonder = async (req, res) => {
    try {
        await IletisimMesaji.create(req.body);
        res.status(201).json({ mesaj: 'Mesajınız başarıyla iletildi.' });
    } catch (error) {
        console.error('❌ Mesaj kaydetme hatası:', error);
        res.status(500).json({ mesaj: 'Mesaj gönderilemedi.', hata: error.message });
    }
};

// Mesajları Getir
const mesajlariGetir = async (req, res) => {
    try {
        const where = {};
        if (req.query.durum === 'okunmus') {
            where.okunduMu = true;
        } else if (req.query.durum === 'okunmamis') {
            where.okunduMu = false;
        }

        let orderDirection = 'DESC'; // Varsayılan: En yeni en üstte
        if (req.query.sirala === 'eski') {
            orderDirection = 'ASC'; // En eski en üstte
        }

        const mesajlar = await IletisimMesaji.findAll({
            where,
            order: [['createdAt', orderDirection]]
        });
        res.status(200).json(mesajlar);
    } catch (error) {
        res.status(500).json({ mesaj: 'Mesajlar getirilemedi.', hata: error.message });
    }
};

// Mesaj Durumunu Güncelle (Okundu/Okunmadı)
const mesajDurumGuncelle = async (req, res) => {
    try {
        const { id } = req.params;
        const { okunduMu } = req.body;
        const mesaj = await IletisimMesaji.findByPk(id);
        if (!mesaj) {
            return res.status(404).json({ mesaj: 'Mesaj bulunamadı.' });
        }
        await mesaj.update({ okunduMu });
        res.status(200).json({ mesaj: 'Mesaj durumu güncellendi.', veri: mesaj });
    } catch (error) {
        res.status(500).json({ mesaj: 'Güncelleme hatası.', hata: error.message });
    }
};

// Mesaj Sil
const mesajSil = async (req, res) => {
    try {
        const { id } = req.params;
        const mesaj = await IletisimMesaji.findByPk(id);
        if (!mesaj) {
            return res.status(404).json({ mesaj: 'Mesaj bulunamadı.' });
        }
        await mesaj.destroy();
        res.status(200).json({ mesaj: 'Mesaj silindi.' });
    } catch (error) {
        res.status(500).json({ mesaj: 'Silme hatası.', hata: error.message });
    }
};

module.exports = { mesajGonder, mesajlariGetir, mesajSil, mesajDurumGuncelle };
