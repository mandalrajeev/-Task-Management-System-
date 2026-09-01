const express = require('express');
const { body } = require('express-validator');
const teamController = require('../controllers/teamController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /teams:
 *   get:
 *     summary: List teams visible to the current user
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of teams }
 */
router.get('/', teamController.listTeams);

/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     summary: Get a single team
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Team detail }
 */
router.get('/:id', teamController.getTeam);

/**
 * @swagger
 * /teams:
 *   post:
 *     summary: Create a team (admin only)
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               manager_id: { type: string }
 *     responses:
 *       201: { description: Team created }
 */
router.post('/', authorize('admin'), [body('name').trim().notEmpty()], validate, teamController.createTeam);

/**
 * @swagger
 * /teams/{id}:
 *   patch:
 *     summary: Update a team (admin only)
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Team updated }
 */
router.patch('/:id', authorize('admin'), teamController.updateTeam);

/**
 * @swagger
 * /teams/{id}:
 *   delete:
 *     summary: Delete a team (admin only)
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Team deleted }
 */
router.delete('/:id', authorize('admin'), teamController.deleteTeam);

/**
 * @swagger
 * /teams/{id}/members:
 *   post:
 *     summary: Add a member to a team (admin only)
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id: { type: string }
 *     responses:
 *       201: { description: Member added }
 */
router.post(
  '/:id/members',
  authorize('admin'),
  [body('user_id').notEmpty()],
  validate,
  teamController.addMember
);

/**
 * @swagger
 * /teams/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a team (admin only)
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Member removed }
 */
router.delete('/:id/members/:userId', authorize('admin'), teamController.removeMember);

module.exports = router;
