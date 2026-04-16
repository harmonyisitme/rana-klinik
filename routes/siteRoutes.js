const express = require('express');
const router = express.Router();
const { ayarlariGetir, ayarlariGuncelle } = require('../controllers/siteController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', ayarlariGetir);
router.put('/', authMiddleware, ayarlariGuncelle);

module.exports = router;
