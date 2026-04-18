const express = require('express');
const router = express.Router();
const {
  checkIn, checkOut, getMyAttendance, getAttendanceReport,
  requestLeave, getMyLeaves, getStoreLeaves, approveLeave, rejectLeave,
  getEmployees, addEmployee, updateEmployee,
} = require('../controllers/hrController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Attendance
router.post('/attendance/check-in', authorize('cashier', 'deliveryGuy', 'stockEmployee', 'manager'), checkIn);
router.post('/attendance/check-out', authorize('cashier', 'deliveryGuy', 'stockEmployee', 'manager'), checkOut);
router.get('/attendance', getMyAttendance);
router.get('/attendance/report', authorize('manager', 'admin'), getAttendanceReport);

// Leaves
router.post('/leaves', requestLeave);
router.get('/leaves', getMyLeaves);
router.get('/leaves/store', authorize('manager', 'admin'), getStoreLeaves);
router.put('/leaves/:id/approve', authorize('manager', 'admin'), approveLeave);
router.put('/leaves/:id/reject', authorize('manager', 'admin'), rejectLeave);

// Employees
router.get('/employees', authorize('manager', 'admin'), getEmployees);
router.post('/employees', authorize('manager', 'admin'), addEmployee);
router.put('/employees/:id', authorize('manager', 'admin'), updateEmployee);

module.exports = router;
