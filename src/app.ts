import express, { Request, Response } from "express"; // Import Request and Response types
import cors from "cors";
import AppDataSource from "../src/config/app_data_source";
import taskRoutes from "../src/routes/task.route";
import {config} from "dotenv";

config()

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

app.use(express.json());


AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");

        // Root route
        app.get("/api/v1/", (req: Request, res: Response) => {
            res.send("Welcome to task management!");
        });

        // Use task routes
        app.use("/api", taskRoutes);

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });