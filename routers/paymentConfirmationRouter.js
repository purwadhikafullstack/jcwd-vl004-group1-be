const router = require("express").Router();
const { paymentConfirmationController } = require("../controllers");

router.post("/", paymentConfirmationController.getPayment);
// router.get("/asc", paymentConfirmationController.getPaymentSortAsc);
// router.get("/desc", paymentConfirmationController.getPaymentSortDesc);
router.get("/:id", paymentConfirmationController.getPaymentById);
router.post("/:id/accept", paymentConfirmationController.acceptPayment);
router.post("/:id/reject", paymentConfirmationController.rejectPayment);

module.exports = router;
