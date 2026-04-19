const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Store = require('../models/Store');
const { sendNotification } = require('../utils/notificationService');

// =================== ATTENDANCE ===================

// @desc    Check in
// @route   POST /api/hr/attendance/check-in
// @access  Private (cashier, deliveryGuy, manager)
const checkIn = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      employeeId: req.user._id,
      date: { $gte: today },
    });

    if (existing) {
      res.status(400);
      return next(new Error('Already checked in today'));
    }

    const attendance = await Attendance.create({
      employeeId: req.user._id,
      storeId: req.user.assignedStore || null,
      date: new Date(),
      checkIn: new Date(),
      status: 'present',
    });

    res.status(201).json(attendance);
  } catch (error) { next(error); }
};

// @desc    Check out
// @route   POST /api/hr/attendance/check-out
// @access  Private
const checkOut = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: req.user._id,
      date: { $gte: today },
      checkOut: null,
    });

    if (!attendance) {
      res.status(400);
      return next(new Error('No active check-in found for today'));
    }

    attendance.checkOut = new Date();
    const diff = attendance.checkOut - attendance.checkIn;
    attendance.hoursWorked = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
    if (attendance.hoursWorked >= 8) attendance.overtime = parseFloat((attendance.hoursWorked - 8).toFixed(2));

    await attendance.save();
    res.json(attendance);
  } catch (error) { next(error); }
};

// @desc    Get my attendance records
// @route   GET /api/hr/attendance
// @access  Private
const getMyAttendance = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const filter = { employeeId: req.user._id };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(filter).sort({ date: -1 }).limit(31);
    res.json(records);
  } catch (error) { next(error); }
};

// @desc    Get attendance report for store (manager)
// @route   GET /api/hr/attendance/report
// @access  Private/Manager/Admin
const getAttendanceReport = async (req, res, next) => {
  try {
    const { month, year, storeId } = req.query;
    const filter = {};

    if (storeId) {
      filter.storeId = storeId;
    } else if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) filter.storeId = store._id;
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(filter)
      .populate('employeeId', 'name email role phone')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) { next(error); }
};

// =================== LEAVES ===================

// @desc    Request leave
// @route   POST /api/hr/leaves
// @access  Private
const requestLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      employeeId: req.user._id,
      storeId: req.user.assignedStore || null,
      leaveType: type || 'casual',
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: 'pending',
    });

    res.status(201).json(leave);
  } catch (error) { next(error); }
};

// @desc    Get my leaves
// @route   GET /api/hr/leaves
// @access  Private
const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ employeeId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) { next(error); }
};

// @desc    Get all leaves for store (manager)
// @route   GET /api/hr/leaves/store
// @access  Private/Manager/Admin
const getStoreLeaves = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.storeId) {
      filter.storeId = req.query.storeId;
    } else if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) filter.storeId = store._id;
    }
    if (req.query.status) filter.status = req.query.status;

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) { next(error); }
};

// @desc    Approve leave
// @route   PUT /api/hr/leaves/:id/approve
// @access  Private/Manager/Admin
const approveLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) { res.status(404); return next(new Error('Leave not found')); }

    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    await leave.save();

    // Mark attendance as 'leave' for the period
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      await Attendance.findOneAndUpdate(
        { employeeId: leave.employeeId, date: { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) } },
        { employeeId: leave.employeeId, date: new Date(d), status: 'leave', storeId: leave.storeId },
        { upsert: true }
      );
    }

    // Notify employee
    await sendNotification({
      userId: leave.employeeId,
      type: 'leave_update',
      title: 'Leave Approved ✅',
      message: `Your ${leave.type} leave from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()} has been approved.`,
    });

    res.json(leave);
  } catch (error) { next(error); }
};

// @desc    Reject leave
// @route   PUT /api/hr/leaves/:id/reject
// @access  Private/Manager/Admin
const rejectLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) { res.status(404); return next(new Error('Leave not found')); }

    leave.status = 'rejected';
    leave.rejectionReason = req.body.reason || 'Request denied';
    leave.approvedBy = req.user._id;
    await leave.save();

    await sendNotification({
      userId: leave.employeeId,
      type: 'leave_update',
      title: 'Leave Rejected ❌',
      message: `Your ${leave.type} leave request was rejected. Reason: ${leave.rejectionReason}`,
    });

    res.json(leave);
  } catch (error) { next(error); }
};

// =================== EMPLOYEES ===================

// @desc    Get employees (for manager's store)
// @route   GET /api/hr/employees
// @access  Private/Manager/Admin
const getEmployees = async (req, res, next) => {
  try {
    const filter = { role: { $in: ['cashier', 'deliveryGuy', 'stockEmployee'] } };
    if (req.query.storeId) filter.assignedStore = req.query.storeId;

    // If manager, only show their store's employees
    if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) filter.assignedStore = store._id;
    }

    const employees = await User.find(filter)
      .select('name email phone role assignedStore employeeInfo createdAt')
      .populate('assignedStore', 'name')
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) { next(error); }
};

// @desc    Update employee info
// @route   PUT /api/hr/employees/:id
// @access  Private/Manager/Admin
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) { res.status(404); return next(new Error('Employee not found')); }

    if (req.body.salary !== undefined) employee.employeeInfo.salary = req.body.salary;
    if (req.body.department) employee.employeeInfo.department = req.body.department;
    if (req.body.bankAccount) employee.employeeInfo.bankAccount = req.body.bankAccount;
    if (req.body.bankName) employee.employeeInfo.bankName = req.body.bankName;
    if (req.body.epfNo) employee.employeeInfo.epfNo = req.body.epfNo;
    if (req.body.etfNo) employee.employeeInfo.etfNo = req.body.etfNo;
    if (req.body.assignedStore) employee.assignedStore = req.body.assignedStore;

    await employee.save();
    res.json(employee);
  } catch (error) { next(error); }
};

// @desc    Register new employee (cashier/deliveryGuy)
// @route   POST /api/hr/employees
// @access  Private/Manager/Admin
const addEmployee = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, salary, department, bankAccount, bankName, epfNo, etfNo } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      return next(new Error('Name, email and password are required'));
    }

    if (!['cashier', 'deliveryGuy', 'stockEmployee'].includes(role)) {
      res.status(400);
      return next(new Error('Employee role must be cashier, deliveryGuy or stockEmployee'));
    }

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400);
      return next(new Error('A user with this email already exists'));
    }

    // Get manager's store
    let storeId = req.body.assignedStore;
    if (!storeId && req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) storeId = store._id;
    }

    const employee = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role,
      assignedStore: storeId || undefined,
      employeeInfo: {
        salary: salary || 0,
        department: department || '',
        joinDate: new Date(),
        bankAccount: bankAccount || '',
        bankName: bankName || '',
        epfNo: epfNo || '',
        etfNo: etfNo || '',
      },
    });

    const result = await User.findById(employee._id)
      .select('-password')
      .populate('assignedStore', 'name');

    res.status(201).json(result);
  } catch (error) { next(error); }
};

// =================== BREAKS ===================

const EmployeeBreak = require('../models/EmployeeBreak');

// @desc    Start break
// @route   POST /api/hr/breaks/start
const startBreak = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already on break
    const activeBreak = await EmployeeBreak.findOne({
      employeeId: req.user._id,
      date: { $gte: today },
      breakEnd: null,
    });
    if (activeBreak) {
      res.status(400);
      return next(new Error('You are already on a break'));
    }

    const brk = await EmployeeBreak.create({
      employeeId: req.user._id,
      storeId: req.user.assignedStore || null,
      date: new Date(),
      breakStart: new Date(),
      type: req.body.type || 'short',
    });

    res.status(201).json(brk);
  } catch (error) { next(error); }
};

// @desc    End break
// @route   POST /api/hr/breaks/end
const endBreak = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const brk = await EmployeeBreak.findOne({
      employeeId: req.user._id,
      date: { $gte: today },
      breakEnd: null,
    });

    if (!brk) {
      res.status(400);
      return next(new Error('No active break found'));
    }

    brk.breakEnd = new Date();
    brk.duration = Math.round((brk.breakEnd - brk.breakStart) / 60000); // minutes
    await brk.save();

    res.json(brk);
  } catch (error) { next(error); }
};

// @desc    Get break history
// @route   GET /api/hr/breaks
const getBreakHistory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { employeeId: req.user._id };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const breaks = await EmployeeBreak.find(filter).sort({ date: -1 }).limit(100);
    res.json(breaks);
  } catch (error) { next(error); }
};

// @desc    Get today's active break (if any)
// @route   GET /api/hr/breaks/active
const getActiveBreak = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const brk = await EmployeeBreak.findOne({
      employeeId: req.user._id,
      date: { $gte: today },
      breakEnd: null,
    });
    res.json(brk || null);
  } catch (error) { next(error); }
};

// =================== TARGETS ===================

const EmployeeTarget = require('../models/EmployeeTarget');

// @desc    Create target for employee
// @route   POST /api/hr/targets
const createTarget = async (req, res, next) => {
  try {
    const { employeeId, targetType, targetValue, month, year, bonusAmount, notes } = req.body;

    // Determine store
    let storeId = req.body.storeId;
    if (!storeId && req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) storeId = store._id;
    }

    const target = await EmployeeTarget.create({
      employeeId,
      storeId,
      targetType,
      targetValue,
      month,
      year,
      bonusAmount: bonusAmount || 0,
      notes: notes || '',
      createdBy: req.user._id,
    });

    const populated = await EmployeeTarget.findById(target._id).populate('employeeId', 'name email role');
    res.status(201).json(populated);
  } catch (error) { next(error); }
};

// @desc    Get targets (filtered by store/employee/month)
// @route   GET /api/hr/targets
const getTargets = async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.query;
    const filter = {};

    if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) filter.storeId = store._id;
    }

    if (employeeId) filter.employeeId = employeeId;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const targets = await EmployeeTarget.find(filter)
      .populate('employeeId', 'name email role')
      .sort({ year: -1, month: -1 });

    res.json(targets);
  } catch (error) { next(error); }
};

// @desc    Get my targets (for employee)
// @route   GET /api/hr/targets/me
const getMyTargets = async (req, res, next) => {
  try {
    const now = new Date();
    const targets = await EmployeeTarget.find({
      employeeId: req.user._id,
      $or: [
        { status: 'active' },
        { month: now.getMonth() + 1, year: now.getFullYear() },
      ],
    }).sort({ year: -1, month: -1 });

    res.json(targets);
  } catch (error) { next(error); }
};

// @desc    Update target progress
// @route   PUT /api/hr/targets/:id/progress
const updateTargetProgress = async (req, res, next) => {
  try {
    const target = await EmployeeTarget.findById(req.params.id);
    if (!target) { res.status(404); return next(new Error('Target not found')); }

    target.achievedValue = req.body.achievedValue || target.achievedValue;
    if (target.achievedValue >= target.targetValue) {
      target.status = 'completed';
    }
    if (req.body.notes) target.notes = req.body.notes;

    await target.save();
    const populated = await EmployeeTarget.findById(target._id).populate('employeeId', 'name email role');
    res.json(populated);
  } catch (error) { next(error); }
};

// @desc    Mark target bonus as paid
// @route   PUT /api/hr/targets/:id/pay-bonus
const payTargetBonus = async (req, res, next) => {
  try {
    const target = await EmployeeTarget.findById(req.params.id);
    if (!target) { res.status(404); return next(new Error('Target not found')); }

    if (target.status !== 'completed') {
      res.status(400);
      return next(new Error('Can only pay bonus for completed targets'));
    }

    target.bonusPaid = true;
    await target.save();

    await sendNotification({
      userId: target.employeeId,
      type: 'payroll',
      title: 'Bonus Paid! 🎉',
      message: `Your bonus of Rs. ${target.bonusAmount} for meeting your ${target.targetType} target has been processed.`,
    });

    res.json(target);
  } catch (error) { next(error); }
};

// @desc    Get employee performance summary
// @route   GET /api/hr/performance/:employeeId
const getEmployeePerformance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Attendance this month
    const attendance = await Attendance.find({
      employeeId,
      date: { $gte: startOfMonth },
    });
    const totalWorkDays = Math.ceil((now - startOfMonth) / (1000 * 60 * 60 * 24));
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalWorkDays > 0 ? Math.round((presentDays / totalWorkDays) * 100) : 0;

    // Average hours
    const totalHours = attendance.reduce((s, a) => s + (a.totalHours || 0), 0);
    const avgHours = presentDays > 0 ? (totalHours / presentDays).toFixed(1) : 0;

    // Breaks this month
    const breaks = await EmployeeBreak.find({
      employeeId,
      date: { $gte: startOfMonth },
    });
    const totalBreakMinutes = breaks.reduce((s, b) => s + (b.duration || 0), 0);
    const avgBreakMinutes = presentDays > 0 ? Math.round(totalBreakMinutes / presentDays) : 0;

    // Targets
    const targets = await EmployeeTarget.find({
      employeeId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
    const completedTargets = targets.filter(t => t.status === 'completed').length;
    const totalBonusEarned = targets.filter(t => t.status === 'completed').reduce((s, t) => s + (t.bonusAmount || 0), 0);

    // Leaves this month
    const leaves = await Leave.find({
      employeeId,
      startDate: { $gte: startOfMonth },
    });

    const user = await User.findById(employeeId).select('name email role');

    res.json({
      employee: user,
      attendance: {
        presentDays,
        totalWorkDays,
        attendanceRate,
        avgHours: parseFloat(avgHours),
      },
      breaks: {
        totalBreakMinutes,
        avgBreakMinutes,
        breakCount: breaks.length,
      },
      targets: {
        total: targets.length,
        completed: completedTargets,
        inProgress: targets.filter(t => t.status === 'active').length,
        totalBonusEarned,
      },
      leaves: {
        total: leaves.length,
        approved: leaves.filter(l => l.status === 'approved').length,
        pending: leaves.filter(l => l.status === 'pending').length,
      },
    });
  } catch (error) { next(error); }
};

module.exports = {
  checkIn, checkOut, getMyAttendance, getAttendanceReport,
  requestLeave, getMyLeaves, getStoreLeaves, approveLeave, rejectLeave,
  getEmployees, addEmployee, updateEmployee,
  startBreak, endBreak, getBreakHistory, getActiveBreak,
  createTarget, getTargets, getMyTargets, updateTargetProgress, payTargetBonus,
  getEmployeePerformance,
};
