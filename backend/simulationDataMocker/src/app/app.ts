import type { getDatasource } from '../../../shared/database/datasource.js';
import { Robots } from '../../../shared/database/entities/Robots.js';

type SimDatasource = ReturnType<typeof getDatasource>;

/** Minimal interface covering the Redis commands used by the simulator. */
interface SimulationRedisClient {
  geoAdd(
    key: string,
    members:
      | { longitude: number; latitude: number; member: string }
      | Array<{ longitude: number; latitude: number; member: string }>
  ): Promise<number>;
  hSet(key: string, values: Record<string, string>): Promise<number>;
}

const EARTH_RADIUS_M = 6_371_000;
const GEO_KEY = 'robots:geo';
const MAX_HEADING_CHANGE_RAD = Math.PI / 8; // ±22.5 degrees per tick

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let redisClient: SimulationRedisClient;
let datasource: SimDatasource;
let speedMs = 3;
let intervalMs = 2000;

/** Persists the current heading (radians) for each moving robot between ticks. */
const robotHeadings = new Map<number, number>();

export const initSimulation = (
  redis: SimulationRedisClient,
  ds: SimDatasource,
  config?: { speedMs?: number; intervalMs?: number }
): void => {
  redisClient = redis;
  datasource = ds;
  if (config?.speedMs !== undefined) speedMs = config.speedMs;
  if (config?.intervalMs !== undefined) intervalMs = config.intervalMs;
};

export const startSimulation = (): { message: string } => {
  if (simulationInterval) {
    return { message: 'Simulation already running' };
  }
  simulationInterval = setInterval(simulateTick, intervalMs);
  console.log('Simulation started');
  return { message: 'Simulation started' };
};

export const stopSimulation = (): { message: string } => {
  if (!simulationInterval) {
    return { message: 'Simulation not running' };
  }
  clearInterval(simulationInterval);
  simulationInterval = null;
  robotHeadings.clear();
  console.log('Simulation stopped');
  return { message: 'Simulation stopped' };
};

export const getSimulationStatus = (): { running: boolean } => ({
  running: simulationInterval !== null,
});

/**
 * Moves every robot whose status is "moving" by (speedMs * intervalMs/1000) metres
 * in a slightly randomised direction and writes the new position to both
 * PostgreSQL and Redis.
 *
 * Because the DB is queried on every tick, robots that are added or whose
 * status changes to "moving" after startup are automatically included.
 */
const simulateTick = async (): Promise<void> => {
  try {
    const robotsRepo = datasource.getRepository(Robots);
    const movingRobots = await robotsRepo.find({ where: { status: 'moving' } });

    const distanceMeters = speedMs * (intervalMs / 1000);
    const now = new Date().toISOString();

    for (const robot of movingRobots) {
      // Retrieve or initialise a heading for this robot.
      let heading = robotHeadings.get(robot.id);
      if (heading === undefined) {
        heading = Math.random() * 2 * Math.PI;
      }

      // Slightly vary the heading to simulate realistic curved movement.
      heading += (Math.random() - 0.5) * 2 * MAX_HEADING_CHANGE_RAD;
      robotHeadings.set(robot.id, heading);

      const { lat, lon } = movePosition(robot.lat, robot.lon, heading, distanceMeters);

      // Persist new position to PostgreSQL.
      robot.lat = lat;
      robot.lon = lon;
      await robotsRepo.save(robot);

      // Update Redis geospatial index.
      await redisClient.geoAdd(GEO_KEY, {
        longitude: lon,
        latitude: lat,
        member: String(robot.id),
      });

      // Update Redis hash with latest metadata.
      await redisClient.hSet(`robot:${robot.id}`, {
        lastUpdated: now,
        status: robot.status,
      });
    }

    // Remove stale headings for robots that are no longer "moving".
    const movingIds = new Set(movingRobots.map((r) => r.id));
    for (const id of robotHeadings.keys()) {
      if (!movingIds.has(id)) {
        robotHeadings.delete(id);
      }
    }
  } catch (err) {
    console.error('Simulation tick error:', err);
  }
};

/**
 * Calculates a new (lat, lon) after travelling `distanceMeters` in the given
 * `heading` (radians, measured clockwise from north).
 */
const movePosition = (
  lat: number,
  lon: number,
  heading: number,
  distanceMeters: number
): { lat: number; lon: number } => {
  const dLat = (distanceMeters * Math.cos(heading)) / EARTH_RADIUS_M * (180 / Math.PI);
  const dLon =
    (distanceMeters * Math.sin(heading)) /
    (EARTH_RADIUS_M * Math.cos((lat * Math.PI) / 180)) *
    (180 / Math.PI);

  return { lat: lat + dLat, lon: lon + dLon };
};
