const express = require('express');
const router = express.Router();
const PrintingController = require('../controllers/printing.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', PrintingController.getAll);
router.get('/my-jobs', checkRole('Printing Operator'), PrintingController.getMyJobs);
router.get('/:id', PrintingController.getById);
router.post('/', 
  checkRole('Admin', 'Director'), 
  PrintingController.create
);
router.patch('/:id/status', 
  checkRole('Admin', 'Director', 'Printing Operator'), 
  PrintingController.updateStatus
);

module.exports = router;