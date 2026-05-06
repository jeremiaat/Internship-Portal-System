const jwt = require('jsonwebtoken');
const { User, Student, Coordinator, Company, Registrar, Application, Supervisor, Internship } = require('../models');
const { Op } = require('sequelize');
const notificationEventEmitter = require('../services/eventEmitter');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '60m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '1d' }
  );
  
  return { accessToken, refreshToken };
};

const getUserProfileData = async (user) => {
  const userData = {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    phone: user.phone,
    created_at: user.created_at
  };

  // Load profile-specific data
  if (user.role === 'student') {
    const student = await Student.findOne({ where: { user_id: user.id } });
    if (student) {
      userData.profile_data = {
        id: student.id,
        student_id: student.student_id,
        department: student.department,
        year_of_study: student.year_of_study,
        gpa: student.gpa,
        credits_completed: student.credits_completed
      };
    }
  } else if (user.role === 'coordinator') {
    const coordinator = await Coordinator.findOne({ where: { user_id: user.id } });
    if (coordinator) {
      userData.profile_data = {
        id: coordinator.id,
        employee_id: coordinator.employee_id,
        department: coordinator.department
      };
    }
  } else if (user.role === 'company') {
    const company = await Company.findOne({ where: { user_id: user.id } });
    if (company) {
      userData.profile_data = {
        id: company.id,
        company_name: company.company_name,
        industry: company.industry,
        address: company.address,
        website: company.website,
        verification_status: company.verification_status
      };
    }
  } else if (user.role === 'registrar') {
    const registrar = await Registrar.findOne({ where: { user_id: user.id } });
    if (registrar) {
      userData.profile_data = {
        id: registrar.id,
        employee_id: registrar.employee_id,
        office_location: registrar.office_location
      };
    }
  }

  return userData;
};

const register = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, phone, role } = req.body;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'Username' : 'Email';
      return res.status(400).json({ error: `${field} already exists. Please choose a different ${field.toLowerCase()}.` });
    }

    const user = await User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      phone: phone || '',
      role: role || 'student'
    });

    // Create role-specific profile
    if (role === 'student') {
      await Student.create({
        user_id: user.id,
        student_id: `STU${String(user.id).padStart(6, '0')}`,
        department: 'Computer Science',
        year_of_study: 1,
        gpa: 0.00,
        credits_completed: 0
      });
    } else if (role === 'coordinator') {
      await Coordinator.create({
        user_id: user.id,
        employee_id: `COORD${String(user.id).padStart(6, '0')}`,
        department: 'Computer Science'
      });
    } else if (role === 'company') {
      await Company.create({
        user_id: user.id,
        company_name: `Company ${user.id}`,
        industry: 'Technology',
        address: '',
        website: '',
        verification_status: 'pending'
      });
    } else if (role === 'registrar') {
      await Registrar.create({
        user_id: user.id,
        employee_id: `REG${String(user.id).padStart(6, '0')}`,
        office_location: 'Main Office'
      });
    }

    const userData = await getUserProfileData(user);
    const tokens = generateTokens(user.id);

    res.status(201).json({
      user: userData,
      access: tokens.accessToken,
      refresh: tokens.refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = await getUserProfileData(user);
    const tokens = generateTokens(user.id);

    res.json({
      user: userData,
      access: tokens.accessToken,
      refresh: tokens.refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const logout = async (req, res) => {
  // In a production environment, you would blacklist the refresh token
  res.json({ message: 'Successfully logged out' });
};

const profile = async (req, res) => {
  try {
    const userData = await getUserProfileData(req.user);
    res.json(userData);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { email, first_name, last_name, phone, department, company_name, industry, address, website } = req.body;
    
    const user = req.user;
    
    // Update user fields
    if (email) user.email = email;
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (phone !== undefined) user.phone = phone;
    
    await user.save();
    
    // Update profile-specific fields
    if (user.role === 'student' && department) {
      const student = await Student.findOne({ where: { user_id: user.id } });
      if (student) {
        student.department = department;
        await student.save();
      }
    } else if (user.role === 'coordinator' && department) {
      const coordinator = await Coordinator.findOne({ where: { user_id: user.id } });
      if (coordinator) {
        coordinator.department = department;
        await coordinator.save();
      }
    } else if (user.role === 'company') {
      const company = await Company.findOne({ where: { user_id: user.id } });
      if (company) {
        if (company_name) company.company_name = company_name;
        if (industry) company.industry = industry;
        if (address) company.address = address;
        if (website !== undefined) company.website = website;
        await company.save();
      }
    }
    
    const userData = await getUserProfileData(user);
    res.json(userData);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    
    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'Both old_password and new_password are required' });
    }
    
    const isValidPassword = await req.user.validatePassword(old_password);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid old password' });
    }
    
    req.user.password = new_password;
    await req.user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const approveCompany = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { action } = req.body;
    
    if (req.user.role !== 'coordinator') {
      return res.status(403).json({ error: 'Only coordinators can approve companies' });
    }
    
    // Get coordinator record for this user
    const coordinator = await Coordinator.findOne({ where: { user_id: req.user.id } });
    if (!coordinator) {
      return res.status(403).json({ error: 'Coordinator profile not found' });
    }
    
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    if (company.verification_status !== 'pending') {
      return res.status(400).json({ error: 'Company has already been processed' });
    }
    
    if (action === 'approve') {
      company.verification_status = 'approved';
      company.verified_by = coordinator.id;
      company.verified_at = new Date();
      await company.save();
      
      // Emit event for notification
      notificationEventEmitter.emit('company:approved', { companyId: company.id, userId: company.user_id });
    } else if (action === 'reject') {
      company.verification_status = 'rejected';
      company.verified_by = coordinator.id;
      company.verified_at = new Date();
      await company.save();
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    res.json(company);
  } catch (error) {
    console.error('Approve company error:', error);
    res.status(500).json({ error: 'Failed to process company approval: ' + error.message });
  }
};

const assignStudentToSupervisor = async (req, res) => {
  try {
    const { application_id, supervisor_id } = req.body;
    
    if (req.user.role !== 'coordinator') {
      return res.status(403).json({ error: 'Only coordinators can assign students to supervisors' });
    }
    
    const application = await Application.findByPk(application_id, {
      include: [{ model: Internship }]
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const supervisor = await Supervisor.findByPk(supervisor_id);
    if (!supervisor) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }
    
    if (supervisor.internship_id !== application.internship_id) {
      return res.status(400).json({ error: 'Supervisor is not assigned to this internship' });
    }
    
    application.status = 'accepted';
    await application.save();
    
    res.json({ message: 'Student assigned to supervisor successfully', application });
  } catch (error) {
    console.error('Assign student to supervisor error:', error);
    res.status(500).json({ error: 'Failed to assign student to supervisor' });
  }
};

const verifyStudentEligibility = async (req, res) => {
  try {
    const { student_id } = req.params;
    
    if (req.user.role !== 'registrar') {
      return res.status(403).json({ error: 'Only registrars can verify academic eligibility' });
    }
    
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Academic eligibility criteria
    const eligibility = {
      is_eligible: true,
      gpa_requirement_met: student.gpa >= 2.0,
      minimum_credits_met: student.credits_completed >= 30,
      academic_standing: student.gpa >= 2.0 ? 'Good Standing' : 'Academic Probation',
      details: {
        current_gpa: student.gpa,
        credits_completed: student.credits_completed,
        department: student.department,
        year_of_study: student.year_of_study
      },
      issues: []
    };
    
    if (student.gpa < 2.0) {
      eligibility.is_eligible = false;
      eligibility.issues.push(`GPA below minimum requirement (Current: ${student.gpa}, Required: 2.0)`);
    }
    
    if (student.credits_completed < 30) {
      eligibility.is_eligible = false;
      eligibility.issues.push(`Insufficient credits completed (Current: ${student.credits_completed}, Required: 30)`);
    }
    
    if (student.year_of_study < 2) {
      eligibility.is_eligible = false;
      eligibility.issues.push(`Student must be at least in 2nd year (Current: ${student.year_of_study})`);
    }
    
    res.json(eligibility);
  } catch (error) {
    console.error('Verify student eligibility error:', error);
    res.status(500).json({ error: 'Failed to verify student eligibility' });
  }
};

const getCompanies = async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    
    if (status) {
      where.verification_status = status;
    }
    
    // Simple query without includes first to test
    const companies = await Company.findAll({
      where,
      order: [['id', 'DESC']]
    });
    
    // Fetch related data separately
    const results = await Promise.all(companies.map(async (company) => {
      const companyData = company.toJSON();
      
      // Get user info
      const user = await User.findByPk(company.user_id, {
        attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'phone', 'created_at']
      });
      
      // Get internships
      const internships = await Internship.findAll({
        where: { company_id: company.id },
        attributes: ['id', 'title', 'status']
      });
      
      companyData.user = user;
      companyData.internships = internships;
      
      return companyData;
    }));
    
    res.json({ results });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies: ' + error.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const { department, year, status } = req.query;
    
    const where = {};
    
    if (department) {
      where.department = department;
    }
    
    if (year) {
      where.year_of_study = year;
    }
    
    const students = await Student.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'phone']
        }
      ],
      order: [['id', 'DESC']]
    });
    
    res.json({ results: students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students: ' + error.message });
  }
};

module.exports = {
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
};
