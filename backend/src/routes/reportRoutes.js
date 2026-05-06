const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  createReport,
  getReports,
  updateReport,
  submitEvaluation
} = require('../controllers/reportController');

router.post('/', auth, authorize('student'), createReport);
router.get('/', auth, getReports);
router.put('/:id', auth, authorize('student'), updateReport);
router.post('/:report_id/evaluation', auth, submitEvaluation);

module.exports = router;
