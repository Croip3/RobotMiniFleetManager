console.log('FleetManager online')

import { createRedisClient } from "@minifleetmanager/shared-redis";
import type { RedisConfig } from '@minifleetmanager/shared-redis'
import config from 'config'

const redisConfig : RedisConfig = config.get('redis')
const redis = createRedisClient(redisConfig);

await redis.connect();

await redis.set("robot:1:status", "online");
console.log('Status test:', await redis.get("robot:1:status"));