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

module.exports = {
  checkIn, checkOut, getMyAttendance, getAttendanceReport,
  requestLeave, getMyLeaves, getStoreLeaves, approveLeave, rejectLeave,
  getEmployees, addEmployee, updateEmployee,
};

