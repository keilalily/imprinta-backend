const db = require('../config/firebaseConfig');
const ref = db.ref("/Pricing");

exports.getPricing = async () => {
    const snapshot = await ref.once('value');
    return snapshot.val();
};

exports.updatePricing = async (pricing) => {
  console.log('Updating database with prices:', pricing);
    await ref.set(pricing);
    const updatedSnapshot = await ref.once('value');
    console.log('Updated database snapshot:', updatedSnapshot.val());
    return updatedSnapshot.val();
};