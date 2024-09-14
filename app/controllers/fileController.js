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
  const { filter, query, data, action } = req.body;

  try {
    await fileService.generatePDF(data, action, async (err, filePath, pdfStream) => {
      if (err) {
        return res.status(500).send('Failed to generate PDF');
      }
  
      if (action === 'Send to Email') {
        await fileService.sendEmail(filePath, (error, info) => {
          if (error) {
            console.log('Error sending email:', error);
            res.status(500).send('Failed to send email');
          } else {
            console.log('Email sent:', info.response);
            res.send('Email sent successfully');
          }
        });
      } else {
        res.send('PDF saved locally');
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Failed to generate PDF');
  }
  
};
