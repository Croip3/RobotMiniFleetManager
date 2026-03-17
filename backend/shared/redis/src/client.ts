import { createClient, type RedisClientType } from "redis";

export type RedisConfig = {
  host: string;
  port: number;
  password: string;
  username: string;
};

export const createRedisClient = (config: RedisConfig) => {
  const client = createClient({
    socket: {
      host: config.host,
      port: config.port,
    },
    password: config.password,
    username: config.username,
  });

  client.on("error", (err: any) => {
    console.error("Redis error:", err);
  });

  return client;
};