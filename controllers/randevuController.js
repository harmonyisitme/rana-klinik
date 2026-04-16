const Randevu = require('../models/Randevu');
const Hasta = require('../models/Hasta');
const SiteAyarlari = require('../models/SiteAyarlari');
const { Op, fn, col } = require('sequelize');

// 1. Yeni Randevu Oluştur
const randevuOlustur = async (req, res) => {
    try {
        const randevuBilgileri = req.body;

        if (!randevuBilgileri.cinsiyet || randevuBilgileri.cinsiyet.trim() === '') {
            return res.status(400).json({ mesaj: 'Cinsiyet alanı zorunludur.' });
        }

        if (!randevuBilgileri.dogumTarihi || randevuBilgileri.dogumTarihi.trim() === '') {
            return res.status(400).json({ mesaj: 'Doğum tarihi alanı zorunludur.' });
        }

        // Telefon numarasını normalize et
        let gelenTel = randevuBilgileri.telefon.replace(/\D/g, '');
        if (gelenTel.startsWith('0')) gelenTel = gelenTel.substring(1);
        const telWithZero = '0' + gelenTel;

        // --- HASTA KAYIT / KONTROL SİSTEMİ ---
        // Sorgu oluştur
        const orConditions = [
            { telefon: gelenTel },
            { telefon: telWithZero }
        ];

        if (randevuBilgileri.tcKimlik && randevuBilgileri.tcKimlik.trim() !== '') {
            orConditions.push({ tcKimlik: randevuBilgileri.tcKimlik });
        }

        let hasta = await Hasta.findOne({
            where: { [Op.or]: orConditions }
        });

        if (!hasta) {
            // Hasta yoksa yeni oluştur
            hasta = await Hasta.create({
                adSoyad: randevuBilgileri.adSoyad,
                telefon: gelenTel, // Standart olarak 0'sız kaydet
                tcKimlik: randevuBilgileri.tcKimlik,
                email: randevuBilgileri.email,
                cinsiyet: randevuBilgileri.cinsiyet,
                dogumTarihi: randevuBilgileri.dogumTarihi
            });
        }

        await Randevu.create({ 
            ...randevuBilgileri, 
            telefon: gelenTel, // Randevuya da temizlenmiş tel kaydet
            hastaId: hasta.id // Sequelize id
        });
        console.log('Yeni randevu başarıyla oluşturuldu:', randevuBilgileri);
        
        res.status(201).json({ mesaj: 'Randevu başarıyla oluşturuldu.' });
    } catch (error) {
        console.error('Randevu oluşturulurken hata:', error);
        res.status(500).json({ mesaj: 'Randevu oluşturulurken hata.', hata: error.message });
    }
};

// 2. Tüm Randevuları Getir
const randevulariGetir = async (req, res) => {
    try {
        const filter = {};
        if (req.query.hastaId) {
            filter.hastaId = req.query.hastaId;
        }
        const randevular = await Randevu.findAll({
            where: filter,
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(randevular);
    } catch (error) {
        res.status(500).json({ mesaj: 'Veriler getirilemedi.' });
    }
};

// 3. Randevu Durumu Güncelle (Yeni eklediğimiz)
const randevuGuncelle = async (req, res) => {
    try {
        const { id } = req.params;
        const { durum, randevuSaati } = req.body;

        const randevu = await Randevu.findByPk(id);
        if (!randevu) {
            return res.status(404).json({ mesaj: 'Randevu bulunamadı.' });
        }

        await randevu.update({ durum, randevuSaati });
        res.status(200).json(randevu);
    } catch (error) {
        res.status(500).json({ mesaj: 'Güncelleme hatası.' });
    }
};

// 4. Randevu Sil (Yeni eklediğimiz)
const randevuSil = async (req, res) => {
    try {
        const { id } = req.params;
        
        const randevu = await Randevu.findByPk(id);
        if (!randevu) {
            return res.status(404).json({ mesaj: 'Randevu bulunamadı.' });
        }

        await randevu.destroy();
        res.status(200).json({ mesaj: 'Randevu başarıyla silindi.' });
    } catch (error) {
        res.status(500).json({ mesaj: 'Silme hatası.' });
    }
};

// 5. Dolu Günleri Getir (Kapasite Kontrolü)
const doluGunleriGetir = async (req, res) => {
    try {
        // Varsayılan kapasite
        let gunlukKapasite = 15;

        // Veritabanından ayarları çekmeye çalış
        try {
            const ayarlar = await SiteAyarlari.findOne();
            if (ayarlar && ayarlar.randevuKapasitesi) {
                gunlukKapasite = ayarlar.randevuKapasitesi;
            }
        } catch (err) {
            console.log("Site ayarları çekilemedi, varsayılan kapasite kullanılıyor.");
        }

        // SQLite Tarih Gruplama İşlemi
        const doluGunler = await Randevu.findAll({
            attributes: [
                [fn('date', col('tarih')), 'gun'],
                [fn('count', col('id')), 'count']
            ],
            where: {
                durum: { [Op.in]: ['Onaylandı', 'Tamamlandı'] }
            },
            group: [fn('date', col('tarih'))],
            having: {
                count: { [Op.gte]: gunlukKapasite }
            }
        });

        res.status(200).json(doluGunler.map(g => g.getDataValue('gun')));
    } catch (error) {
        console.error("Dolu günler hatası:", error);
        res.status(500).json({ mesaj: 'Dolu günler alınamadı.' });
    }
};

// EN ÖNEMLİ KISIM: Export satırı en altta olmalı!
module.exports = { 
    randevuOlustur, 
    randevulariGetir, 
    randevuGuncelle, 
    randevuSil,
    doluGunleriGetir
};
