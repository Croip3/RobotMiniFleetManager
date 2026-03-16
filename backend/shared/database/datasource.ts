import "reflect-metadata";
import { DataSource } from "typeorm";
import type { DataSourceOptions } from "typeorm";
import type { TypeOrmConfig } from "./types/database.types.js";
import { Users } from "./entities/Users.js";
import { Robots } from "./entities/Robots.js";


const buildTypeOrmConfig = (config: TypeOrmConfig): DataSourceOptions => ({
  type: "postgres",
  host: config.host,
  port: Number(config.port),
  username: config.username,
  password: config.password,
  database: config.database,
  ssl: config.ssl ?? false,
  entities: [Users, Robots],
});

export const getDatasource = (config: TypeOrmConfig) => new DataSource(buildTypeOrmConfig(config));