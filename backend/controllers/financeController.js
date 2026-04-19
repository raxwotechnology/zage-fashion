const Order = require('../models/Order');
const Expense = require('../models/Expense');
const AdditionalIncome = require('../models/AdditionalIncome');
const Store = require('../models/Store');

// @desc    Get combined financial dashboard
// @route   GET /api/finance/dashboard
// @access  Private/Admin/Manager
const getFinancialDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Store scoping for managers
    let storeFilter = {};
    if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) storeFilter = { storeId: store._id };
    } else if (storeId) {
      storeFilter = { storeId };
    }

    // Revenue from orders
    const orderFilter = { ...storeFilter, orderStatus: { $nin: ['cancelled'] } };
    if (Object.keys(dateFilter).length) orderFilter.createdAt = dateFilter;
    const orders = await Order.find(orderFilter);
    const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const orderCount = orders.length;

    // Expenses
    const expenseFilter = { ...storeFilter };
    if (Object.keys(dateFilter).length) expenseFilter.date = dateFilter;
    const expenses = await Expense.find(expenseFilter);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const paidExpenses = expenses.filter(e => e.status === 'Paid').reduce((s, e) => s + e.amount, 0);
    const pendingExpenses = expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + e.amount, 0);

    // Additional income
    const incomeFilter = { ...storeFilter };
    if (Object.keys(dateFilter).length) incomeFilter.date = dateFilter;
    const additionalIncomes = await AdditionalIncome.find(incomeFilter);
    const totalAdditionalIncome = additionalIncomes.reduce((s, i) => s + i.amount, 0);

    // Net profit
    const netProfit = totalRevenue + totalAdditionalIncome - totalExpenses;

    // Monthly breakdown (last 12 months)
    const monthlyData = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthRevenue = orders
        .filter(o => new Date(o.createdAt) >= monthStart && new Date(o.createdAt) <= monthEnd)
        .reduce((s, o) => s + (o.totalAmount || 0), 0);

      const monthExpenses = expenses
        .filter(e => new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd)
        .reduce((s, e) => s + e.amount, 0);

      const monthIncome = additionalIncomes
        .filter(i => new Date(i.date) >= monthStart && new Date(i.date) <= monthEnd)
        .reduce((s, i) => s + i.amount, 0);

      monthlyData.push({
        month: monthStart.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        revenue: monthRevenue,
        expenses: monthExpenses,
        additionalIncome: monthIncome,
        profit: monthRevenue + monthIncome - monthExpenses,
      });
    }

    // Expense breakdown by category
    const expenseByCategory = {};
    expenses.forEach(e => {
      if (!expenseByCategory[e.category]) expenseByCategory[e.category] = 0;
      expenseByCategory[e.category] += e.amount;
    });

    res.json({
      totalRevenue,
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      totalAdditionalIncome,
      netProfit,
      orderCount,
      expenseCount: expenses.length,
      monthlyData,
      expenseByCategory,
    });
  } catch (error) { next(error); }
};

// @desc    Add additional income
// @route   POST /api/finance/income
// @access  Private/Admin/Manager
const addAdditionalIncome = async (req, res, next) => {
  try {
    const { title, source, amount, date, notes, storeId } = req.body;

    let assignedStore = storeId;
    if (!assignedStore && req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) assignedStore = store._id;
    }

    const income = await AdditionalIncome.create({
      title,
      source,
      amount,
      date: date || new Date(),
      notes: notes || '',
      storeId: assignedStore || null,
      createdBy: req.user._id,
    });

    res.status(201).json(income);
  } catch (error) { next(error); }
};

// @desc    Get additional incomes
// @route   GET /api/finance/income
// @access  Private/Admin/Manager
const getAdditionalIncomes = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) filter.storeId = store._id;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const incomes = await AdditionalIncome.find(filter)
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json(incomes);
  } catch (error) { next(error); }
};

// @desc    Delete additional income
// @route   DELETE /api/finance/income/:id
// @access  Private/Admin/Manager
const deleteAdditionalIncome = async (req, res, next) => {
  try {
    const income = await AdditionalIncome.findById(req.params.id);
    if (!income) { res.status(404); return next(new Error('Income record not found')); }
    await income.deleteOne();
    res.json({ message: 'Income record deleted' });
  } catch (error) { next(error); }
};

module.exports = {
  getFinancialDashboard,
  addAdditionalIncome,
  getAdditionalIncomes,
  deleteAdditionalIncome,
};
