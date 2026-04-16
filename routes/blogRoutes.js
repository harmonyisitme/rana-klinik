const express = require('express');
const router = express.Router();
// Buradaki yolun ../controllers/blogController olduğundan emin olun
const { blogEkle, bloglariGetir, blogGuncelle, blogSil } = require('../controllers/blogController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', bloglariGetir);
router.post('/', authMiddleware, blogEkle);
router.put('/:id', authMiddleware, blogGuncelle);
router.delete('/:id', authMiddleware, blogSil);

module.exports = router;
