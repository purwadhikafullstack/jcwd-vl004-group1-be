const router = require("express").Router();
const { paymentConfirmationController } = require("../controllers");

router.post("/", paymentConfirmationController.getPayment);
router.get("/:id", paymentConfirmationController.getPaymentById);
router.post("/:id/accept", paymentConfirmationController.acceptPayment);
router.post("/:id/reject", paymentConfirmationController.rejectPayment);

module.exports = router;
