const { db } = require('../config/firebaseConfig'); // Import the initialized Firebase Admin instance
const inventoryRef = db.ref("/Inventory");
const salesRef = db.ref("/TotalSales");

const updateInventory = async (data) => {
  console.log('Updating inventory with data:', data); // Log the data being saved
  await inventoryRef.set(data);
};

const getInventory = async () => {
  const snapshot = await inventoryRef.once('value');
  console.log('Fetched inventory data:', snapshot.val()); // Log the fetched data
  return snapshot.val();
};

module.exports = {
  updateInventory,
  getInventory,
};

