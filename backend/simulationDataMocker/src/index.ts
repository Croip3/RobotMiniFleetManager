import 'reflect-metadata';
import express from 'express';
import config from 'config';
import { createRedisClient } from '@minifleetmanager/shared-redis';
import type { RedisConfig } from '@minifleetmanager/shared-redis';
import { getDatasource } from '../../shared/database/datasource.js';
import type { TypeOrmConfig } from '../../shared/database/types/database.types.js';
import { initSimulation, startSimulation } from './app/app.js';
import { createRouter } from './api/api.js';

const app = express();

interface SimulationConfig {
  port: number;
  intervalMs: number;
  speedMs: number;
}

const simulationConfig = config.get<SimulationConfig>('simulation');
const port = simulationConfig.port ?? 3002;

app.set('trust proxy', 1);
app.use(express.json());

const redisConfig = config.get<RedisConfig>('redis');
const redis = createRedisClient(redisConfig);
await redis.connect();

const dbConfig = config.get<TypeOrmConfig>('db');
const datasource = getDatasource(dbConfig);
await datasource.initialize();

initSimulation(redis, datasource, {
  speedMs: simulationConfig.speedMs,
  intervalMs: simulationConfig.intervalMs,
});

app.use('/', createRouter());

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Simulation service listening on port ${port}`);
  startSimulation()
});
