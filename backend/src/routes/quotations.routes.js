const express = require('express');
const router = express.Router();
const QuotationsController = require('../controllers/quotations.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', QuotationsController.getAll);
router.get('/:id', QuotationsController.getById);
router.post('/', 
  checkRole('Admin', 'Director', 'Marketing Manager'), 
  QuotationsController.create
);
router.put('/:id', 
  checkRole('Admin', 'Director', 'Marketing Manager'), 
  QuotationsController.update
);

module.exports = router;