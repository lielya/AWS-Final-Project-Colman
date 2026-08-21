const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const REGION = process.env.AWS_REGION || 'eu-central-1';

// 1. AWS S3 Configuration
const s3Client = new S3Client({ region: REGION });

// 2. MySQL / RDS Connection
const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'lla-db', // שם ה-Database
  port: 3306
});

const upload = multer({ storage: multer.memoryStorage() });

// Health check endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

// 3. Upload Endpoint
app.post('/upload-cv', upload.single('cv'), async (req, res) => {
  try {
    const file = req.file;
    const { name, cvNumber } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file attached.' });
    }

    const fileName = `resumes/${Date.now()}-${file.originalname}`;

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileName}`;

    // Write metadata to RDS (Table: lla-cv)
    const sqlQuery = 'INSERT INTO `lla-cv` (name, cv_number, file_url) VALUES (?, ?, ?)';
    const [result] = await dbPool.execute(sqlQuery, [name || 'Anonymous', cvNumber || 1, fileUrl]);

    res.status(200).json({
      message: 'Uploaded to S3 and saved to lla-cv table successfully!',
      recordId: result.insertId,
      s3Url: fileUrl
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`BackEnd running on port ${PORT}`));