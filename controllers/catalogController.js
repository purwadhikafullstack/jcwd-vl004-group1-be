const db = require("../db");
const Products = require("../models/Products");
const Product_Categories = require("../models/Product_Categories");
const Warehouse_Products = require("../models/Warehouse_Products");
const Warehouses = require("../models/Warehouses");

module.exports = {
  getProducts: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let products = await Products.findAll({
        order: [["createdAt", "DESC"]],
        include: {
          model: Warehouse_Products,
          Warehouses,
          Product_Categories,
          // showing only the name that you want to view
        },
      });
      res.status(200).send(products);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getProductById: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let id = req.params.id;
      let product = await Products.findOne({
        where: { id: id },
        include: {
          model: Warehouse_Products,
        },
      });
      res.status(200).send(product);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getProductByName: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let product = await Products.findAll({
        include: [
          { model: Product_Categories },
          { model: Warehouse_Products, include: Warehouses },
        ],
        where: {
          name: {
            [Op.substring]: req.body.name,
          },
        },
      });
      res.status(200).send(product);
    } catch (err) {
      res.status(500).send(err);
      console.log(err);
    }
  },
  getCategories: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let categories = await Product_Categories.findAll({});
      res.status(200).send(categories);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getCategoryById: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let id = req.params.id;
      let product = await Products.findAll({
        where: { productCategoryId: id },
        include: {
          model: Warehouse_Products,
          Warehouses,
          Product_Categories,
          // showing only the name that you want to view
        },
      });
      res.status(200).send(product);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  sortAZ: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let products = await Products.findAll({
        order: [["name", "ASC"]],
        include: {
          model: Warehouse_Products,
        },
      });
      res.status(200).send(products);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  sortZA: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let products = await Products.findAll({
        order: [["name", "DESC"]],
        include: {
          model: Warehouse_Products,
        },
      });
      res.status(200).send(products);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  highPrice: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let products = await Products.findAll({
        order: [["price", "DESC"]],
        include: {
          model: Warehouse_Products,
        },
      });
      res.status(200).send(products);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  lowPrice: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let products = await Products.findAll({
        order: [["price", "ASC"]],
        include: {
          model: Warehouse_Products,
        },
      });
      res.status(200).send(products);
    } catch (err) {
      res.status(500).send(err);
    }
  },
};
