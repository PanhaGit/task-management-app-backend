import {Entity, Column, ObjectIdColumn, ObjectId, BeforeInsert} from "typeorm";

export enum TaskStatus {
    Todo = "todo",
    InProgress = "in_progress",
    Done = "done"
}


@Entity()
export class Task {
    @ObjectIdColumn()
    _id!: ObjectId;

    @Column()
    title!: string;

    @Column({ type: 'date' })
    start_date!: Date;

    @Column({ type: 'date' })
    end_date!: Date;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.Todo
    })
    status!: TaskStatus;

    @Column({ type: 'varchar', nullable: true })
    team_id?: string;

    @Column({ type: 'varchar', nullable: true })
    assigned_id?: string;

    @Column({ type: 'timestamp' })
    created_at!: Date;

    @BeforeInsert()
    setCreatedAt() {
        this.created_at = new Date();
    }
}