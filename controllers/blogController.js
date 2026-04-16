const Blog = require('../models/Blog');

// 1. Yeni Blog Yazısı Ekle (Admin Paneli İçin)
const blogEkle = async (req, res) => {
    try {
        // Sequelize ile yeni kayıt oluşturma
        const kaydedilenBlog = await Blog.create(req.body);
        res.status(201).json({ mesaj: 'Blog yazısı başarıyla yayınlandı!', veri: kaydedilenBlog });
    } catch (error) {
        res.status(500).json({ mesaj: 'Blog eklenirken hata oluştu.', hata: error.message });
    }
};

// 2. Tüm Blog Yazılarını Getir (Ana Sayfa İçin)
const bloglariGetir = async (req, res) => {
    try {
        // Sayfalama parametreleri (Varsayılan: 1. sayfa, sayfa başı 10 kayıt)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filtreleme: Admin isteği ise hepsini, değilse sadece yayınlananları getir
        const where = {};
        if (req.query.admin !== 'true') {
            where.yayinlandiMi = true;
        }

        // Sequelize ile hem verileri hem de toplam sayıyı getir (findAndCountAll)
        const { count, rows } = await Blog.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            offset: skip,
            limit: limit
        });

        res.status(200).json({
            veri: rows,
            sayfa: page,
            toplamSayfa: Math.ceil(count / limit)
        });
    } catch (error) {
        res.status(500).json({ mesaj: 'Bloglar getirilirken hata oluştu.', hata: error.message });
    }
};

// 3. Blog Yazısını Güncelle
const blogGuncelle = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findByPk(id);
        if (!blog) {
            return res.status(404).json({ mesaj: 'Blog yazısı bulunamadı.' });
        }
        const guncelBlog = await blog.update(req.body);
        res.status(200).json({ mesaj: 'Blog yazısı güncellendi.', veri: guncelBlog });
    } catch (error) {
        res.status(500).json({ mesaj: 'Güncelleme hatası.', hata: error.message });
    }
};

// 4. Blog Yazısını Sil
const blogSil = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findByPk(id);
        if (!blog) {
            return res.status(404).json({ mesaj: 'Blog yazısı bulunamadı.' });
        }
        await blog.destroy();
        res.status(200).json({ mesaj: 'Blog yazısı silindi.' });
    } catch (error) {
        res.status(500).json({ mesaj: 'Silme hatası.', hata: error.message });
    }
};

module.exports = { blogEkle, bloglariGetir, blogGuncelle, blogSil };
