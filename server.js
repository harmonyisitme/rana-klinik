const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config(); // Ortam değişkenlerini en başta yükle
const authMiddleware = require('./middleware/authMiddleware');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/database');

// SQLite Veritabanına bağlan ve tabloları senkronize et
sequelize.sync().then(() => {
    console.log('SQLite veritabanı başarıyla bağlandı.');
}).catch(err => {
    console.error('SQLite bağlantı hatası:', err);
});

const app = express();

// Orta Katmanlar (Middleware)
// Geliştirme ortamında tüm kaynaklara izin verilebilir. Üretimde belirli origin'leri belirtmek daha güvenlidir.
// Üretim ortamında belirli bir frontend URL'sine izin vermek için:
app.use(cors({ origin: process.env.FRONTEND_URL || '*' })); 
// Eğer frontend ve backend aynı Render servisinde ise, '*' veya servisin kendi URL'si kullanılabilir.

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('/logo.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'logo.png'));
});

// --- RATE LIMITING (HIZ SINIRI) ---
// Giriş denemeleri için sınırlayıcı: 15 dakikada maksimum 5 deneme
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 5, // Maksimum 5 istek
    message: { mesaj: 'Çok fazla başarısız giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' }
});

// --- DOSYA YÜKLEME AYARLARI (MULTER) ---
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'frontend', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Dosya ismini benzersiz yap: timestamp + orijinal uzantı
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Boyut Sınırı
    fileFilter: function (req, file, cb) {
        // Sadece resim dosyalarına izin ver
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Güvenlik Uyarısı: Sadece resim dosyaları (jpg, png, webp) yüklenebilir!'));
        }
    }
});

// Dosya Yükleme Rotası
app.post('/api/upload', authMiddleware, (req, res) => {
    upload.single('dosya')(req, res, function (err) {
        if (err) {
            // Multer veya dosya türü hatası
            return res.status(400).json({ mesaj: err.message });
        }
        if (!req.file) return res.status(400).json({ mesaj: 'Dosya seçilmedi.' });
        
        res.status(200).json({ url: `/uploads/${req.file.filename}` });
    });
});

// API Rotaları
app.use('/api/randevular', require('./routes/randevuRoutes'));
app.use('/api/auth', loginLimiter, require('./routes/authRoutes')); // Giriş rotasına sınırlayıcıyı uygula
app.use('/api/blog', require('./routes/blogRoutes'));
app.use('/api/site-ayarlari', require('./routes/siteRoutes'));
app.use('/api/hastalar', require('./routes/hastaRoutes'));
app.use('/api/iletisim', require('./routes/iletisimRoutes'));

// Test Rotası (Ana sayfa artık frontend olacağı için bu rotayı değiştirdik)
app.get('/api-durum', (req, res) => {
    res.send('Rana Klinik Backend Sunucusu Çalışıyor! 🚀');
});

// Global Hata Yakalayıcı (En sonda olmalı)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ mesaj: 'Sunucu tarafında beklenmedik bir hata oluştu.' });
});

const PORT = process.env.PORT || 5501;

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı. 🚀`);
    console.log(`Uygulamayı tarayıcıda açmak için tıklayın: http://localhost:${PORT}`);
});