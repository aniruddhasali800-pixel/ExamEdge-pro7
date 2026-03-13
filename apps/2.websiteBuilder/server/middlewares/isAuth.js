import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
const isAuth = async (req, res, next) => {
    const hardcodedGuest = {
        _id: "000000000000000000000000",
        name: "Offline Guest",
        email: "guest@examedge.com",
        credits: 999,
        save: async () => { } // Mock save method
    };

    try {
        const token = req.cookies.token
        if (!token) {
            try {
                let guest = await User.findOne({ email: "guest@examedge.com" });
                if (!guest) {
                    guest = await User.create({
                        name: "Guest Student",
                        email: "guest@examedge.com",
                        credits: 100
                    });
                }
                req.user = guest;
            } catch (dbErr) {
                console.warn("DB unavailable in isAuth, using offline guest");
                req.user = hardcodedGuest;
            }
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = await User.findById(decoded.id)
            if (!req.user) {
                let guest = await User.findOne({ email: "guest@examedge.com" });
                req.user = guest || hardcodedGuest;
            }
        } catch (innerErr) {
            req.user = hardcodedGuest;
        }
        next()
    } catch (error) {
        req.user = hardcodedGuest;
        next();
    }
}

export default isAuth
