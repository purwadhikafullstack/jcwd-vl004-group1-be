const db = require("../db");
const Products = require("../models/Products");
const Product_Categories = require("../models/Product_Categories");
const Warehouse_Products = require("../models/Warehouse_Products");
const Warehouses = require("../models/Warehouses");
const { Op } = require("sequelize");
const sequelize = require("../lib/sequelize");
const fs = require("fs");

module.exports = {
  getProducts: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let { page, size } = req.query;
      if (!page) {
        page = 1;
      }
      if (!size) {
        size = 10;
      }
      const limit = +10;
      const skip = (page - 1) * size;
      let { rows, count } = await Products.findAndCountAll({
        nested: true,
        offset: skip,
        limit: limit,
        include: [
          { model: Product_Categories },
          { model: Warehouse_Products, include: Warehouses },
        ],
        attributes: [
          "id",
          "product_image",
          "name",
          "description",
          "price",
          "productCategoryId",
          [
            sequelize.literal(
              `(SELECT sum(stock_ready) from warehouse_products WHERE warehouse_products.productId = products.id)`
            ),
            "totalStock",
          ],
        ],
      });

      let productCount = await Products.findAll({});
      productCount = productCount.length;
      res.status(200).send({ rows, count, productCount });
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getProductById: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let id = req.params.id;
      let product = await Products.findByPk(id, {
        include: [
          { model: Product_Categories },
          { model: Warehouse_Products, include: Warehouses },
        ],
      });

      res.status(200).send(product);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  addProduct: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let data = {
        //use file to upload only a single image, not files.
        product_image: req.file.path,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        productCategoryId: req.body.productCategoryId,
      };
      const product = await Products.create(data);
      await product.createWarehouse_product({
        stock_ready: req.body.stock_ready,
        warehouseId: req.body.warehouseId,
        productId: product.id,
      });
      res.status(200).send(product);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
    console.log(req.file);
  },
  updateProduct: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let id = req.params.id;
      const data = req.body;
      if (req.file?.path) {
        data.product_image = req.file.path;
      }
      const oldImage = await Products.findByPk(id);

      const products = await Products.update(data, { where: { id: id } });
      const products2 = await Warehouse_Products.update(req.body, {
        where: { productId: id },
      });
      console.log(req.body);

      // must be path formatted.
      if (req.file?.path) {
        fs.unlinkSync(oldImage.product_image);
      }
      res.status(200).send({ products, products2 });
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  deleteProduct: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let { page, size } = req.query;
      if (!page) {
        page = 1;
      }
      if (!size) {
        size = 10;
      }
      const limit = +10;
      const skip = (page - 1) * size;
      let id = req.params.id;
      await Products.destroy({ where: { id: id } });

      await Warehouse_Products.destroy({
        where: { productId: id },
      });
      const { rows, count } = await Products.findAndCountAll({
        nested: true,
        offset: skip,
        limit: limit,
        include: [
          { model: Product_Categories },
          { model: Warehouse_Products, include: Warehouses },
        ],
        attributes: [
          "id",
          "product_image",
          "name",
          "description",
          "price",
          "productCategoryId",
          [
            sequelize.literal(
              `(SELECT sum(stock_ready) from warehouse_products WHERE warehouse_products.productId = products.id)`
            ),
            "totalStock",
          ],
        ],
      });
      let productCount = await Products.findAll({});
      productCount = productCount.length;
      res.status(200).send({ rows, count, productCount });
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  deleteCategories: async (req, res) => {
    // Product_Categories.sync({ alter: true });
    try {
      let id = req.params.id;
      await Product_Categories.destroy({ where: { id: id } });
      res.status(200).send("Categories Has Been Deleted");
    } catch (err) {
      res.status(500).send(err);
    }
  },
  searchProduct: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let { page, size } = req.query;
      if (!page) {
        page = 1;
      }
      if (!size) {
        size = 10;
      }
      const limit = +10;
      const skip = (page - 1) * size;

      let { rows, count } = await Products.findAndCountAll({
        nested: true,
        offset: skip,
        limit: limit,
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

      count = 1;

      let productCount = await Products.findAll({});
      productCount = productCount.length;

      res.status(200).send({ rows, count, productCount });
    } catch (err) {
      res.status(500).send(err);
      console.log(err);
    }
  },
  onSortNameAsc: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let { page, size } = req.query;
      if (!page) {
        page = 1;
      }
      if (!size) {
        size = 10;
      }
      const limit = +10;
      const skip = (page - 1) * size;

      const { rows, count } = await Products.findAndCountAll({
        nested: true,
        offset: skip,
        limit: limit,
        include: [
          { model: Product_Categories },
          { model: Warehouse_Products, include: Warehouses },
        ],
        order: [["name", "ASC"]],
      });

      let productCount = await Products.findAll({});
      productCount = productCount.length;

      res.status(200).send({ rows, count, productCount });
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  onSortNameDesc: async (req, res) => {
    try {
      let { page, size } = req.query;
      if (!page) {
        page = 1;
      }
      if (!size) {
        size = 10;
      }
      const limit = +10;
      const skip = (page - 1) * size;

      let { rows, count } = await Products.findAndCountAll({
        nested: true,
        offset: skip,
        limit: limit,
        include: [
          { model: Product_Categories },
          { model: Warehouse_Products, include: Warehouses },
        ],
        order: [["name", "DESC"]],
      });

      let productCount = await Products.findAll({});
      productCount = productCount.length;

      res.status(200).send({ rows, count, productCount });
    } catch (err) {
      res.status(500).send(err);
    }
  },
  onSortPriceAsc: async (req, res) => {
    try {
      let { page, size } = req.query;
      if (!page) {
        page = 1;
      }
      if (!size) {
        size = 10;
      }
      const limit = +10;
      const skip = (page - 1) * size;
      let { rows, count } = await Products.findAndCountAll({
        nested: true,
        offset: skip,
        limit: limit,
        include: [
          { model: Product_Categories },
          { model: Warehouse_Products, include: Warehouses },
        ],
        order: [["price", "ASC"]],
      });

      let productCount = await Products.findAll({});
      productCount = productCount.length;

      res.status(200).send({ rows, count, productCount });
    } catch (err) {
      res.status(500).send(err);
    }
  },
  onSortPriceDesc: async (req, res) => {
    try {
      let { page, size } = req.query;
      if (!page) {
        page = 1;
      }
      if (!size) {
        size = 10;
      }
      const limit = +10;
      const skip = (page - 1) * size;
      let { rows, count } = await Products.findAndCountAll({
        nested: true,
        offset: skip,
        limit: limit,
        include: [
          { model: Product_Categories },
          { model: Warehouse_Products, include: Warehouses },
        ],
        order: [["price", "DESC"]],
      });

      let productCount = await Products.findAll({});
      productCount = productCount.length;

      res.status(200).send({ rows, count, productCount });
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getCategories: async (req, res) => {
    // Product_Categories.sync({ alter: true });
    try {
      let categories = await Product_Categories.findAll({});
      res.status(200).send(categories);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  addProductCategory: async (req, res) => {
    // Product_Categories.sync({ alter: true });
    try {
      let data = {
        name: req.body.name,
        description: req.body.description,
      };

      const productCategory = await Product_Categories.create(data);
      res.status(200).send(productCategory);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getWarehouses: async (req, res) => {
    // Warehouses.sync({ alter: true });
    try {
      let warehouses = await Warehouses.findAll({});
      res.status(200).send(warehouses);
    } catch (err) {
      res.status(500).send(err);
    }
  },
};
