const db = require("../db");
const Products = require("../models/Products");
const Product_Categories = require("../models/Product_Categories");
const Warehouse_Products = require("../models/Warehouse_Products");
const Warehouses = require("../models/Warehouses");
const Shipping_Product = require("../models/Shipping_Product");
const Operational_Cost = require("../models/Operational_Cost");
const { Op } = require("sequelize");
const sequelize = require("../lib/sequelize");

module.exports = {
  getWarehouses: async (req, res) => {
    try {
      let warehouses = await Warehouses.findAll({
        order: [["id", "DESC"]],
      });
      res.status(200).send(warehouses);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getWarehouseById: async (req, res) => {
    try {
      let id = req.params.id;
      let warehouses = await Warehouses.findAll({
        where: { id: id },
      });
      res.status(200).send(warehouses);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  addWarehouse: async (req, res) => {
    try {
      let data = {
        name: req.body.name,
        address: req.body.address,
        city: req.body.city,
        province: req.body.province,
        postal_code: req.body.postal_code,
        phone: req.body.phone,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      };
      const warehouse = await Warehouses.create(data);
      res.status(200).send(warehouse);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
    console.log(req.file);
  },
  updateWarehouse: async (req, res) => {
    try {
      let id = req.params.id;
      const warehouse = await Warehouses.update(req.body, {
        where: { id: id },
      });
      res.status(200).send(warehouse);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  addProduct: async (req, res) => {
    try {
      let data = {
        stock_ready: req.body.stock_ready,
        stock_reserved: req.body.stock_reserved,
        warehouseId: req.body.warehouseId,
        productId: req.body.productId,
      };
      const warehouse = await Warehouse_Products.create(data);
      res.status(200).send(warehouse);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
    console.log(req.file);
  },
  updateProduct: async (req, res) => {
    try {
      let id = req.params.id;
      const warehouse = await Warehouse_Products.update(req.body, {
        where: { id: id },
      });
      res.status(200).send(warehouse);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  deleteProduct: async (req, res) => {
    try {
      let id = req.params.id;
      await Warehouse_Products.destroy({ where: { id: id } });
      res.status(200).send("Warehouse Product Has Been Deleted");
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getWarehouseProductById: async (req, res) => {
    try {
      let id = req.params.id;
      let warehouses = await Warehouse_Products.findAll({
        where: { warehouseId: id },
        order: [["createdAt", "DESC"]],
        include: [{ model: Products }],
      });
      res.status(200).send(warehouses);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getAllWarehouseProductById: async (req, res) => {
    try {
      let id = req.params.id;
      let warehouses = await Warehouse_Products.findAll({
        where: { productId: id },
        include: [{ model: Warehouses }],
      });
      res.status(200).send(warehouses);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  addShipping: async (req, res) => {
    try {
      let data = {
        status: "requested",
        total_product: req.body.total_product,
        productId: req.body.productId,
        // warehouseProductId: req.body.warehouseProductId,
        warehouseReqId: req.body.warehouseReqId,
        warehouseResId: req.body.warehouseResId,
      };
      const shipping = await Shipping_Product.create(data);
      res.status(200).send(shipping);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
    console.log(req.file);
  },
  updateShipping: async (req, res) => {
    try {
      let id = req.params.id;
      const shipping = await Shipping_Product.update(req.body, {
        where: { id: id },
      });
      res.status(200).send(shipping);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  deleteShipping: async (req, res) => {
    try {
      let id = req.params.id;
      await Shipping_Product.destroy({ where: { id: id } });
      res.status(200).send("Shipping Product Has Been Deleted");
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getShippingById: async (req, res) => {
    try {
      let id = req.params.id;
      let shipping = await Shipping_Product.findAll({
        where: { warehouseResId: id },
        order: [["createdAt", "DESC"]],
        include: [
          { model: Products },
          { model: Warehouses, as: "warehouseReq" },
          { model: Warehouses, as: "warehouseRes" },
        ],
      });
      res.status(200).send(shipping);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  addOperationalCost: async (req, res) => {
    try {
      let data = {
        cost: req.body.cost,
        total_time: req.body.total_time,
        warehouseReqId: req.body.warehouseReqId,
        warehouseResId: req.body.warehouseResId,
      };
      const opcost = await Operational_Cost.create(data);
      res.status(200).send(opcost);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
    console.log(req.file);
  },
  updateOperationalCost: async (req, res) => {
    try {
      let id = req.params.id;
      const opcost = await Operational_Cost.update(req.body, {
        where: { id: id },
      });
      res.status(200).send(opcost);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  deleteOperationalCost: async (req, res) => {
    try {
      let id = req.params.id;
      await Operational_Cost.destroy({ where: { id: id } });
      res.status(200).send("Operational Cost Product Has Been Deleted");
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getOperationalCost: async (req, res) => {
    try {
      let id = req.params.id;
      let opcost = await Operational_Cost.findAll({
        where: { warehouseReqId: id },
        order: [["createdAt", "DESC"]],
        include: [
          { model: Warehouses, as: "warehouseReq" },
          { model: Warehouses, as: "warehouseRes" },
        ],
      });
      res.status(200).send(opcost);
    } catch (err) {
      res.status(500).send(err);
    }
  },
};
