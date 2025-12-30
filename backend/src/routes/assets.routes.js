const express = require('express');
const router = express.Router();
const AssetsController = require('../controllers/assets.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', AssetsController.getAll);
router.get('/summary', AssetsController.getSummary);
router.get('/:id', AssetsController.getById);
router.post('/', 
  checkRole('Admin', 'Director', 'Accountant'), 
  AssetsController.create
);
router.put('/:id', 
  checkRole('Admin', 'Director', 'Accountant'), 
  AssetsController.update
);
router.delete('/:id', 
  checkRole('Admin', 'Director'), 
  AssetsController.delete
);

module.exports = router;