// routes/dashboardRoutes.js
import express from 'express';

import { getDashboardData, getAttendanceAnalytics, getLocationDistribution } from '../controllers/Dashboard.js';
const router = express.Router();

router.get('/', getDashboardData);
router.get('/analytics', getAttendanceAnalytics);
router.get('/locations', getLocationDistribution);

export default router;