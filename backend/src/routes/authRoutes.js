const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  profile,
  updateProfile,
  changePassword,
  approveCompany,
  assignStudentToSupervisor,
  verifyStudentEligibility,
  getCompanies,
  getStudents
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', auth, profile);
router.put('/profile/update', auth, updateProfile);
router.post('/change-password', auth, changePassword);
router.get('/companies', auth, authorize('coordinator'), getCompanies);
router.put('/companies/:company_id/approve', auth, authorize('coordinator'), approveCompany);
router.post('/assign-supervisor', auth, authorize('coordinator'), assignStudentToSupervisor);
router.get('/students', auth, authorize('coordinator', 'registrar'), getStudents);
router.get('/students/:student_id/verify-eligibility', auth, authorize('registrar'), verifyStudentEligibility);

module.exports = router;
