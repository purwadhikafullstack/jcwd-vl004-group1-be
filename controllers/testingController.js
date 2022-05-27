const db = require("../db");
const Invoice_Details = require("../models/Invoice_Details");
const Invoice_Headers = require("../models/Invoice_Headers");
const Products = require("../models/Products");
const Request_Stock = require("../models/Request_Stock");
const Transactions = require("../models/Transactions");
const User_Addresses = require("../models/User_Addresses");
const Warehouse_Products = require("../models/Warehouse_Products");

module.exports = {
  getTransaction: async (req, res) => {
    try {
      let allTransactions = await Transactions.findAll({
        include: [
          {
            model: Invoice_Headers,
            required: true,
            include: [
              {
                model: Invoice_Details,
                required: true,
              },
              {
                model: User_Addresses,
                required: true,
              },
            ],
          },
        ],
      });
      // let table = {
      //     "idTransaction": allTransactions.invoice_header.id ,
      //     "warehouse": allTransactions.invoice_header.warehouseId
      // }
      // console.log(allTransactions[0].dataValues.invoice_header.total)
      // let transactionDetails = allTransactions[0].dataValues.invoice_header.invoice_details

      // transactionDetails.map((transaction)=>{
      //     transaction.dataValues.tes=0
      //     console.log(transaction)
      // })

      res.status(200).send(transactionDetails);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getTransactionById: async (req, res) => {
    try {
      let id = req.params.id;
      let transactionsId = await Transactions.findOne({
        where: { id: id },
        include: [
          {
            model: Invoice_Headers,
            required: true,
            include: [
              {
                model: Invoice_Details,
                required: true,
              },
              {
                model: User_Addresses,
                required: true,
              },
            ],
          },
        ],
      });

      let warehouseId = transactionsId.dataValues.invoice_header.warehouseId;
      console.log(warehouseId);

      let warehouseInventory = await Warehouse_Products.findAll({
        where: { warehouseId: warehouseId },
      });

      let insufficientStock = false;

      let transactionDetails =
        transactionsId.dataValues.invoice_header.invoice_details;
      transactionDetails.map((transaction) => {
        let productId = transaction.productId;
        let itemInInventory;
        // let warehouseQuantity=itemInInventory.dataValues.stock_ready
        // let itemQuantity=transaction.quantity

        warehouseInventory.map((item) => {
          if (item.productId == productId) {
            itemInInventory = item;
          }
        });

        // console.log(itemInInventory.dataValues.stock_ready,transaction.quantity)

        if (itemInInventory.dataValues.stock_ready < transaction.quantity) {
          console.log("kurang");
          transaction.dataValues.status = "Stock insufficient";
          transaction.dataValues.requestStock =
            transaction.quantity - itemInInventory.dataValues.stock_ready;
          transaction.dataValues.warehouseStock =
            itemInInventory.dataValues.stock_ready;
          insufficientStock = true;
        } else {
          console.log("cukup");
          transaction.dataValues.status = "Stock Ready";
          transaction.dataValues.requestStock = 0;
          transaction.dataValues.warehouseStock =
            itemInInventory.dataValues.stock_ready;
        }

        if (insufficientStock) {
          transactionsId.status = "waiting request";
        }
      });

      console.log(transactionDetails);

      res.status(200).send(transactionsId);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getRequest: async (req, res) => {
    try {
      let allRequest = await Request_Stock.findAll({
        include: [
          {
            model: Products,
            required: true,
          },
        ],
      });

      res.status(200).send(allRequest);
    } catch (err) {
      res.status(500).send(err);
    }
  },
};
