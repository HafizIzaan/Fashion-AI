import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '10mb' }));

// Database file path
const DB_PATH = path.join(__dirname, 'database', 'data.json');

// Ensure database directory and file exist with initial mock data
function ensureDatabase() {
  const dbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const initialData = {
    library: [
      {
        id: 'lib_1',
        name: 'Oversized Wool Trench Coat',
        category: 'Outerwear',
        description: 'Double-breasted trench coat in premium light oatmeal melange virgin wool.',
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
        source: 'manual',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'lib_2',
        name: 'Silk Crepe de Chine Blouse',
        category: 'Tops',
        description: 'Minimalist ivory silk blouse with relaxed collar and mother-of-pearl buttons.',
        imageUrl: 'https://images.unsplash.com/photo-1548624149-f9b1859aa7d0?q=80&w=600&auto=format&fit=crop',
        source: 'manual',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'lib_3',
        name: 'Pleated Wide-Leg Trousers',
        category: 'Bottoms',
        description: 'Tailored trousers in textured charcoal wool blend with a relaxed drape.',
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop',
        source: 'manual',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'lib_4',
        name: 'Linen Belted Wrap Dress',
        category: 'Dresses',
        description: 'Mid-weight organic flax linen dress in black, with a self-tie waist belt.',
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop',
        source: 'manual',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'lib_5',
        name: 'Minimalist Leather Loafers',
        category: 'Shoes',
        description: 'Soft black calfskin loafers with a slim profile and stacked leather heel.',
        imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=600&auto=format&fit=crop',
        source: 'manual',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'lib_6',
        name: 'Structured Leather Tote Bag',
        category: 'Accessories',
        description: 'Sleek dark espresso leather tote with clean edge painting and interior pocket.',
        imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop',
        source: 'manual',
        createdAt: new Date().toISOString(),
      }
    ],
    results: [
      {
        id: 'res_1',
        name: 'Autumn Editorial Outfit',
        items: ['lib_1', 'lib_2', 'lib_3', 'lib_5'],
        imageUrl: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800&auto=format&fit=crop',
        creditCost: 15,
        isSaved: true,
        isShared: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    settings: {
      account: {
        name: 'Aiden Sterling',
        email: 'sterling.family@ais.dev',
        role: 'Admin',
      },
      aiProviders: {
        geminiKey: '',
        activeModel: 'gemini-2.5-pro',
      },
      credits: {
        balance: 145,
        totalUsed: 55,
      },
      preferences: {
        autoSave: false,
        highContrast: false,
      },
      members: [
        { id: 'm1', name: 'Aiden Sterling', role: 'Admin', email: 'sterling.family@ais.dev' },
        { id: 'm2', name: 'Elena Sterling', role: 'Member', email: 'elena.family@ais.dev' },
        { id: 'm3', name: 'Julian Sterling', role: 'Member', email: 'julian.family@ais.dev' },
      ]
    }
  };

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  } else {
    // If it exists but is corrupted or empty
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      JSON.parse(content);
    } catch (e) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    }
  }
}

ensureDatabase();

// Load data helper
function readDB() {
  ensureDatabase();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

// Write data helper
function writeDB(data: any) {
  ensureDatabase();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// API Routes
app.get('/api/data', (_req, res) => {
  try {
    const data = readDB();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to read database', details: error.message });
  }
});

app.post('/api/library/add', (req, res) => {
  try {
    const { name, category, description, imageUrl, source } = req.body;
    if (!name || !category || !imageUrl) {
      return res.status(400).json({ error: 'Name, category, and imageUrl are required.' });
    }

    const data = readDB();
    const newItem = {
      id: `lib_${Date.now()}`,
      name,
      category,
      description: description || '',
      imageUrl,
      source: source || 'manual',
      createdAt: new Date().toISOString(),
    };

    data.library.unshift(newItem);
    writeDB(data);
    res.status(201).json(newItem);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add item', details: error.message });
  }
});

app.post('/api/library/delete', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Item ID is required.' });
    }

    const data = readDB();
    data.library = data.library.filter((item: any) => item.id !== id);
    writeDB(data);
    res.json({ success: true, message: 'Item deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete item', details: error.message });
  }
});

// AI Outfit Scan simulating detection
app.post('/api/library/scan', async (req, res) => {
  try {
    const { image } = req.body; // base64 or URL
    if (!image) {
      return res.status(400).json({ error: 'Image is required for scanning.' });
    }

    // Spend credits
    const data = readDB();
    if (data.settings.credits.balance < 5) {
      return res.status(400).json({ error: 'Insufficient credits (5 required).' });
    }

    // Deduct credits
    data.settings.credits.balance -= 5;
    data.settings.credits.totalUsed += 5;

    // Simulate AI scan with gorgeous high-quality garment detections
    const detections = [
      {
        id: 'det_1',
        category: 'Outerwear',
        description: 'Double-breasted oatmeal wool trench coat with tailored lapels',
        confidence: 96,
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
        selected: true,
      },
      {
        id: 'det_2',
        category: 'Tops',
        description: 'Ivory silk collarless drape blouse',
        confidence: 92,
        imageUrl: 'https://images.unsplash.com/photo-1548624149-f9b1859aa7d0?q=80&w=600&auto=format&fit=crop',
        selected: true,
      },
      {
        id: 'det_3',
        category: 'Bottoms',
        description: 'Charcoal pleated wide-leg wool trousers',
        confidence: 94,
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop',
        selected: true,
      },
      {
        id: 'det_4',
        category: 'Shoes',
        description: 'Black minimalist leather loafers',
        confidence: 89,
        imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=600&auto=format&fit=crop',
        selected: false,
      }
    ];

    writeDB(data);

    res.json({
      success: true,
      detections,
      creditsSpent: 5,
      newBalance: data.settings.credits.balance,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Scanning failed', details: error.message });
  }
});

// Extract scanned items into library
app.post('/api/library/extract', (req, res) => {
  try {
    const { items } = req.body; // list of items with name, category, description, imageUrl
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items list is required.' });
    }

    const data = readDB();
    const extractionCost = items.length * 10;

    if (data.settings.credits.balance < extractionCost) {
      return res.status(400).json({ error: `Insufficient credits (${extractionCost} required for ${items.length} items).` });
    }

    // Deduct credits
    data.settings.credits.balance -= extractionCost;
    data.settings.credits.totalUsed += extractionCost;

    const savedItems: any[] = [];
    items.forEach((item: any) => {
      const newItem = {
        id: `lib_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: item.name || `${item.category} (Extracted)`,
        category: item.category,
        description: item.description || '',
        imageUrl: item.imageUrl,
        source: 'scan',
        createdAt: new Date().toISOString(),
      };
      data.library.unshift(newItem);
      savedItems.push(newItem);
    });

    writeDB(data);
    res.json({
      success: true,
      extracted: savedItems,
      creditsSpent: extractionCost,
      newBalance: data.settings.credits.balance,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Extraction failed', details: error.message });
  }
});

// Studio generate outfit
app.post('/api/studio/generate', (req, res) => {
  try {
    const { items, prompt, tempBaseImage: _tempBaseImage } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items selected for the outfit.' });
    }

    const data = readDB();
    const cost = 25; // standard studio cost

    if (data.settings.credits.balance < cost) {
      return res.status(400).json({ error: `Insufficient credits (${cost} credits required).` });
    }

    // Deduct credits
    data.settings.credits.balance -= cost;
    data.settings.credits.totalUsed += cost;

    // AI Outfit Generation Simulation with high end results
    // We match the model outputs to gorgeous editorial portraits
    const resultsPool = [
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop'
    ];

    const randomImg = resultsPool[Math.floor(Math.random() * resultsPool.length)];

    const newResult = {
      id: `res_${Date.now()}`,
      name: prompt ? `Studio: ${prompt}` : 'Studio Generated Outfit',
      items: items,
      imageUrl: randomImg,
      creditCost: cost,
      isSaved: false,
      isShared: false,
      createdAt: new Date().toISOString(),
    };

    // Save temporary state in data, but result is not persistent unless user clicks save
    // Wait, the specification says: "Temporary uploads are not permanent records unless the user explicitly saves them."
    // And "Generated results are private by default."
    // So we can return it as temporary, or store it in list but mark as isSaved = false. Let's do that!
    data.results.unshift(newResult);

    writeDB(data);

    res.json({
      success: true,
      result: newResult,
      creditsSpent: cost,
      newBalance: data.settings.credits.balance,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Generation failed', details: error.message });
  }
});

// Save temporary result permanently
app.post('/api/results/save', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Result ID is required.' });
    }

    const data = readDB();
    const resultItem = data.results.find((r: any) => r.id === id);
    if (!resultItem) {
      return res.status(404).json({ error: 'Result not found.' });
    }

    resultItem.isSaved = true;
    writeDB(data);

    res.json({ success: true, result: resultItem });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save result', details: error.message });
  }
});

// Share result with family
app.post('/api/results/share', (req, res) => {
  try {
    const { id, isShared } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Result ID is required.' });
    }

    const data = readDB();
    const resultItem = data.results.find((r: any) => r.id === id);
    if (!resultItem) {
      return res.status(404).json({ error: 'Result not found.' });
    }

    resultItem.isShared = isShared !== undefined ? isShared : true;
    writeDB(data);

    res.json({ success: true, result: resultItem });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update share state', details: error.message });
  }
});

// Delete result
app.post('/api/results/delete', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Result ID is required.' });
    }

    const data = readDB();
    data.results = data.results.filter((item: any) => item.id !== id);
    writeDB(data);
    res.json({ success: true, message: 'Result deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete result', details: error.message });
  }
});

// Update settings
app.post('/api/settings/update', (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ error: 'Settings object is required.' });
    }

    const data = readDB();
    data.settings = { ...data.settings, ...settings };
    writeDB(data);
    res.json({ success: true, settings: data.settings });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update settings', details: error.message });
  }
});

// Add credits admin action
app.post('/api/admin/add-credits', (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Valid numeric amount is required.' });
    }

    const data = readDB();
    data.settings.credits.balance += amount;
    writeDB(data);

    res.json({ success: true, credits: data.settings.credits });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add credits', details: error.message });
  }
});

// Setup dev server or static serve
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite Dev Server middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    // Use Vite middlewares
    app.use(vite.middlewares);

    // Serve HTML
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Serve production static assets
    app.use(express.static(path.join(__dirname, 'dist')));
    
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
