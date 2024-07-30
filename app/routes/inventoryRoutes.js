const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');

router.put('/inventory', InventoryController.updateInventory);
router.get('/inventory', InventoryController.getInventory);

module.exports = router;