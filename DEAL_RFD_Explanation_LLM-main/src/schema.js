const mongoose = require('mongoose');

const jsonSchema = new mongoose.Schema({
  fileName: String,
  data: Object
});

const JSONModel = mongoose.model('JSONModel', jsonSchema);

module.exports = JSONModel;