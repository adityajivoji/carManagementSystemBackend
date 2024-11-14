const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

// Create an S3 client instance using AWS SDK v3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME, // Your S3 bucket name
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `car-photos/${Date.now()}_${file.originalname}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max file size: 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image file!'), false);
    }
  }
});

module.exports = upload;
