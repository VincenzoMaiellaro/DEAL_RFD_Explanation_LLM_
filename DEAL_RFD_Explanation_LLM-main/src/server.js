const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

mongoose.connect('mongodb+srv://admin:admin@progettouniversitario.7eqm09o.mongodb.net/?retryWrites=true&w=majority&appName=progettouniversitario')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

const jsonSchema = new mongoose.Schema({
  fileName: String,
  data: Object,
  timestamp: { type: Date, default: Date.now }
});

const JSONModel = mongoose.model('JSONModel', jsonSchema);

const upload = multer({ dest: 'uploads/' });

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const rawData = fs.readFileSync(filePath);
    const jsonData = JSON.parse(rawData);

    const newJSON = new JSONModel({ fileName, data: jsonData });
    await newJSON.save();

    fs.unlinkSync(filePath);
    console.log(`File ${fileName} removed from multer's temporary folder`);

    res.send('JSON file uploaded and saved to MongoDB!');
  } catch (error) {
    console.error('Error uploading the file:', error);
    res.status(500).send('Error uploading JSON file');
  }
});

/*
MULTIPLE FILE UPLOAD:

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const rawData = fs.readFileSync(filePath);
    const jsonData = JSON.parse(rawData);

    const parts = [];
    let currentPart = [];
    jsonData.forEach(obj => {
      if (obj.hasOwnProperty('dataset')) {
        if (currentPart.length !== 0) {
          parts.push(currentPart);
          currentPart = [];
        }
      }
      currentPart.push(obj);
    });
    if (currentPart.length !== 0) {
      parts.push(currentPart);
    }

    await Promise.all(parts.map(async (part, index) => {
      const fileNameWithIndex = `${fileName.split('.')[0]}(${index + 1}).json`;
      fs.writeFileSync(fileNameWithIndex, JSON.stringify(part, null, 2));

      const rawData = fs.readFileSync(fileNameWithIndex);
      const jsonData = JSON.parse(rawData);

      const newJSON = new JSONModel({ fileName: fileNameWithIndex, data: jsonData });
      await newJSON.save();

      console.log(`File ${fileNameWithIndex} uploaded to MongoDB`);
      
      fs.unlinkSync(fileNameWithIndex);
      console.log(`File ${fileNameWithIndex} removed from uploads directory`);
    }));

    fs.unlinkSync(filePath);
    console.log(`File ${fileName} removed from multer's temporary folder`);

    res.send('JSON files uploaded and saved to MongoDB!');
  } catch (error) {
    console.error('Error uploading the file:', error);
    res.status(500).send('Error uploading JSON files');
  }
});
*/

app.get('/files', async (req, res) => {
  try {
    const files = await JSONModel.find({}, '_id fileName timestamp').lean();
    res.json(files.map(file => ({
      ...file,
      timestamp: new Date(file.timestamp).toLocaleString()
    })));
  } catch (error) {
    console.error('Error retrieving file names:', error);
    res.status(500).json({ error: 'Error retrieving file names' });
  }
});

app.get('/files/:id', async (req, res) => {
  try {
    const file = await JSONModel.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving file content' });
  }
});


app.delete('/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const deletedFile = await JSONModel.findByIdAndDelete(fileId);
    if (!deletedFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting the file' });
  }
});


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.put('/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { fileName } = req.body;

    const updatedFile = await JSONModel.findByIdAndUpdate(fileId, { fileName }, { new: true });

    if (!updatedFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ message: 'File name updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating file name' });
  }
});


app.listen(port, () => console.log(`Server running on port ${port}`));
