const { firestore, db } = require('../config/firebaseConfig');


const getTotalSales = async () => {
  try {
    const ref = db.ref('/TotalSales/totalAmount');  
    const snapshot = await ref.once('value');
    return snapshot.val();  // Return the current totalAmount
  } catch (error) {
    console.error('Error fetching total sales from Realtime Database:', error);
    throw new Error('Failed to fetch total sales');
  }
};

// Function to update total sales amount in Realtime Database
const updateTotalSales = async (newTotal) => {
  try {
    const ref = db.ref('/TotalSales/totalAmount');
    await ref.set(newTotal);  // Update the totalAmount with the newTotal
  } catch (error) {
    console.error('Error updating total sales in Realtime Database:', error);
    throw new Error('Failed to update total sales');
  }
};

const getTotalPrintSales = async () => {
  try {
    const ref = db.ref('/TotalSales/totalPrint');  
    const snapshot = await ref.once('value');
    return snapshot.val();  // Return the current totalPrint
  } catch (error) {
    console.error('Error fetching total print sales from Realtime Database:', error);
    throw new Error('Failed to fetch total print sales');
  }
};

// Function to update total sales for "Print" type
const updateTotalPrintSales = async (newTotal) => {
  try {
    const ref = db.ref('/TotalSales/totalPrint');
    await ref.set(newTotal);  // Update the totalPrint with the newTotal
  } catch (error) {
    console.error('Error updating total print sales in Realtime Database:', error);
    throw new Error('Failed to update total print sales');
  }
};

const getTotalScanSales = async () => {
  try {
    const ref = db.ref('/TotalSales/totalScan');  
    const snapshot = await ref.once('value');
    return snapshot.val();  // Return the current totalScan
  } catch (error) {
    console.error('Error fetching total scan sales from Realtime Database:', error);
    throw new Error('Failed to fetch total scan sales');
  }
};

// New: Function to update total sales for "Scan" type
const updateTotalScanSales = async (newTotal) => {
  try {
    const ref = db.ref('/TotalSales/totalScan');
    await ref.set(newTotal);  // Update the totalScan with the newTotal
  } catch (error) {
    console.error('Error updating total scan sales in Realtime Database:', error);
    throw new Error('Failed to update total scan sales');
  }
};

const getTotalCopySales = async () => {
  try {
    const ref = db.ref('/TotalSales/totalScan');  
    const snapshot = await ref.once('value');
    return snapshot.val();  // Return the current totalScan
  } catch (error) {
    console.error('Error fetching total scan sales from Realtime Database:', error);
    throw new Error('Failed to fetch total scan sales');
  }
};

// New: Function to update total sales for "Scan" type
const updateTotalCopySales = async (newTotal) => {
  try {
    const ref = db.ref('/TotalSales/totalScan');
    await ref.set(newTotal);  // Update the totalScan with the newTotal
  } catch (error) {
    console.error('Error updating total scan sales in Realtime Database:', error);
    throw new Error('Failed to update total scan sales');
  }
};





exports.saveTransaction = async ({ date, amount, size, totalPages, type }) => {
  try {
    // Ensure the data is passed as a valid object
    const transactionData = {date, amount, size, totalPages, type};

    await firestore.collection('dailyReportSales').add(transactionData); 
    console.log('Transaction saved successfully in Firestore');

    const currentTotal = await getTotalSales();
    console.log('Current total sales fetched:', currentTotal);

    const newTotal = currentTotal + amount;
    await updateTotalSales(newTotal);
    console.log('Total sales updated successfully to:', newTotal);

    if (type === 'Print') {
      const currentTotalPrint = await getTotalPrintSales();
      console.log('Current total print sales fetched:', currentTotalPrint);
      const newTotalPrint = currentTotalPrint + amount;
      await updateTotalPrintSales(newTotalPrint);
      console.log('Total print sales updated successfully to:', newTotalPrint);
    }

    if (type === 'Scan') {
      const currentTotalScan = await getTotalScanSales();
      console.log('Current total scan sales fetched:', currentTotalScan);

      const newTotalScan = currentTotalScan + amount;
      await updateTotalScanSales(newTotalScan);
      console.log('Total scan sales updated successfully to:', newTotalScan);
    }

    if (type === 'Copy') {
      const currentTotalCopy = await getTotalCopySales();
      console.log('Current total copy sales fetched:', currentTotalCopy);

      const newTotalCopy = currentTotalCopy + amount;
      await updateTotalCopySales(newTotalCopy);
      console.log('Total scopy sales updated successfully to:', newTotalCopy);
    }


    return { success: true, message: 'Transaction saved successfully' }; 

  } catch (error) { 
    console.error('Error in saveTransaction:', error);
    throw new Error('Failed to save transaction'); 

  } 

};