const inventoryService = require('../services/inventoryService');

exports.updateInventory = async (req, res) => {
  try {
    const data = req.body;
    console.log('Received data to update:', data); // Log the received data
    await inventoryService.updateInventory(data);
    res.status(200).send({ message: 'Inventory updated successfully' });
  } catch (error) {
    console.error('Error updating inventory:', error); // Log the error
    res.status(500).send({ message: 'Error updating inventory', error });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const data = await inventoryService.getInventory();
    console.log('Sending fetched inventory data:', data); // Log the data being sent
    res.status(200).send(data);
  } catch (error) {
    console.error('Error fetching inventory:', error); // Log the error
    res.status(500).send({ message: 'Error fetching inventory', error });
  }
};