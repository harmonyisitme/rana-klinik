const express = require('express');
const router = express.Router();
const { mesajGonder, mesajlariGetir, mesajSil, mesajDurumGuncelle } = require('../controllers/iletisimController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', mesajGonder);
router.get('/', authMiddleware, mesajlariGetir);
router.delete('/:id', authMiddleware, mesajSil);
router.put('/:id', authMiddleware, mesajDurumGuncelle);

module.exports = router;
