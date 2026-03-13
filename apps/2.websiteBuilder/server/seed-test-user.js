import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';

dotenv.config();

const seedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("DB Connected for seeding");

        const testUser = {
            name: "Test User",
            email: "test@example.com",
            credits: 5000,
            plan: "pro"
        };

        const existingUser = await User.findOne({ email: testUser.email });
        if (existingUser) {
            existingUser.credits = 5000;
            await existingUser.save();
            console.log("Updated existing test user credits");
        } else {
            await User.create(testUser);
            console.log("Created new test user");
        }

        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedUser();
