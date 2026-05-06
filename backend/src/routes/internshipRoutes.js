const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  createInternship,
  getInternships,
  getInternshipById,
  updateInternship,
  deleteInternship
} = require('../controllers/internshipController');

router.post('/', auth, authorize('company'), createInternship);
router.get('/', auth, getInternships);
router.get('/:id', auth, getInternshipById);
router.put('/:id', auth, authorize('company'), updateInternship);
router.delete('/:id', auth, authorize('company'), deleteInternship);

module.exports = router;
