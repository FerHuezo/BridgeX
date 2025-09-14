import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import bridgeRoutes from './routes/bridgeRoutes.js';

const app = express();

// Configurar CORS para permitir peticiones desde el frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4000'], // Puertos comunes de Vite y otros dev servers
  credentials: true
}));

app.use(bodyParser.json());

// Middleware para logging de peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

app.use('/api/bridge', bridgeRoutes);

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BridgeX API running',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor', 
    details: error.message 
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`BridgeX API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Bridge analysis: http://localhost:${PORT}/api/bridge/analyze`);
});