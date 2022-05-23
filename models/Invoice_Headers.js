const sequelize = require("../lib/sequelize");
const { DataTypes } = require("sequelize");
const User_Addresses = require("./User_Addresses");
const Payment_Confirmations = require("./Payment_Confirmations");
const Shipment_Masters = require("./Shipment_Masters");
const Invoice_Details = require("./Invoice_Details");
const Users = require("./Users");
const Payment_Options = require("./Payment_Options");
const Warehouses = require("./Warehouses");

const Invoice_Headers = sequelize.define("invoice_headers", {
  total: {
    type: DataTypes.DECIMAL,
  },
  warehouseId: {
    type: DataTypes.INTEGER,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "pending",
    allowNull: false,
    validate: {
      isIn: {
        args: [["unpaid", "pending", "approved", "rejected"]],
        msg: "Wrong Value!",
      },
    },
  },
});

module.exports = Invoice_Headers;

User_Addresses.hasOne(Invoice_Headers);
Invoice_Headers.belongsTo(User_Addresses);

Shipment_Masters.hasOne(Invoice_Headers);
Invoice_Headers.belongsTo(Shipment_Masters);

Warehouses.hasOne(Invoice_Headers);
Invoice_Headers.belongsTo(Warehouses);

Payment_Options.hasOne(Invoice_Headers);
Invoice_Headers.belongsTo(Payment_Options);

Invoice_Headers.hasOne(Payment_Confirmations);
Payment_Confirmations.belongsTo(Invoice_Headers);

Invoice_Headers.hasMany(Invoice_Details, {
  onDelete: "cascade",
});
Invoice_Details.belongsTo(Invoice_Headers);

Users.hasMany(Invoice_Headers);
Invoice_Headers.belongsTo(Users);

Warehouses.hasOne(Invoice_Headers);
Invoice_Headers.belongsTo(Warehouses);
