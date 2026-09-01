const { Comment, Task, User } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const notify = require('../utils/notify');

async function assertTaskAccess(user, task) {
  if (user.role === 'user' && task.assigned_to !== user.id) {
    throw new ApiError(403, 'You do not have access to this task');
  }
}

// GET /api/tasks/:taskId/comments
const listComments = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  await assertTaskAccess(req.user, task);

  const comments = await Comment.findAll({
    where: { task_id: task.id },
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }],
    order: [['created_at', 'ASC']]
  });
  res.json({ success: true, comments });
});

// POST /api/tasks/:taskId/comments
const createComment = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  await assertTaskAccess(req.user, task);

  const comment = await Comment.create({
    task_id: task.id,
    user_id: req.user.id,
    body: req.body.body
  });

  const recipients = new Set([task.assigned_by, task.assigned_to].filter(Boolean));
  recipients.delete(req.user.id);
  await Promise.all(
    [...recipients].map((userId) =>
      notify({
        userId,
        taskId: task.id,
        type: 'comment_added',
        message: `New comment on task "${task.title}"`
      })
    )
  );

  const full = await Comment.findByPk(comment.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }]
  });
  res.status(201).json({ success: true, comment: full });
});

// DELETE /api/comments/:id  (author or admin)
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findByPk(req.params.id);
  if (!comment) throw new ApiError(404, 'Comment not found');

  if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own comments');
  }

  await comment.destroy();
  res.json({ success: true, message: 'Comment deleted' });
});

module.exports = { listComments, createComment, deleteComment };
