const authMiddleware = (req, res, next) => {
    const token = req.headers['x-auth-token'];

    if (!token) {
        return res.status(401).json({ mesaj: 'Yetkisiz erişim. Token bulunamadı.' });
    }

    // Token'ı ortam değişkeninden al, yoksa varsayılanı kullan (Geliştirme için)
    const adminToken = process.env.ADMIN_TOKEN || 'rana-admin-gizli-anahtar';
    if (token === adminToken) {
        next(); // Token doğru, isteğin devam etmesine izin ver
    } else {
        return res.status(401).json({ mesaj: 'Geçersiz token.' });
    }
};

module.exports = authMiddleware;
