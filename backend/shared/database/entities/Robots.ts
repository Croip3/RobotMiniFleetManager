import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from "typeorm";

export type RobotStatus = "idle" | "moving";

@Entity()
export class Robots {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "text" })
    name: string;

    @Column({ type: "enum", enum: ["idle", "moving"], default: "idle" })
    status: RobotStatus;

    @Column({ type: "double precision" })
    lat: number;

    @Column({ type: "double precision" })
    lon: number;

    @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    updated_at!: Date;
}