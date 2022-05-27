const sequelize = require("../lib/sequelize");
const { DataTypes } = require("sequelize");
const Products = require("./Products");
const Users = require("./Users");

const Carts = sequelize.define("carts", {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.product?.price * this.quantity;
    },
  },
});

module.exports = Carts;

Products.hasMany(Carts);
Carts.belongsTo(Products);

Users.hasMany(Carts);
Carts.belongsTo(Users);
