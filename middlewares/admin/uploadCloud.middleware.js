// uploadCloud.middleware.js
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_KEY, 
  api_secret: process.env.CLOUD_SECRET 
});

module.exports.upload = async (req, res, next) => {
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result.secure_url);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
    });

    try {
      const urls = await Promise.all(uploadPromises);
      req.body.hinhAnhUrls = urls; 
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi khi upload file lên Cloudinary' });
    }
  } else {
    next();
  }
};