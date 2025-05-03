const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Setup storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Load capsules
const capsulesFile = path.join('/tmp', 'capsules.json');
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
    const { message, unlockDateTime, password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const files = req.files;
    const id = capsules.length > 0 ? Math.max(...capsules.map(c => c.id)) + 1 : 1;

    const capsule = {
      id,
      message,
      unlockDateTime,
      password: hashedPassword,
      files: {}
    };

    if (files.image) capsule.files.image = `/tmp/${files.image[0].filename}`;
    if (files.video) capsule.files.video = `/tmp/${files.video[0].filename}`;
    if (files.pdf) capsule.files.pdf = `/tmp/${files.pdf[0].filename}`;

    capsules.push(capsule);
    await saveCapsules(capsules);
    res.json({ id });
  } catch (error) {
    console.error('Error creating capsule:', error);
    res.status(500).json({ error: 'Error creating capsule' });
  }
});

// Get a capsule by ID
app.post('/api/capsules/:id', async (req, res) => {
  try {
    const capsules = await loadCapsules();
    const capsule = capsules.find(c => c.id === parseInt(req.params.id));
    if (!capsule) {
      return res.status(404).json({ error: 'Capsule not found' });
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    const isPasswordValid = await bcrypt.compare(password, capsule.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
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

module.exports = app;