const { deleteAllSalesDocuments } = require('../services/firestoreService');

const deleteSales = async (req, res) => {
    try {
        await deleteAllSalesDocuments();
        res.status(200).send('All sales documents deleted successfully.');
    } catch (error) {
        console.error('Error deleting sales documents: ', error);
        res.status(500).send('Failed to delete sales documents.');
    }
};

module.exports = {
    deleteSales
};