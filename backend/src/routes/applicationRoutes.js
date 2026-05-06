const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus
} = require('../controllers/applicationController');

router.post('/', auth, authorize('student'), createApplication);
router.get('/', auth, getApplications);
router.get('/:id', auth, getApplicationById);
router.put('/:id/status', auth, authorize('company'), updateApplicationStatus);

module.exports = router;
