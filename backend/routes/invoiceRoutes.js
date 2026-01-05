const express = require("express");
const invoiceController = require("../controllers/invoiceController");

const router = express.Router();

router.post("/", invoiceController.create);
router.post("/checkout", invoiceController.createCheckoutInvoice);
router.get("/", invoiceController.getAll);
router.get("/:id", invoiceController.getById);
router.put("/:id", invoiceController.update);
router.delete("/:id", invoiceController.delete);

module.exports = router;
