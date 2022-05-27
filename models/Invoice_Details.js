const sequelize = require("../lib/sequelize");
const { DataTypes } = require("sequelize");
const Warehouses = require("./Warehouses");

const Invoice_Details = sequelize.define("invoice_details", {
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  warehouseId: {
    type: DataTypes.INTEGER,
  },
});

module.exports = Invoice_Details;
