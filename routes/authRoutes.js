const express = require('express');
const router = express.Router();

// Yönetici Girişi (POST /api/auth/login)
router.post('/login', (req, res) => {
    const { kullaniciAdi, sifre } = req.body;

    // Gelen bilgileri .env dosyasındaki bilgilerle karşılaştır
    if (kullaniciAdi === process.env.ADMIN_KULLANICI && sifre === process.env.ADMIN_SIFRE) {
        // Doğruysa token gönder (Middleware ile aynı mantıkta)
        const token = process.env.ADMIN_TOKEN || 'rana-admin-gizli-anahtar';
        res.status(200).json({ mesaj: 'Giriş başarılı!', token: token });
    } else {
        // Yanlışsa hata fırlat
        res.status(401).json({ mesaj: 'Kullanıcı adı veya şifre hatalı!' });
    }
});

module.exports = router;
