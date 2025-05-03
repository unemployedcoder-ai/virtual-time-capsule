const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Setup storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Load capsules
const capsulesFile = path.join(__dirname, 'capsules.json');
async function loadCapsules() {
  try {
    const data = await fs.readFile(capsulesFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save capsules
async function saveCapsules(capsules) {
  await fs.writeFile(capsulesFile, JSON.stringify(capsules, null, 2));
}

// Create a capsule
app.post('/api/capsules', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
  try {
    const capsules = await loadCapsules();
    const { message, unlockDateTime } = req.body;
    const files = req.files;
    const id = capsules.length > 0 ? Math.max(...capsules.map(c => c.id)) + 1 : 1;

    const capsule = {
      id,
      message,
      unlockDateTime,
      files: {}
    };

    if (files.image) capsule.files.image = `/uploads/${files.image[0].filename}`;
    if (files.video) capsule.files.video = `/uploads/${files.video[0].filename}`;
    if (files.pdf) capsule.files.pdf = `/uploads/${files.pdf[0].filename}`;

    capsules.push(capsule);
    await saveCapsules(capsules);
    res.json({ id });
  } catch (error) {
    console.error('Error creating capsule:', error);
    res.status(500).json({ error: 'Error creating capsule' });
  }
});

// Get a capsule by ID
app.get('/api/capsules/:id', async (req, res) => {
  try {
    const capsules = await loadCapsules();
    const capsule = capsules.find(c => c.id === parseInt(req.params.id));
    if (!capsule) {
      return res.status(404).json({ error: 'Capsule not found' });
    }
    res.json(capsule);
  } catch (error) {
    console.error('Error retrieving capsule:', error);
    res.status(500).json({ error: 'Error retrieving capsule' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});