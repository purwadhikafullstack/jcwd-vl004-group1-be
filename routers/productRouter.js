const router = require("express").Router();
const { productController } = require("../controllers");
const { upload_product_image } = require("../lib/multer");

router.get("/", productController.getProducts);
router.get("/categories", productController.getCategories);
router.get("/warehouses", productController.getWarehouses);
router.get("/find/:id", productController.getProductById);
router.post("/search", productController.searchProduct);
router.post("/add", upload_product_image, productController.addProduct);
router.post("/addcategory", productController.addProductCategory);
router.patch(
  "/update/:id",
  upload_product_image,
  productController.updateProduct
);
router.delete("/delete/:id", productController.deleteProduct);
router.delete("/delete/categories/:id", productController.deleteCategories);
router.get("/sort/az", productController.onSortNameAsc);
router.get("/sort/za", productController.onSortNameDesc);
router.get("/sort/lowprice", productController.onSortPriceAsc);
router.get("/sort/highprice", productController.onSortPriceDesc);

module.exports = router;
