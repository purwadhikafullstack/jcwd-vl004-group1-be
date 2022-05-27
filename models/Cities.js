const sequelize = require("../lib/sequelize");
const { DataTypes } = require("sequelize");
const Provinces = require("./Provinces");

const Cities = sequelize.define(
  "cities",
  {
    name: {
      type: DataTypes.STRING,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allownull: true,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allownull: true,
    },
  },

  {
    timestamps: false,
  }
);

module.exports = Cities;

Provinces.hasMany(Cities);
Cities.belongsTo(Provinces);
