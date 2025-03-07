import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Task } from "../entities/task.entity";


dotenv.config();

const AppDataSource = new DataSource({
    type: "mongodb",
    url: process.env.MONGO_URI || "mongodb://localhost:27017/api-task-management",
    useNewUrlParser: true,
    useUnifiedTopology: true,
    synchronize: true,
    logging: true,
    entities: [Task],
    migrations: ["src/migrations/*.ts"],
});


export default AppDataSource;