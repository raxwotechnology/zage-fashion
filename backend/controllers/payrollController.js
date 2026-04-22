const Payroll = require('../models/Payroll');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationService');
const { salaryPaidEmail, sendEmail } = require('../utils/emailService');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

// Sri Lankan statutory rates
const EPF_EMPLOYEE_RATE = 0.08; // 8% employee contribution
const EPF_EMPLOYER_RATE = 0.12; // 12% employer contribution
const ETF_RATE = 0.03;          // 3% employer contribution

// @desc    Calculate salary for an employee
// @route   POST /api/payroll/calculate
// @access  Private/Manager/Admin
const calculateSalary = async (req, res, next) => {
  try {
    const { employeeId, month, year, allowances = 0, deductions = 0, bonuses = 0 } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) { res.status(404); return next(new Error('Employee not found')); }

    const basicSalary = employee.employeeInfo?.salary || 0;
    if (!basicSalary) {
      res.status(400);
      return next(new Error('Employee salary not set'));
    }

    const grossSalary = basicSalary + allowances + bonuses;
    const epfEmployee = parseFloat((basicSalary * EPF_EMPLOYEE_RATE).toFixed(2));
    const epfEmployer = parseFloat((basicSalary * EPF_EMPLOYER_RATE).toFixed(2));
    const etfEmployer = parseFloat((basicSalary * ETF_RATE).toFixed(2));
    const totalDeductions = epfEmployee + deductions;
    const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2));

    res.json({
      employeeId,
      employeeName: employee.name,
      month,
      year,
      basicSalary,
      allowances,
      bonuses,
      grossSalary,
      epfEmployee,
      epfEmployer,
      etfEmployer,
      otherDeductions: deductions,
      totalDeductions,
      netSalary,
    });
  } catch (error) { next(error); }
};

// @desc    Process salary payment  
// @route   POST /api/payroll/pay
// @access  Private/Manager/Admin
const processSalaryPayment = async (req, res, next) => {
  try {
    const { employeeId, month, year, allowances = 0, deductions = 0, bonuses = 0 } = req.body;

    // Check for duplicate
    const existing = await Payroll.findOne({ employeeId, month, year });
    if (existing) {
      res.status(400);
      return next(new Error(`Salary already processed for ${month}/${year}`));
    }

    const employee = await User.findById(employeeId);
    if (!employee) { res.status(404); return next(new Error('Employee not found')); }

    const basicSalary = employee.employeeInfo?.salary || 0;
    const grossSalary = basicSalary + allowances + bonuses;
    const epfEmployee = parseFloat((basicSalary * EPF_EMPLOYEE_RATE).toFixed(2));
    const epfEmployer = parseFloat((basicSalary * EPF_EMPLOYER_RATE).toFixed(2));
    const etfEmployer = parseFloat((basicSalary * ETF_RATE).toFixed(2));
    const totalDeductions = epfEmployee + deductions;
    const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2));

    const payroll = await Payroll.create({
      employeeId,
      storeId: employee.assignedStore || null,
      month,
      year,
      basicSalary,
      allowances,
      bonuses,
      grossSalary,
      epfEmployee,
      epfEmployer,
      etfEmployer,
      otherDeductions: deductions,
      totalDeductions,
      netSalary,
      status: 'paid',
      paidAt: new Date(),
      processedBy: req.user._id,
    });

    // Send notification & email
    const emailContent = salaryPaidEmail(employee.name, payroll);
    await sendNotification({
      userId: employee._id,
      userEmail: employee.email,
      type: 'salary_credit',
      title: '💰 Salary Credited',
      message: `Your salary of Rs.${netSalary.toLocaleString()} for ${month}/${year} has been processed.`,
      link: '/profile',
      emailContent,
    });

    res.status(201).json(payroll);
  } catch (error) { next(error); }
};

// @desc    Get salary history for employee
// @route   GET /api/payroll/history/:employeeId
// @access  Private
const getSalaryHistory = async (req, res, next) => {
  try {
    // Allow employees to see their own, managers/admins to see anyone's
    const employeeId = req.params.employeeId === 'me' ? req.user._id : req.params.employeeId;

    if (employeeId.toString() !== req.user._id.toString() && !['admin', 'manager'].includes(req.user.role)) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    const history = await Payroll.find({ employeeId })
      .sort({ year: -1, month: -1 })
      .limit(24);
    res.json(history);
  } catch (error) { next(error); }
};

// @desc    Get payroll report for a month
// @route   GET /api/payroll/report
// @access  Private/Manager/Admin
const getPayrollReport = async (req, res, next) => {
  try {
    const { month, year, role, employeeName } = req.query;
    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    let payrolls = await Payroll.find(filter)
      .populate('employeeId', 'name email role employeeInfo')
      .sort({ createdAt: -1 });

    if (role && role !== 'all') {
      payrolls = payrolls.filter((p) => p.employeeId?.role === role);
    }
    if (employeeName && String(employeeName).trim()) {
      const q = String(employeeName).trim().toLowerCase();
      payrolls = payrolls.filter((p) => String(p.employeeId?.name || '').toLowerCase().includes(q));
    }

    const totals = payrolls.reduce((acc, p) => ({
      totalGross: acc.totalGross + p.grossSalary,
      totalNet: acc.totalNet + p.netSalary,
      totalEPFEmployee: acc.totalEPFEmployee + p.epfEmployee,
      totalEPFEmployer: acc.totalEPFEmployer + p.epfEmployer,
      totalETF: acc.totalETF + p.etfEmployer,
    }), { totalGross: 0, totalNet: 0, totalEPFEmployee: 0, totalEPFEmployer: 0, totalETF: 0 });

    res.json({ payrolls, totals, count: payrolls.length });
  } catch (error) { next(error); }
};

const buildSalaryExportRows = (records = []) => records.map((record) => ({
  employeeName: record.employeeId?.name || 'Unknown',
  role: record.employeeId?.role || 'N/A',
  month: record.month,
  year: record.year,
  basicSalary: Number(record.basicSalary || 0),
  allowances: Number(record.allowances || 0),
  bonuses: Number(record.bonuses || 0),
  deductions: Number(record.otherDeductions || 0),
  netSalary: Number(record.netSalary || 0),
  paymentStatus: record.paymentStatus || record.status || 'pending',
}));

const exportEmployeeSalaryReport = async (req, res, next) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;
    const employeeId = req.params.employeeId === 'me' ? req.user._id : req.params.employeeId;
    if (String(employeeId) !== String(req.user._id) && !['admin', 'manager'].includes(req.user.role)) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    const filter = { employeeId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const records = await Payroll.find(filter)
      .populate('employeeId', 'name role')
      .sort({ year: -1, month: -1 });
    const rows = buildSalaryExportRows(records);

    if (format === 'xlsx') {
      const sheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'Salary Report');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="salary-report-${employeeId}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="salary-report-${employeeId}.pdf"`);
      doc.pipe(res);

      doc.fontSize(16).text('Employee Salary Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);
      rows.forEach((row, idx) => {
        doc.fontSize(11).text(`${idx + 1}. ${row.employeeName} (${row.role})`);
        doc.fontSize(10).text(`Period: ${row.month}/${row.year} | Basic: Rs.${row.basicSalary.toLocaleString()} | Bonus: Rs.${row.bonuses.toLocaleString()} | Deductions: Rs.${row.deductions.toLocaleString()} | Net: Rs.${row.netSalary.toLocaleString()} | Status: ${row.paymentStatus}`);
        doc.moveDown(0.6);
      });
      doc.end();
      return;
    }

    const headers = ['Employee Name', 'Role', 'Month', 'Year', 'Basic Salary', 'Allowances', 'Bonuses', 'Deductions', 'Net Salary', 'Payment Status'];
    const csvLines = [
      headers.join(','),
      ...rows.map((row) => [
        `"${row.employeeName}"`,
        `"${row.role}"`,
        row.month,
        row.year,
        row.basicSalary,
        row.allowances,
        row.bonuses,
        row.deductions,
        row.netSalary,
        `"${row.paymentStatus}"`,
      ].join(',')),
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="salary-report-${employeeId}.csv"`);
    res.send(csvLines.join('\n'));
  } catch (error) { next(error); }
};

module.exports = { calculateSalary, processSalaryPayment, getSalaryHistory, getPayrollReport, exportEmployeeSalaryReport };
