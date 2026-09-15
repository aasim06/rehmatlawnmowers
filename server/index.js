import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';
import stockRoutes from './routes/stock.js';
import repairsRoutes from './routes/repairs.js';
import salesRoutes from './routes/sales.js';
import vendorsRoutes from './routes/vendors.js';
import customersRoutes from './routes/customers.js';
import reportsRoutes from './routes/reports.js';
import backupRoutes from './routes/backup.js';
import expensesRoutes from './routes/expenses.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Rehmat Lawn Mowers ERP Backend',
    database: 'Neon Serverless PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/repairs', repairsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/backup', backupRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Rehmat Lawn Mowers Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Connected to Neon Serverless PostgreSQL Database\n`);
});

export default app;
