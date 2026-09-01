const sequelize = require('../config/db');
const User = require('./User');
const Team = require('./Team');
const TeamMember = require('./TeamMember');
const Task = require('./Task');
const Comment = require('./Comment');
const Notification = require('./Notification');

// --- Team associations ---
Team.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
Team.belongsTo(User, { as: 'manager', foreignKey: 'manager_id' });
User.hasMany(Team, { as: 'managedTeams', foreignKey: 'manager_id' });

// --- Team <-> User (many-to-many) via TeamMember ---
Team.belongsToMany(User, { through: TeamMember, as: 'members', foreignKey: 'team_id', otherKey: 'user_id' });
User.belongsToMany(Team, { through: TeamMember, as: 'teams', foreignKey: 'user_id', otherKey: 'team_id' });
TeamMember.belongsTo(Team, { foreignKey: 'team_id' });
TeamMember.belongsTo(User, { foreignKey: 'user_id' });

// --- Task associations ---
Task.belongsTo(Team, { as: 'team', foreignKey: 'team_id' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigned_to' });
Task.belongsTo(User, { as: 'assigner', foreignKey: 'assigned_by' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assigned_to' });
Team.hasMany(Task, { as: 'tasks', foreignKey: 'team_id' });

// --- Comment associations ---
Comment.belongsTo(Task, { foreignKey: 'task_id' });
Comment.belongsTo(User, { as: 'author', foreignKey: 'user_id' });
Task.hasMany(Comment, { as: 'comments', foreignKey: 'task_id' });

// --- Notification associations ---
Notification.belongsTo(User, { foreignKey: 'user_id' });
Notification.belongsTo(Task, { foreignKey: 'task_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Team,
  TeamMember,
  Task,
  Comment,
  Notification
};
