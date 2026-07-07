const express = require('express');
const router = express.Router();
const {
  createHopital, getAllHopitaux, getHopitalById, updateHopital, deleteHopital,
  createTransfert, getAllTransferts, validerTransfert,
} = require('../controllers/hopitalController');
const verifyToken = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

router.get('/', verifyToken, getAllHopitaux);
router.get('/:id', verifyToken, getHopitalById);

// Gestion du reseau d'hopitaux - reservee au super_admin
router.post('/', verifyToken, requireRole(['super_admin']), createHopital);
router.put('/:id', verifyToken, requireRole(['super_admin']), updateHopital);
router.delete('/:id', verifyToken, requireRole(['super_admin']), deleteHopital);

// Transferts - reserves aux medecins
router.post('/transferts', verifyToken, requireRole(['medecin']), createTransfert);
router.get('/transferts/all', verifyToken, getAllTransferts);
router.patch('/transferts/:id/valider', verifyToken, requireRole(['medecin']), validerTransfert);

module.exports = router;
