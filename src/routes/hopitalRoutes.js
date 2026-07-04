const express = require('express');
const router = express.Router();
const {
  createHopital, getAllHopitaux, getHopitalById, updateHopital, deleteHopital,
  createTransfert, getAllTransferts,
} = require('../controllers/hopitalController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/', verifyToken, createHopital);
router.get('/', verifyToken, getAllHopitaux);
router.get('/:id', verifyToken, getHopitalById);
router.put('/:id', verifyToken, updateHopital);
router.delete('/:id', verifyToken, deleteHopital);

router.post('/transferts', verifyToken, createTransfert);
router.get('/transferts/all', verifyToken, getAllTransferts);

module.exports = router;
