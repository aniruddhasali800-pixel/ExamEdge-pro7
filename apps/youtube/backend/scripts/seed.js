import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../model/userModel.js";
import Channel from "../model/channelModel.js";
import Video from "../model/videoModel.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/youtube";

const seedData = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB.");

        // Clear existing data
        console.log("Clearing existing data...");
        await User.deleteMany({});
        await Channel.deleteMany({});
        await Video.deleteMany({});
        console.log("Data cleared.");

        const passwordHash = await bcrypt.hash("demo123", 10);

        const usersData = [
            {
                username: "TechGuru",
                email: "tech@example.com",
                password: passwordHash,
                photoUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=200&h=200&auto=format&fit=crop"
            },
            {
                username: "ChefJoy",
                email: "chef@example.com",
                password: passwordHash,
                photoUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=200&h=200&auto=format&fit=crop"
            },
            {
                username: "GamerPro",
                email: "gamer@example.com",
                password: passwordHash,
                photoUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&h=200&auto=format&fit=crop"
            }
        ];

        console.log("Creating users...");
        const createdUsers = await User.create(usersData);
        console.log(`${createdUsers.length} users created.`);

        const channelsData = [
            {
                name: "Future Tech",
                description: "Exploring the latest in gadgetry and software.",
                category: "Science & Tech",
                owner: createdUsers[0]._id,
                avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&h=150&auto=format&fit=crop"
            },
            {
                name: "Joyful Kitchen",
                description: "Simple recipes for a happy life.",
                category: "Cooking",
                owner: createdUsers[1]._id,
                avatar: "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?q=80&w=150&h=150&auto=format&fit=crop"
            },
            {
                name: "Pro Gaming Arena",
                description: "Live streams and high-level gameplay analysis.",
                category: "Gaming",
                owner: createdUsers[2]._id,
                avatar: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=150&h=150&auto=format&fit=crop"
            }
        ];

        console.log("Creating channels...");
        const createdChannels = await Channel.create(channelsData);
        console.log(`${createdChannels.length} channels created.`);

        // Link users to channels
        for (let i = 0; i < createdUsers.length; i++) {
            await User.findByIdAndUpdate(createdUsers[i]._id, { channel: createdChannels[i]._id });
        }

        const videosData = [
            {
                channel: createdChannels[0]._id,
                title: "Next-Gen Smartphone Review 2026",
                description: "An in-depth look at the latest folding smartphone features.",
                videoUrl: "https://res.cloudinary.com/demo/video/upload/v1631526486/sample_video.mp4",
                thumbnail: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=640&h=360&auto=format&fit=crop",
                tags: ["tech", "smartphone", "review"]
            },
            {
                channel: createdChannels[0]._id,
                title: "How to Build a Modern AI App",
                description: "Step-by-step guide to integrating AI into your workflow.",
                videoUrl: "https://res.cloudinary.com/demo/video/upload/v1631526486/sample_video.mp4",
                thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=640&h=360&auto=format&fit=crop",
                tags: ["ai", "development", "coding"]
            },
            {
                channel: createdChannels[1]._id,
                title: "The Secret to Perfect Pasta",
                description: "Tired of mushy pasta? Follow this guide for al dente perfection.",
                videoUrl: "https://res.cloudinary.com/demo/video/upload/v1631526486/sample_video.mp4",
                thumbnail: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=640&h=360&auto=format&fit=crop",
                tags: ["cooking", "pasta", "recipe"]
            },
            {
                channel: createdChannels[1]._id,
                title: "Summer Drinks Refreshment",
                description: "3 easy drinks to beat the heat this summer.",
                videoUrl: "https://res.cloudinary.com/demo/video/upload/v1631526486/sample_video.mp4",
                thumbnail: "https://images.unsplash.com/photo-1544145945-f904253db0ad?q=80&w=640&h=360&auto=format&fit=crop",
                tags: ["drinks", "summer", "refreshing"]
            },
            {
                channel: createdChannels[2]._id,
                title: "Epic Boss Battle Compilation",
                description: "The most intense moments from this month's streams.",
                videoUrl: "https://res.cloudinary.com/demo/video/upload/v1631526486/sample_video.mp4",
                thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640&h=360&auto=format&fit=crop",
                tags: ["gaming", "pro", "bossbattle"]
            },
            {
                channel: createdChannels[2]._id,
                title: "Top 5 Strategies for RPG Success",
                description: "Master any RPG with these simple but effective tips.",
                videoUrl: "https://res.cloudinary.com/demo/video/upload/v1631526486/sample_video.mp4",
                thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=640&h=360&auto=format&fit=crop",
                tags: ["gaming", "rpg", "strategy"]
            }
        ];

        console.log("Creating videos...");
        const createdVideos = await Video.create(videosData);
        console.log(`${createdVideos.length} videos created.`);

        // Link videos to channels
        for (const video of createdVideos) {
            await Channel.findByIdAndUpdate(video.channel, { $push: { videos: video._id } });
        }

        console.log("Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
};

seedData();
