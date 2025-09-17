const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'notes-app',
    allowed_formats: ['jpg', 'png', 'gif', 'jpeg'],
    transformation: [{ width: 1000, crop: "limit" }]
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
