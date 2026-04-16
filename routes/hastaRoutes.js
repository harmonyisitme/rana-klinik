const express = require('express');
const router = express.Router();
const { hastalariGetir, hastaBul, hastaGuncelle, hastaSil } = require('../controllers/hastaController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, hastalariGetir);
router.get('/bul', hastaBul);
router.put('/:id', authMiddleware, hastaGuncelle);
router.delete('/:id', authMiddleware, hastaSil);

module.exports = router;
