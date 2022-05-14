const sequelize = require("../lib/sequelize");
const { DataTypes } = require("sequelize");
const Invoice_Headers = require("./Invoice_Headers");

const Transactions = sequelize.define("transactions", {
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        allowNull: false,
        validate: {
          isIn: {
            args: [["pending", "request needed", "waiting request", "approved request", "rejected request", "delivered", "canceled"]],
            msg: "Wrong Value!",
          },
        },
      },
});

module.exports = Transactions;

Invoice_Headers.hasOne(Transactions);
Transactions.belongsTo(Invoice_Headers);
