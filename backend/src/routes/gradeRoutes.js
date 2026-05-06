const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  createGrade,
  getGrades,
  approveGrade,
  assignStudentProfileGrade
} = require('../controllers/gradeController');

router.post('/', auth, authorize('coordinator'), createGrade);
router.get('/', auth, getGrades);
router.put('/:id/approve', auth, authorize('registrar'), approveGrade);
router.put('/students/:student_id/profile-grade', auth, authorize('registrar'), assignStudentProfileGrade);

module.exports = router;
