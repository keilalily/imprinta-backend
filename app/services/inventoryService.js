const { db } = require('../config/firebaseConfig'); // Import the initialized Firebase Admin instance
const ref = db.ref("/Inventory");

// //try
// const updateInventory = async (data) => {
//   const { paperType, pagesUsed } = data;

//   // Fetch current inventory
//   const snapshot = await ref.once('value');
//   const inventory = snapshot.val();

//   // Subtract the pages used from the inventory
//   if (paperType === 'shortBondPaper') {
//     inventory.shortBondPaper -= pagesUsed;
//   } else if (paperType === 'longBondPaper') {
//     inventory.longBondPaper -= pagesUsed;
//   }

//   // Update the inventory in the database
//   await ref.set(inventory);
//   return inventory; // Return updated inventory
// };

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