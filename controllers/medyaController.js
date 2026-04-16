const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../frontend/uploads');

// Dosyaları Listele
const dosyalariGetir = (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            // Klasör yoksa veya okunamadıysa boş dizi dön
            return res.status(200).json([]);
        }
        
        const fileUrls = files.map(file => ({
            ad: file,
            url: `/uploads/${file}`
        }));
        res.status(200).json(fileUrls);
    });
};

// Dosya Sil
const dosyaSil = (req, res) => {
    const dosyaAdi = req.params.dosyaAdi;
    const dosyaYolu = path.join(uploadDir, dosyaAdi);

    if (fs.existsSync(dosyaYolu)) {
        fs.unlinkSync(dosyaYolu);
        res.status(200).json({ mesaj: 'Dosya silindi.' });
    } else {
        res.status(404).json({ mesaj: 'Dosya bulunamadı.' });
    }
};

module.exports = { dosyalariGetir, dosyaSil };
