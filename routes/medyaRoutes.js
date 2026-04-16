const express = require('express');
const router = express.Router();
const { dosyalariGetir, dosyaSil } = require('../controllers/medyaController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, dosyalariGetir);
router.delete('/:dosyaAdi', authMiddleware, dosyaSil);

module.exports = router;
