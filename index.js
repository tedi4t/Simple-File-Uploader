const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Create 'uploads' folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer configuration for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// HTML form for file upload
app.get('/', (req, res) => {
  res.send(`
    <h2>File Upload</h2>
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file" required />
      <button type="submit">Upload</button>
    </form>
    <h3>Uploaded Files:</h3>
    <ul id="file-list"></ul>
    <script>
      async function fetchFiles() {
        const response = await fetch('/files');
        const files = await response.json();
        const list = document.getElementById('file-list');
        list.innerHTML = files.map(file => 
          \`<li><a href="/uploads/\${file}" target="_blank">\${file}</a></li>\`
        ).join('');
      }
      fetchFiles();
    </script>
  `);
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ message: 'File uploaded successfully', file: req.file.filename });
});

// Get list of uploaded files
app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to list files' });
    }
    res.json(files);
  });
});

// Delete a file
app.delete('/files/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json({ message: 'File deleted successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
