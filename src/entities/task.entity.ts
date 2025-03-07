import { Entity, Column, ObjectIdColumn, ObjectId } from "typeorm";

export enum TaskStatus {
    Pending = "Pending",
    InProgress = "In Progress",
    Completed = "Completed"
}

@Entity()
export class Task {
    @ObjectIdColumn()
    id!: ObjectId;

    @Column()
    user_id!: string;

    @Column()
    title!: string;

    @Column()
    description!: string;

    @Column()
    deadline!: Date;

    @Column({ type: "enum", enum: TaskStatus, default: TaskStatus.Pending })
    status!: TaskStatus;

    @Column()
    start_date!: Date;

    @Column()
    end_date!: Date;

    @Column({ default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;
}
