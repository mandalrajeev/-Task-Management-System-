const express = require('express');
const commentController = require('../controllers/commentController');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment (author or admin)
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Comment deleted }
 */
router.delete('/:id', commentController.deleteComment);

module.exports = router;
