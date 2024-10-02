const { firestore } = require('../config/firebaseConfig');

const deleteAllSalesDocuments = async () => {
    try {
        const salesCollection = firestore.collection('dailyReportSales');
        const snapshot = await salesCollection.get();

        if (snapshot.empty) {
            console.log('No documents found in the sales collection. Adding dummy document to prevent deletion.');
            await salesCollection.add({ dummy: true }); // add ng dummy para di madelete collection
        }

        const updatedSnapshot = await salesCollection.get();

        const batch = firestore.batch();
        let hasOtherDocuments = false; 

        updatedSnapshot.forEach((doc) => {
            if (!doc.data().dummy) {
                hasOtherDocuments = true; 
                batch.delete(salesCollection.doc(doc.id));
            }
        });

        if (hasOtherDocuments) {
            await batch.commit();
            console.log('Deleted all sales documents except the dummy document.');
        } else {
            console.log('No actual documents to delete, only dummy document exists.');
        }
    } catch (error) {
        console.error('Error deleting sales documents: ', error);
    }
};

module.exports = {
    deleteAllSalesDocuments
};
