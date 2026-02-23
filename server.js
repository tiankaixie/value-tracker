const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  if (!fs.existsSync(DATA_FILE)) return { items: [] };
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get all items
app.get('/api/items', (req, res) => {
  const data = readData();
  res.json(data.items);
});

// Add item
app.post('/api/items', (req, res) => {
  const { name, price, purchaseDate, category } = req.body;
  if (!name || !price || !purchaseDate) {
    return res.status(400).json({ error: 'name, price, purchaseDate required' });
  }
  const data = readData();
  const item = {
    id: crypto.randomUUID(),
    name,
    price: parseFloat(price),
    purchaseDate,
    category: category || 'Uncategorized',
    createdAt: new Date().toISOString()
  };
  data.items.push(item);
  writeData(data);
  res.status(201).json(item);
});

// Update item
app.put('/api/items/:id', (req, res) => {
  const data = readData();
  const idx = data.items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  Object.assign(data.items[idx], req.body);
  data.items[idx].price = parseFloat(data.items[idx].price);
  writeData(data);
  res.json(data.items[idx]);
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
  const data = readData();
  data.items = data.items.filter(i => i.id !== req.params.id);
  writeData(data);
  res.status(204).end();
});

// Export data
app.get('/api/export', (req, res) => {
  const data = readData();
  res.setHeader('Content-Disposition', 'attachment; filename=value-tracker-export.json');
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Value Tracker running at http://localhost:${PORT}`);
});
