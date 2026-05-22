import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { dbInit } from './database.js';
import { startWhatsAppBot, disconnectWhatsAppBot, qrCodeDataURL, botStatus, sock } from './whatsapp.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const db = dbInit();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Seed admin user
const seedAdmin = async () => {
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
        if (!row) {
            const hash = await bcrypt.hash('admin123', 10);
            db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
        }
    });
}
seedAdmin();

// --- Auth Routes ---
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user: any) => {
        if (err || !user) return res.status(401).json({ error: 'User not found' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid password' });
        // Use standard jsonwebtoken
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true }).json({ user: { id: user.id, username: user.username, role: user.role } });
    });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token').json({ message: 'Logged out' });
});

app.get('/api/auth/me', (req, res) => {
   const token = req.cookies.token;
   if (!token) return res.status(401).json({ error: 'Not authenticated' });
   try {
       const user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
       res.json({ user });
   } catch (e) {
       res.status(401).json({ error: 'Invalid token' });
   }
});

// --- WhatsApp Bot Routes ---
app.get('/api/wa/status', (req, res) => {
    res.json({ status: botStatus, qr: qrCodeDataURL });
});

app.post('/api/wa/start', (req, res) => {
    if (botStatus === 'Disconnected') {
        startWhatsAppBot();
        res.json({ message: 'Bot started' });
    } else {
        res.json({ message: 'Bot already running or starting' });
    }
});

app.post('/api/wa/stop', (req, res) => {
    disconnectWhatsAppBot();
    res.json({ message: 'Bot disconnected' });
});

app.post('/api/wa/send', async (req, res) => {
    const { phone, message } = req.body;
    if (sock && botStatus === 'Connected') {
        try {
            const jid = `${phone.replace(/^0+/, '62').replace(/\D/g, '')}@s.whatsapp.net`;
            await sock.sendMessage(jid, { text: message });
            res.json({ message: 'Message sent successfully' });
        } catch (e: any) {
            res.status(500).json({ error: 'Failed to send: ' + e.message });
        }
    } else {
        res.status(500).json({ error: 'Bot is not connected' });
    }
});

// --- Settings ---
app.get('/api/settings', (req, res) => {
    db.all('SELECT * FROM settings', (err, rows: any[]) => {
        const settings = rows?.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {}) || {};
        res.json(settings);
    });
});

app.post('/api/settings', (req, res) => {
   const { key, value } = req.body;
   db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value], (err) => {
       if (err) return res.status(500).json({ error: err.message });
       res.json({ message: 'Setting saved' });
   });
});

// --- Generic CRUD Factory ---
const makeCrud = (table: string, allowedFields: string[]) => {
    app.get(`/api/${table}`, (req, res) => {
        db.all(`SELECT * FROM ${table}`, (err, rows) => {
            if (err) res.status(500).json({ error: err.message });
            else res.json(rows);
        });
    });

    app.post(`/api/${table}`, (req, res) => {
        const keys = Object.keys(req.body).filter(k => allowedFields.includes(k));
        const values = keys.map(k => req.body[k]);
        const placeholders = keys.map(() => '?').join(',');
        db.run(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`, values, function(err) {
            if (err) res.status(500).json({ error: err.message });
            else res.json({ id: this.lastID });
        });
    });

    app.put(`/api/${table}/:id`, (req, res) => {
        const keys = Object.keys(req.body).filter(k => allowedFields.includes(k));
        const values = keys.map(k => req.body[k]);
        const setString = keys.map(k => `${k} = ?`).join(',');
        db.run(`UPDATE ${table} SET ${setString} WHERE id = ?`, [...values, req.params.id], function(err) {
            if (err) res.status(500).json({ error: err.message });
            else res.json({ changes: this.changes });
        });
    });

    app.delete(`/api/${table}/:id`, (req, res) => {
        db.run(`DELETE FROM ${table} WHERE id = ?`, [req.params.id], function(err) {
             if (err) res.status(500).json({ error: err.message });
            else res.json({ changes: this.changes });
        });
    });
};

makeCrud('inventaris', ['nama', 'kategori', 'kondisi', 'status', 'foto']);
makeCrud('proker', ['nama', 'pj', 'tanggal_mulai', 'tanggal_selesai', 'deskripsi', 'status']);
makeCrud('piket', ['nama', 'hari', 'tanggal', 'jam', 'tugas', 'nomor_wa', 'pesan']);
makeCrud('wa_templates', ['nama', 'pesan']);

// --- Custom Users Endpoints ---
app.get('/api/users', (req, res) => {
    db.all('SELECT * FROM users', (err, rows: any[]) => {
        if (err) return res.status(500).json({ error: err.message });
        const sanitized = (rows || []).map(u => ({ id: u.id, username: u.username, role: u.role }));
        res.json(sanitized);
    });
});

app.post('/api/users', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role || 'user'], function(err: any) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this ? this.lastID : null, username, role });
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { username, password, role } = req.body;
    const userId = req.params.id;

    try {
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            db.run('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?', [username, hash, role, userId], function(err: any) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'User updated' });
            });
        } else {
            db.run('UPDATE users SET username = ?, role = ? WHERE id = ?', [username, role, userId], function(err: any) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'User updated' });
            });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, userToDel: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (userToDel && userToDel.username === 'admin') {
             return res.status(400).json({ error: 'Cannot delete the main admin account' });
        }
        db.run('DELETE FROM users WHERE id = ?', [userId], function(err: any) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'User deleted' });
        });
    });
});


// --- Vite Fullstack Setup ---
async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa'
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        // Use *all to handle Express v5 differences if applicable.
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
