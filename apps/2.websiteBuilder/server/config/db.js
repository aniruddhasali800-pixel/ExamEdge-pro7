import mongoose from "mongoose"

const connectDb = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            console.warn("MONGODB_URL not found in .env, skipping DB connection");
            return;
        }
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("db connected")
    } catch (error) {
        console.error("db connection error:", error.message);
        console.log("Server will continue running in limited mode (no DB functionality)");
    }
}

export default connectDb