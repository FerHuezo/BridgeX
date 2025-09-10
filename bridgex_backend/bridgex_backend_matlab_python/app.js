import express from 'express';
import bodyParser from 'body-parser';
import bridgeRoutes from './routes/bridgeRoutes.js';

const app = express();
app.use(bodyParser.json());

app.use('/api/bridge', bridgeRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`BridgeX API running on port ${PORT}`));
