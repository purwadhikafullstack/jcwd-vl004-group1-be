const db = require("../db");
const Invoice_Details = require("../models/Invoice_Details");
const Invoice_Headers = require("../models/Invoice_Headers");
const Products = require("../models/Products");
const Transactions = require("../models/Transactions");
const Users = require("../models/Users");
const User_Addresses = require("../models/User_Addresses");
const Payments = require("../models/Payment_Confirmations");
const Warehouses = require("../models/Warehouses");
const Warehouse_Products = require("../models/Warehouse_Products");

module.exports = {
  getPayment: async (req, res) => {
    try {
      let payment = await Payments.findAll({
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
      res.status(200).send(payment);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getPaymentSortAsc: async (req, res) => {
    try {
      let payment = await Payments.findAll({
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
      res.status(200).send(payment);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getPaymentSortDesc: async (req, res) => {
    try {
      let payment = await Payments.findAll({
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
      res.status(200).send(payment);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getPaymentById: async (req, res) => {
    try {
      let id = req.params.id;
      let payment = await Payments.findOne({
        where: {
          id: id,
        },
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
      res.status(200).send(payment);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  acceptPayment: async (req, res) => {
    try {
      const { number } = req.body;
      let id = req.params.id;
      let payment = await Payments.findOne({
        where: {
          id: id,
        },
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
      console.log(payment);
      let transaction = await Transactions.create({
        invoiceHeaderId: payment.invoiceHeaderId,
        number: payment.invoiceHeaderId,
      });
      await Invoice_Headers.update(
        {
          status: "approved",
        },
        {
          where: { id: payment.invoiceHeaderId },
        }
      );
      res.status(200).send(payment);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  rejectPayment: async (req, res) => {
    try {
      console.log("hihih");
      let id = req.params.id;
      let payment = await Payments.findOne({
        where: { id: id },
        include: [
          {
            model: Invoice_Headers,
            // required: true,
            include: [
              {
                model: Invoice_Details,
                // required: true,
                include: [
                  {
                    model: Products,
                    // required: true,
                    include: Warehouse_Products,
                  },
                  {
                    model: Warehouses,
                    // required: true,
                  },
                ],
              },
              {
                model: User_Addresses,
                // required: true,
              },
            ],
          },
        ],
      });
      let invoiceDetails = payment.invoice_header.invoice_details;
      // for (i = 0; i < invoiceDetails.length; i++) {
      //   // let getProduct = await Warehouse_Products.findOne({
      //   //   where: {
      //   //     productId: invoiceDetails[i].productId,
      //   //     warehouseId: invoiceDetails[i].warehouseId,
      //   //   },
      //   // });
      //   // let stockReady = getProduct.stock_ready;
      //   // let newStock = stockReady + invoiceDetails[i].quantity;
      //   await Warehouse_Products.update(
      //     {
      //       stock_ready:
      //         invoiceDetails[i].product.warehouse_products[
      //           invoiceDetails[i].warehouseId.stock_ready
      //         ] + invoiceDetails[i].quantity,
      //       stock_reserved:
      //         invoiceDetails[i].product.warehouse_products[
      //           invoiceDetails[i].warehouseId
      //         ] - invoiceDetails[i].quantity,
      //     },

      //     {
      //       where: {
      //         productId: invoiceDetails[i].productId,
      //         warehouseId: invoiceDetails[i].warehouseId,
      //       },
      //     }
      //   );
      // }
      invoiceDetails.forEach(async (item) => {
        // console.log(item.product.warehouse_products);
        console.log(item.warehouseId);
        let warehouseData = item.product.warehouse_products.find(
          (warehouse) => {
            return warehouse.warehouseId === item.warehouseId;
          }
        );
        // console.log(warehouseData);
        await Warehouse_Products.update(
          {
            stock_ready: warehouseData.stock_ready + item.quantity,
            stock_reserved: warehouseData.stock_reserved - item.quantity,
          },
          {
            where: {
              id: warehouseData.id,
            },
          }
        );
      });
      let updateStatus = await Invoice_Headers.update(
        {
          status: "rejected",
        },
        {
          where: { id: payment.invoiceHeaderId },
        }
      );
      res.status(200).send(payment);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
};
