const express = require('express');
const router = express.Router();
// Buraya dikkat! randevuGuncelle ve randevuSil'i eklediğinden emin ol:
const { randevuOlustur, randevulariGetir, randevuGuncelle, randevuSil, doluGunleriGetir } = require('../controllers/randevuController');

router.post('/', randevuOlustur);
router.get('/', randevulariGetir);
router.get('/dolu-gunler', doluGunleriGetir); // Dolu günleri getiren rota
router.put('/:id', randevuGuncelle); // Güncelleme yolu
router.delete('/:id', randevuSil);    // Silme yolu

module.exports = router;
