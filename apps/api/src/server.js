import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config, assertServerConfig } from './config.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import dataSourcesRouter from './routes/dataSources.js';
import askRouter from './routes/ask.js';
import { errorHandler } from './middleware/errorHandler.js';

assertServerConfig();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/data-sources', dataSourcesRouter);
app.use('/api', askRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`QueryLens API listening on http://localhost:${config.port}`);
});
