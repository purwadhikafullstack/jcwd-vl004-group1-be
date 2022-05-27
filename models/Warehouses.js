const sequelize = require("../lib/sequelize");
const { DataTypes } = require("sequelize");
const Invoice_Details = require("./Invoice_Details");

const Warehouses = sequelize.define(
  "warehouses",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    province: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postal_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Warehouses;

Warehouses.hasOne(Invoice_Details);
Invoice_Details.belongsTo(Warehouses);
