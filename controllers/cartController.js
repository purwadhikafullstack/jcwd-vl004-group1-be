const db = require("../db");
const Carts = require("../models/Carts");
const Invoice_Headers = require("../models/Invoice_Headers");
const Invoice_Details = require("../models/Invoice_Details");
const Payment_Options = require("../models/Payment_Options");
const Products = require("../models/Products");
const Shipment_Masters = require("../models/Shipment_Masters");
const Users = require("../models/Users");
const Warehouse_Products = require("../models/Warehouse_Products");
const Payment_Confirmations = require("../models/Payment_Confirmations");
const User_Addresses = require("../models/User_Addresses");
const sequelize = require("../lib/sequelize");
const { getDistance, convertDistance } = require("geolib");
const Warehouses = require("../models/Warehouses");
const Cities = require("../models/Cities");
const { Op } = require("sequelize");
const Request_Log = require("../models/RequestLog");

module.exports = {
  getUserCart: async (req, res) => {
    try {
      const { userId } = req.body;
      let carts = await Carts.findAll({
        attributes: [
          "id",
          "quantity",
          "subtotal",
          [
            sequelize.literal(
              `(SELECT sum(stock_ready) from warehouse_products WHERE warehouse_products.productId = carts.productId)`
            ),
            "totalQty",
          ],
        ],
        include: [
          {
            model: Products,
            attributes: {
              exclude: ["createdAt", "deletedAt", "updatedAt", "description"],
            },
          },
        ],
      });

      const result = carts;

      const unpaidInvoice = await Invoice_Headers.findOne({
        include: [
          { model: User_Addresses },
          { model: Invoice_Details, include: Products },
          { model: Shipment_Masters },
          { model: Payment_Options },
        ],
        where: { userId },
        status: "unpaid",
      });

      if (unpaidInvoice) {
        result.unpaidInvoice = unpaidInvoice;
      }

      res.status(200).send({ carts, unpaidInvoice });
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  sandboxGetUserCart: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let id = req.params.id;
      let addressId = req.body.addressId;

      let userLocation;
      let cityLocation;

      userLocation = await User_Addresses.findOne({
        where: { id: addressId },
        attributes: ["latitude", "longitude", "city"],
      });
      if (!userLocation.latitude || !userLocation.longitude) {
        cityLocation = await Cities.findOne({
          where: { name: userLocation.city },
          attributes: ["latitude", "longitude"],
        });
      }

      const warehouseLocation = await Warehouses.findAll({
        attributes: ["id", "name", "latitude", "longitude"],
      });

      // the warehouse distance comparison
      let distances = [];

      warehouseLocation.forEach((location) => {
        let distance = getDistance(
          // User
          {
            latitude: userLocation.latitude
              ? userLocation.latitude
              : cityLocation.latitude,
            longitude: userLocation.longitude
              ? userLocation.longitude
              : cityLocation.longitude,
          },
          // Warehouse
          {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          1
        );
        distances.push({
          id: location.id,
          name: location.name,
          distance: convertDistance(distance, "km"),
        });
      });
      distances = distances.sort((a, b) => {
        if (a.distance < b.distance) {
          return -1;
        }
      });
      // console.log(distances);
      console.log(distances.map((item) => item.id));

      const warehouseDistanceId = distances.map((item) => item.id);

      const userCart = await Users.findByPk(id, {
        attributes: ["id"],
        include: {
          model: Carts,
          attributes: ["quantity", "productId"],

          include: {
            model: Products,
            attributes: ["name"],
            include: {
              model: Warehouse_Products,
              attributes: [
                "id",
                "stock_ready",
                "stock_reserved",
                "warehouseId",
                "productId",
              ],
              include: { model: Warehouses, attributes: ["name"] },
              where: { warehouseId: warehouseDistanceId },
              required: true,
            },
          },
        },
      });
      console.log(userCart);

      await userCart.carts.forEach(async (item) => {
        const result = [];

        distances.forEach((distance) => {
          item.product.warehouse_products.forEach((warehouse) => {
            if (warehouse.warehouseId === distance.id) {
              result.push(distance.id);
            }
          });
        });
        console.log(result);

        Warehouse_Products.increment(
          {
            stock_reserved: item.quantity,
          },
          {
            where: {
              warehouseId: result[0],
              productId: item.productId,
            },
          }
        );

        const dataWarehouse = item.product.warehouse_products.find(
          (warehouse) => {
            return warehouse.warehouseId === result[0];
          }
        );
        console.log(dataWarehouse);

        if (dataWarehouse.stock_ready < item.quantity) {
          await Request_Log.create({
            product: item.productId,
            quantity: item.quantity - dataWarehouse.stock_ready,
            reqWarehouse: result[0],
          });
        }
      });

      res.status(200).send(userCart);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  updateCartQty: async (req, res) => {
    try {
      let id = req.params.id;
      let { userId, quantity } = req.body;
      await Carts.update({ quantity }, { where: { id: id } });
      let carts = await Carts.findAll({
        where: { userId },
        attributes: [
          "id",
          "quantity",
          "subtotal",
          [
            sequelize.literal(
              `(SELECT sum(stock_ready) from warehouse_products WHERE warehouse_products.productId = carts.productId)`
            ),
            "totalQty",
          ],
        ],

        include: [
          {
            model: Products,
            attributes: {
              exclude: ["createdAt", "deletedAt", "updatedAt", "description"],
            },
          },
        ],
      });
      res.status(200).send(carts);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  addUserCart: async (req, res) => {
    // Carts.sync({ alter: true });
    try {
      let data = {
        quantity: req.body.quantity,
        userId: req.body.userId,
        productId: req.body.productId,
      };
      const cart = await Carts.create(data);
      res.status(200).send(cart);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
    console.log(req.file);
  },
  deleteUserCart: async (req, res) => {
    Carts.sync({ alter: true });
    try {
      let id = req.params.id;
      let { userId } = req.body;
      await Carts.destroy({ where: { id: id } });
      let carts = await Carts.findAll({
        where: { userId },
        attributes: [
          "id",
          "quantity",
          "subtotal",
          [
            sequelize.literal(
              `(SELECT sum(stock_ready) from warehouse_products WHERE warehouse_products.productId = carts.productId)`
            ),
            "totalQty",
          ],
        ],

        include: [
          {
            model: Products,
            attributes: {
              exclude: ["createdAt", "deletedAt", "updatedAt", "description"],
            },
          },
        ],
      });
      res.status(200).send(carts);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getPaymentOptions: async (req, res) => {
    // Payment_Options.sync({ alter: true });
    try {
      const payment = await Payment_Options.findAll({});
      res.status(200).send(payment);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getPaymentOptionById: async (req, res) => {
    // Payment_Options.sync({ alter: true });
    try {
      let paymentId = req.params.id;
      const payment = await Payment_Options.findOne({
        where: { id: paymentId },
      });
      res.status(200).send(payment);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getShipmentOptions: async (req, res) => {
    // Shipment_Masters.sync({ alter: true });
    try {
      const shipment = await Shipment_Masters.findAll({});
      res.status(200).send(shipment);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getShipmentOptionById: async (req, res) => {
    // Shipment_Masters.sync({ alter: true });
    try {
      let shipmentId = req.params.id;
      const shipment = await Shipment_Masters.findOne({
        where: { id: shipmentId },
      });
      res.status(200).send(shipment);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  submitCheckout: async (req, res) => {
    try {
      const {
        total,
        status,
        userAddressId,
        shipmentMasterId,
        userId,
        paymentOptionId,
      } = req.body;

      const cartItems = await Carts.findAll({
        where: { userId },
        include: { model: Products, include: Warehouse_Products },
      });

      // itung dulu jarak antar warehouse yang paling terdekat.

      let id = req.params.id;

      let userLocation;
      let cityLocation;

      userLocation = await User_Addresses.findOne({
        where: { id: userAddressId },
        attributes: ["latitude", "longitude", "city"],
      });
      if (
        !userLocation.latitude ||
        userLocation.latitude === 0 ||
        !userLocation.longitude ||
        userLocation.longitude === 0
      ) {
        cityLocation = await Cities.findOne({
          where: { name: userLocation.city },
          attributes: ["latitude", "longitude"],
        });
      }

      const warehouseLocation = await Warehouses.findAll({
        attributes: ["id", "name", "latitude", "longitude"],
      });

      // the warehouse distance comparison
      let distances = [];

      warehouseLocation.forEach((location) => {
        let distance = getDistance(
          // User
          {
            latitude: userLocation.latitude
              ? userLocation.latitude
              : cityLocation.latitude,
            longitude: userLocation.longitude
              ? userLocation.longitude
              : cityLocation.longitude,
          },
          // Warehouse
          {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          1000
        );
        distances.push({
          id: location.id,
          name: location.name,
          distance: convertDistance(distance, "km"),
        });
      });

      // Sort manual dulu gan warehousenya for the nearest ambil attribute distance-nya.
      distances = distances.sort((a, b) => {
        if (a.distance < b.distance) {
          return -1;
        }
      });
      // console.log(distances);
      console.log(distances.map((item) => item.id));

      // let's took the sorted WarehouseID into maps.
      const warehouseDistanceId = distances.map((item) => item.id);

      const invoiceHeader = await Invoice_Headers.create({
        total,
        status,
        userAddressId,
        shipmentMasterId,
        userId,
        paymentOptionId,
        warehouseId: distances[0].id,
      });

      const invoiceDetails = await Invoice_Details.bulkCreate(
        cartItems.map((val) => ({
          price: val.product.price,
          quantity: val.quantity,
          subtotal: val.quantity * val.product.price,
          invoiceHeaderId: invoiceHeader.id,
          productId: val.productId,
        }))
      );

      const userCart = await Users.findByPk(userId, {
        attributes: ["id"],
        include: {
          model: Carts,
          attributes: ["quantity", "productId"],
          include: {
            model: Products,
            attributes: ["name"],
            include: {
              model: Warehouse_Products,
              attributes: [
                "id",
                "stock_ready",
                "stock_reserved",
                "warehouseId",
                "productId",
              ],
              include: { model: Warehouses, attributes: ["name"] },
              where: { warehouseId: warehouseDistanceId },
              required: true,
            },
          },
        },
      });
      console.log(userCart);

      await userCart.carts.forEach(async (item) => {
        const result = [];

        distances.forEach((distance) => {
          item.product.warehouse_products.forEach((warehouse) => {
            if (warehouse.warehouseId === distance.id) {
              result.push(distance.id);
            }
          });
        });
        console.log(result);

        Warehouse_Products.increment(
          {
            stock_reserved: item.quantity,
          },
          {
            where: {
              warehouseId: result[0],
              productId: item.productId,
            },
          }
        );

        Invoice_Details.update(
          { warehouseId: result[0] },
          {
            where: { productId: item.productId },
          }
        );

        const dataWarehouse = item.product.warehouse_products.find(
          (warehouse) => {
            return warehouse.warehouseId === result[0];
          }
        );

        if (dataWarehouse.stock_ready < item.quantity) {
          await Request_Log.create({
            product: item.productId,
            quantity: item.quantity - dataWarehouse.stock_ready,
            reqWarehouse: result[0],
          });
        }
      });

      res.status(200).send({
        message: "Invoice Has Been Generated Successfully",
        id: invoiceHeader.id,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getInvoiceHeader: async (req, res) => {
    try {
      const id = req.params.id;
      const invoiceHeader = await Invoice_Headers.findOne({
        where: { id: id },
        include: [
          {
            model: User_Addresses,
            attributes: [
              "address_line",
              "province",
              "city",
              "district",
              "postal_code",
            ],
          },
          { model: Invoice_Details, include: Products },
          { model: Shipment_Masters },
          { model: Payment_Options },
          {
            model: Warehouses,
            attributes: ["name", "address", "city", "province", "postal_code"],
          },
        ],
      });
      res.status(200).send(invoiceHeader);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  addPaymentProof: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      const { userId } = req.body;
      const data = req.body;
      if (req.file?.path) {
        data.payment_proof = req.file.path;
      }

      // const oldImage = await Payment_Confirmations.findOne({
      //   where: { userId },
      // });

      const paymentproof = await Payment_Confirmations.create(data);

      if (req.file.path) {
        await Invoice_Headers.update(
          { status: "pending" },
          {
            where: { status: "unpaid", userId: userId },
          }
        );
      }

      await Carts.destroy({ where: { userId } });
      res.status(200).send(paymentproof);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
    console.log(req.file);
  },
  getPaymentProof: async (req, res) => {
    try {
      const invoiceHeaderId = req.params.id;
      const paymentProof = await Payment_Confirmations.findOne({
        where: { invoiceHeaderId: invoiceHeaderId },
      });
      res.status(200).send(paymentProof);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  cancelTransactions: async (req, res) => {
    try {
      const { invoiceHeaderId } = req.body;

      const selectedInvoiceData = await Invoice_Details.findAll({
        where: { invoiceHeaderId },
        attributes: ["invoiceHeaderId", "quantity", "productId", "warehouseId"],
        include: {
          model: Products,
          include: {
            model: Warehouse_Products,
            attributes: ["stock_reserved"],
          },
        },
      });

      selectedInvoiceData.forEach(async (item) => {
        await Warehouse_Products.update(
          {
            stock_reserved:
              item.product.warehouse_products[0].stock_reserved - item.quantity,
          },
          {
            where: { productId: item.productId, warehouseId: item.warehouseId },
          }
        );
      });

      await Invoice_Headers.destroy({
        where: { id: invoiceHeaderId },
      });

      await Invoice_Details.destroy({
        where: { invoiceHeaderId },
      });

      res.status(200).send(selectedInvoiceData);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
};
