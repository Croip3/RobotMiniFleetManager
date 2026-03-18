import { Router } from 'express';
import {
  startSimulation,
  stopSimulation,
  getSimulationStatus,
} from '../app/app.js';

export const createRouter = (): Router => {
  const router = Router();

  /** POST /simulation/start – begin the position simulation. */
  router.post('/simulation/start', (_req, res) => {
    const result = startSimulation();
    res.json(result);
  });

  /** POST /simulation/stop – halt the position simulation. */
  router.post('/simulation/stop', (_req, res) => {
    const result = stopSimulation();
    res.json(result);
  });

  /** GET /simulation/status – returns whether the simulation is currently running. */
  router.get('/simulation/status', (_req, res) => {
    res.json(getSimulationStatus());
  });

  return router;
};
