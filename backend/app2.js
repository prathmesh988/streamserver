const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('video'), (req, res) => {
  // Process the uploaded video (for example, save it to disk or perform further processing)
  const videoBuffer = req.file.buffer;
  
  // Add your processing logic here

  // Send a response
  res.json({ success: true, message: 'Video uploaded successfully' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
