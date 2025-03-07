import AppDataSource from "./app_data_source";

export const connectDB:()=>Promise<void> = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};