const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List users (admin, manager)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, manager, user] }
 *     responses:
 *       200: { description: List of users }
 */
router.get('/', authorize('admin', 'manager'), userController.listUsers);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a user with any role (admin only)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [admin, manager, user] }
 *     responses:
 *       201: { description: User created }
 */
router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('role').optional().isIn(['admin', 'manager', 'user'])
  ],
  validate,
  userController.createUser
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user's name, role, or active status (admin only)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User updated }
 */
router.patch('/:id', authorize('admin'), userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deactivate a user (admin only)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User deactivated }
 */
router.delete('/:id', authorize('admin'), userController.deactivateUser);

module.exports = router;
