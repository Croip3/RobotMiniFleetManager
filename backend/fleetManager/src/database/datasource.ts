import "reflect-metadata";
import config from "config";
import { DataSource } from "typeorm";
import type { DataSourceOptions } from "typeorm";
import type { TypeOrmConfig } from "../types/database.types.js";
import { Users } from "./entities/Users.js";
import { Robots } from "./entities/Robots.js";

const configData = config.get<TypeOrmConfig>("db");

const buildTypeOrmConfig = (database = configData.database): DataSourceOptions => ({
  type: "postgres",
  host: configData.host,
  port: Number(configData.port),
  username: configData.username,
  password: configData.password,
  database,
  ssl: configData.ssl ?? false,
  entities: [Users, Robots],
});

export const datasource = new DataSource(buildTypeOrmConfig("postgres"));