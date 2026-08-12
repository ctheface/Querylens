import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config, assertServerConfig } from './config.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import dataSourcesRouter from './routes/dataSources.js';
import askRouter from './routes/ask.js';
import demoRouter from './routes/demo.js';
import { errorHandler } from './middleware/errorHandler.js';

assertServerConfig();

const app = express();
// Behind a reverse proxy (Render, nginx) trust X-Forwarded-* so req.ip is the
// real client IP (demo rate limiter) and secure cookies work over TLS.
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/data-sources', dataSourcesRouter);
app.use('/api/demo', demoRouter);
app.use('/api', askRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`QueryLens API listening on http://localhost:${config.port}`);
});
