const sequelize = require("../lib/sequelize");
const { DataTypes } = require("sequelize");

const Request_Log = sequelize.define("request_log", {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  product: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reqWarehouse: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Request_Log;
