const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class TeamMember extends Model {}

TeamMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'TeamMember',
    tableName: 'team_members',
    indexes: [{ unique: true, fields: ['team_id', 'user_id'] }]
  }
);

module.exports = TeamMember;
