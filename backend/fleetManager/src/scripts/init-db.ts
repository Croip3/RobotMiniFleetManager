import config from "config";
import type { TypeOrmConfig } from "../types/database.types.js";
import { datasource } from "../database/datasource.js";
import * as bcrypt from 'bcrypt';
import { Users } from "../database/entities/Users.js";
import { Robots } from "../database/entities/Robots.js";

const configData = config.get<TypeOrmConfig>("db");

const ensureDatabaseExists = async () : Promise<void> => {
  const adminDataSource = datasource

  await adminDataSource.initialize();
  try {
    const result: Array<{ datname: string }> = await adminDataSource.query(
      "SELECT datname FROM pg_database WHERE datname = $1",
      [configData.database],
    );

    if (result.length === 0) {
      const escapedDbName = configData.database.replace(/"/g, '""');
      await adminDataSource.query(`CREATE DATABASE "${escapedDbName}"`);
      console.log(`Created database: ${configData.database}`);
    } else {
      console.log(`Database already exists: ${configData.database}`);
    }
  } finally {
    await adminDataSource.destroy();
  }
}

const ensureTablesExist = async (): Promise<void> => {
  const appDataSource = datasource
  await appDataSource.initialize();

  const queryRunner = appDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS robots (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('idle', 'moving')),
        lat DOUBLE PRECISION NOT NULL,
        lon DOUBLE PRECISION NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Ensured tables exist: users, robots");
  } finally {
    await queryRunner.release();
    await appDataSource.destroy();
  }
}

const addDevelopmentData = async (): Promise<void> => {
  if (!datasource.isInitialized) {
    await datasource.initialize();
  }

  try {
    const usersRepo = datasource.getRepository(Users);
    const robotsRepo = datasource.getRepository(Robots);

    const existingUser = await usersRepo.findOneBy({ email: "admin@test.com" });
    console.log('existingUser', existingUser)
    if (!existingUser) {
      const user = new Users();
      user.email = "admin@test.com";
      user.password_hash = await bcrypt.hash("test123", 10); 
      await usersRepo.save(user);
    }

    const existingRobot = await robotsRepo.findOneBy({ name: "Noo-Noo" });
    if (!existingRobot) {
      const robot = new Robots();
      robot.name = "Noo-Noo";
      robot.lat = 51.3406321;
      robot.lon = 12.3747329;
      robot.status = "idle";
      await robotsRepo.save(robot);
    }
  } finally {
    await datasource.destroy();
  }
};

const main = async (): Promise<void> => {
  try {
    await ensureDatabaseExists();
    await ensureTablesExist();
    await addDevelopmentData();
    console.log("Database initialization complete.");
  } catch (error) {
    console.error("Database initialization failed.", error);
    process.exitCode = 1;
  }
}

void main();
