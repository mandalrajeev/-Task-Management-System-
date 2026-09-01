const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List tasks visible to the current user, with optional filters
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: team_id
 *         schema: { type: string }
 *       - in: query
 *         name: deadline_before
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: deadline_after
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of tasks }
 */
router.get('/', taskController.listTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a single task
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task detail }
 */
router.get('/:id', taskController.getTask);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create and assign a task (admin, manager)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               priority: { type: string, enum: [low, medium, high] }
 *               deadline: { type: string, format: date-time }
 *               team_id: { type: string }
 *               assigned_to: { type: string }
 *     responses:
 *       201: { description: Task created }
 */
router.post(
  '/',
  authorize('admin', 'manager'),
  [body('title').trim().notEmpty(), body('priority').optional().isIn(['low', 'medium', 'high'])],
  validate,
  taskController.createTask
);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task. Admin/manager can edit any field; a user may only change status on their own task.
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task updated }
 */
router.patch(
  '/:id',
  [body('status').optional().isIn(['todo', 'in_progress', 'done'])],
  validate,
  taskController.updateTask
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task (admin, manager)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task deleted }
 */
router.delete('/:id', authorize('admin', 'manager'), taskController.deleteTask);

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   get:
 *     summary: List comments on a task
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of comments }
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string }
 *     responses:
 *       201: { description: Comment created }
 */
router.get('/:taskId/comments', commentController.listComments);
router.post(
  '/:taskId/comments',
  [body('body').trim().notEmpty()],
  validate,
  commentController.createComment
);

module.exports = router;
