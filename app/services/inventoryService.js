const db = require('../../config'); // Import the initialized Firebase Admin instance
const ref = db.ref("/Inventory");

const updateInventory = async (data) => {
  console.log('Updating inventory with data:', data); // Log the data being saved
  await ref.set(data);
};

const getInventory = async () => {
  const snapshot = await ref.once('value');
  console.log('Fetched inventory data:', snapshot.val()); // Log the fetched data
  return snapshot.val();
};

module.exports = {
  updateInventory,
  getInventory,
};