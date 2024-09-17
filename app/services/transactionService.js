const { firestore, db } = require('../config/firebaseConfig');

const getTotalSalesByType = async (type) => {
  try {
    const ref = db.ref(`/TotalSales/${type}`);
    const snapshot = await ref.once('value');
    return snapshot.val();
  } catch (error) {
    console.error(`Error fetching total ${type} sales from Realtime Database:`, error);
    throw new Error(`Failed to fetch total ${type} sales`);
  }
};

const updateTotalSalesByType = async (type, newTotal) => {
  try {
    const ref = db.ref(`/TotalSales/${type}`);
    await ref.set(newTotal);
  } catch (error) {
    console.error(`Error updating total ${type} sales in Realtime Database:`, error);
    throw new Error(`Failed to update total ${type} sales`);
  }
};

const fetchTransactions = async () => {
  try {
    const snapshot = await firestore.collection('dailyReportSales').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const { size, ...filteredData } = data;
      return {
        transactionId: doc.id,
        date: (filteredData.date || 'N/A').toString(),
        amount: (filteredData.amount || 0).toString(),
        size: (filteredData.size || 'N/A').toString(),
        totalPages: (filteredData.totalPages || 'N/A').toString(),
        type: (filteredData.type || 'N/A').toString()
      };
    });
  } catch (error) {
    throw new Error('Failed to fetch transactions');
  }
};


const saveTransaction = async ({ date, amount, size, totalPages, type }) => {
  try {
    const transactionData = { date, amount, size, totalPages, type };

    await firestore.collection('dailyReportSales').add(transactionData);
    console.log('Transaction saved successfully in Firestore');

    const currentTotal = await getTotalSalesByType('totalAmount');
    const newTotal = currentTotal + amount;
    await updateTotalSalesByType('totalAmount', newTotal);
    console.log('Total sales updated successfully to:', newTotal);

    const typeMap = {
      Print: 'totalPrint',
      Scan: 'totalScan',
      Photocopy: 'totalCopy',
    };

    if (typeMap[type]) {
      const currentTotalByType = await getTotalSalesByType(typeMap[type]);
      const newTotalByType = currentTotalByType + amount;
      await updateTotalSalesByType(typeMap[type], newTotalByType);
      console.log(`${type} sales updated successfully to:`, newTotalByType);
    }

    return { success: true, message: 'Transaction saved successfully' };
  } catch (error) {
    console.error('Error in saveTransaction:', error);
    throw new Error('Failed to save transaction');
  }
};

module.exports = { 
  getTotalSalesByType, 
  updateTotalSalesByType, 
  saveTransaction, 
  fetchTransactions 
};
