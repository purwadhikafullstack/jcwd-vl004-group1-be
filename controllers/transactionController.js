const db = require("../db");
const Invoice_Details = require("../models/Invoice_Details");
const Invoice_Headers = require("../models/Invoice_Headers");
const Products = require("../models/Products");
const Transactions = require("../models/Transactions");
const Users = require("../models/Users");
const User_Addresses = require("../models/User_Addresses");
const Warehouses = require("../models/Warehouses");
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
                model: Warehouses,
                required: true,
              },
              {
                model: User_Addresses,
                required: true,
              },
              {
                model: Users,
                required: true,
              },
            ],
          },
        ],
        order: [["id", "ASC"]],
      });
      res.status(200).send(allTransactions);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getTransactionSortAsc: async (req, res) => {
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
                model: Warehouses,
                required: true,
              },
              {
                model: User_Addresses,
                required: true,
              },
              {
                model: Users,
                required: true,
              },
            ],
          },
        ],
        order: [["updatedAt", "ASC"]],
      });
      res.status(200).send(allTransactions);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getTransactionSortDesc: async (req, res) => {
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
                model: Warehouses,
                required: true,
              },
              {
                model: User_Addresses,
                required: true,
              },
              {
                model: Users,
                required: true,
              },
            ],
          },
        ],
        order: [["updatedAt", "DESC"]],
      });
      res.status(200).send(allTransactions);
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
                include: [
                  {
                    model: Products,
                    required: true,
                  },
                  {
                    model: Warehouses,
                    required: true,
                  },
                ],
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

        warehouseInventory.map((item) => {
          if (item.productId == productId) {
            itemInInventory = item;
          }
        });

        if (itemInInventory.dataValues.stock_reserved < transaction.quantity) {
          transaction.dataValues.status = "Stock Insufficient";
          transaction.dataValues.requestStock =
            transaction.quantity - itemInInventory.dataValues.stock_reserved;
          transaction.dataValues.warehouseStock =
            itemInInventory.dataValues.stock_reserved;
          insufficientStock = true;
        } else {
          transaction.dataValues.status = "Stock Ready";
          transaction.dataValues.requestStock = 0;
          transaction.dataValues.warehouseStock =
            itemInInventory.dataValues.stock_reserved;
        }

        if (insufficientStock) {
          transactionsId.status = "request needed";
        }
      });

      console.log(transactionDetails);

      res.status(200).send(transactionsId);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  checkStock: async (req, res) => {
    try {
      let id = req.params.id;

      // Data 1 transaksi
      let dataTransaction = await Transactions.findOne({
        where: { id: id },
        include: [
          {
            model: Invoice_Headers,
            required: true,
            include: [
              {
                model: Invoice_Details,
                required: true,
                include: [
                  {
                    model: Products,
                    required: true,
                  },
                  {
                    model: Warehouses,
                    required: true,
                  },
                ],
              },
              {
                model: User_Addresses,
                required: true,
              },
            ],
          },
        ],
      });

      // Ambil data barang di warehouse kita
      let warehouseId = dataTransaction.dataValues.invoice_header.warehouseId;
      let warehouseInventory = await Warehouse_Products.findAll({
        where: { warehouseId: warehouseId },
      });

      // cek per item di invoice_detail
      let items =
        dataTransaction.dataValues.invoice_header.dataValues.invoice_details;

      let insufficientStock = false;

      items.map((item) => {
        let productId = item.productId;
        let currentInventoryItem;

        warehouseInventory.map((item) => {
          if (item.productId == productId) {
            currentInventoryItem = item;
          }
        });
        console.log(item.quantity);
        console.log(currentInventoryItem.stock_reserved);

        if (currentInventoryItem.stock_reserved < item.quantity) {
          console.log("Item Kurang");
          insufficientStock = true;
        } else {
          console.log("Stock Ready!");
        }
      });

      console.log("Kurang" + insufficientStock);
      if (insufficientStock) {
        const updateStatus = await Transactions.update(
          {
            status: "request needed",
          },
          {
            where: { id: req.params.id },
          }
        );
        if (updateStatus[0] == 0) {
          throw { code: 400, message: "Change Status Failed!", err: null };
        }
        res
          .status(200)
          .send({ message: "Change Status Success!", success: true });
      } else {
        const updateStatus = await Transactions.update(
          {
            status: "Ready to process",
          },
          {
            where: { id: req.params.id },
          }
        );
        if (updateStatus[0] == 0) {
          throw { code: 400, message: "Change Status Failed!", err: null };
        }
        res
          .status(200)
          .send({ message: "Change Status Success!", success: true });
      }
    } catch (err) {
      res.status(err.code).send("Error Transaction: " + err.message);
    }
    // console.log(items);
  },
  changeTransactionStatus: async (req, res) => {
    try {
      const updateTransactionStatus = await Transactions.update(
        {
          status: "waiting request",
        },
        {
          where: { id: req.params.id },
        }
      );
      if (updateTransactionStatus[0] == 0) {
        throw {
          code: 400,
          message: "Transaction Update Status Failed!",
          err: null,
        };
      }
      res
        .status(200)
        .send({ message: "Transaction Update Status Success!", success: true });
    } catch (err) {
      res.status(err.code).send("Error Transaction: " + err.message);
    }
  },
  deliver: async (req, res) => {
    try {
      let id = req.params.id;
      let dataTransaction = await Transactions.findOne({
        where: { id: id },
        include: [
          {
            model: Invoice_Headers,
            required: true,
            include: [
              {
                model: Invoice_Details,
                required: true,
                include: [
                  {
                    model: Products,
                    required: true,
                  },
                  {
                    model: Warehouses,
                    required: true,
                  },
                ],
              },
              {
                model: User_Addresses,
                required: true,
              },
            ],
          },
        ],
      });
      let invoiceDetails = dataTransaction.invoice_header.invoice_details;
      let warehouseId = dataTransaction.invoice_header.warehouseId;

      for (i = 0; i < invoiceDetails.length; i++) {
        // getdata dari warehouse product dengan productId invoice.productid dan warehouseid = warehouseId
        let getProduct = await Warehouse_Products.findOne({
          where: {
            productId: invoiceDetails[i].productId,
            warehouseId: warehouseId,
          },
        });

        // ambil getdatawarehouse.stock_reeadyd & dan stock_reserved lalu dikurangi dengan quantity
        let stockReserved = getProduct.stock_reserved;
        let newStock = stockReserved - invoiceDetails[i].quantity;

        // patch ke datawarehouse dengan id getdatawarehouse.id

        await Warehouse_Products.update(
          {
            stock_ready: newStock,
            stock_reserved: newStock,
          },
          {
            where: {
              id: getProduct.id,
            },
          }
        );
        console.log(getProduct.id);
        // console.log("stock ready" + stockReady);
        // console.log("quantity" + invoiceDetails[i].quantity);
        // console.log("stock baru" + newStock);
      }
      let updateStatus = await Transactions.update(
        {
          status: "Delivered",
        },
        {
          where: { id: id },
        }
      );
      res.status(200).send(updateStatus);
    } catch (err) {
      res.status(err.code).send("Error Transaction: " + err.message);
    }
  },
  rejectTransaction: async (req, res) => {
    try {
      let id = req.params.id;
      let dataTransaction = await Transactions.findOne({
        where: { id: id },
        include: [
          {
            model: Invoice_Headers,
            required: true,
            include: [
              {
                model: Invoice_Details,
                required: true,
                include: [
                  {
                    model: Products,
                    required: true,
                  },
                  {
                    model: Warehouses,
                    required: true,
                  },
                ],
              },
              {
                model: User_Addresses,
                required: true,
              },
            ],
          },
        ],
      });
      let invoiceDetails = dataTransaction.invoice_header.invoice_details;
      let warehouseId = dataTransaction.invoice_header.warehouseId;

      for (i = 0; i < invoiceDetails.length; i++) {
        let getProduct = await Warehouse_Products.findOne({
          where: {
            productId: invoiceDetails[i].productId,
            warehouseId: warehouseId,
          },
        });

        let stockReady = getProduct.stock_ready;
        let newStock = stockReady + invoiceDetails[i].quantity;

        await Warehouse_Products.update(
          {
            stock_ready: newStock,
          },
          {
            where: {
              id: getProduct.id,
            },
          }
        );
        console.log(getProduct.id);
      }
      let updateStatus = await Transactions.update(
        {
          status: "Rejected",
        },
        {
          where: { id: id },
        }
      );
      res.status(200).send(updateStatus);
    } catch (err) {
      res.status(err.code).send("Error Transaction: " + err.message);
    }
  },
};
