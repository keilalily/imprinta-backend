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
