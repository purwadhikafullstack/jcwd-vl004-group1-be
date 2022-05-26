const router = require("express").Router();
const { transactionController } = require("../controllers");

router.post("/", transactionController.getTransaction);
router.get("/:id", transactionController.getTransactionById);
router.post("/:id", transactionController.checkStock);
router.patch("/:id", transactionController.changeTransactionStatus);
router.post("/:id/deliver", transactionController.deliver);
router.post("/:id/reject", transactionController.rejectTransaction);

module.exports = router;
