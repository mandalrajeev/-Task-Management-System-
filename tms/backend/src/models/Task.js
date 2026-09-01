const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Task extends Model {}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { notEmpty: true }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'done'),
      allowNull: false,
      defaultValue: 'todo'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium'
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true
    },
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    indexes: [
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['deadline'] },
      { fields: ['assigned_to'] }
    ]
  }
);

module.exports = Task;
