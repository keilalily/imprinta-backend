const path = require('path');
const fileService = require('../services/fileService');

exports.upload = async (req, res) => {
  try {
    const { originalname, path: tempFilePath } = req.file;
    const responseData = await fileService.processUpload(originalname, tempFilePath);
    res.json(responseData);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
};

exports.exportData = async (req, res) => {
  const { data, action } = req.body;

  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateString = `${yyyy}${mm}${dd}`;
  const fileName = `${dateString}_SalesReport.xlsx`;
  const filePath = path.join(__dirname, 'output', fileName);

  try {
    const savedFilePath = await fileService.generateExcel(data, filePath);

    if (action === 'Send to Email') {
      const emailResult = await fileService.sendEmail(savedFilePath, fileName);
      res.send(`Email sent successfully. Message ID: ${emailResult.messageId}`);
    } else {
      res.send(`PDF saved locally at: ${savedFilePath}`);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Failed to process request: ' + error.message);
  }
  
};
