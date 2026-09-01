const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get task status overview scoped to the current user's role
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard summary }
 */
router.get('/', dashboardController.getDashboard);

module.exports = router;
