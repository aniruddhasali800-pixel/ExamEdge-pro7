import { generateResponse } from "../config/openRouter.js";
import User from "../models/user.model.js";
import Website from "../models/website.model.js";
import extractJson from "../utils/extractJson.js";

const masterPrompt = `
YOU ARE A PRINCIPAL FRONTEND ARCHITECT
AND A SENIOR UI/UX ENGINEER
SPECIALIZED IN RESPONSIVE DESIGN SYSTEMS.

YOU BUILD HIGH-END, REAL-WORLD, PRODUCTION-GRADE WEBSITES
USING ONLY HTML, CSS, AND JAVASCRIPT
THAT WORK PERFECTLY ON ALL SCREEN SIZES.

THE OUTPUT MUST BE CLIENT-DELIVERABLE WITHOUT ANY MODIFICATION.

❌ NO FRAMEWORKS
❌ NO LIBRARIES
❌ NO BASIC SITES
❌ NO PLACEHOLDERS
❌ NO NON-RESPONSIVE LAYOUTS

--------------------------------------------------
USER REQUIREMENT:
{USER_PROMPT}
--------------------------------------------------

GLOBAL QUALITY BAR (NON-NEGOTIABLE)
--------------------------------------------------
- Premium, modern UI (2026–2027)
- Professional typography & spacing
- Clean visual hierarchy
- Business-ready content (NO lorem ipsum)
- Smooth transitions & hover effects
- SPA-style multi-page experience
- Production-ready, readable code

--------------------------------------------------
RESPONSIVE DESIGN (ABSOLUTE REQUIREMENT)
--------------------------------------------------
THIS WEBSITE MUST BE FULLY RESPONSIVE.

YOU MUST IMPLEMENT:

✔ Mobile-first CSS approach
✔ Responsive layout for:
  - Mobile (<768px)
  - Tablet (768px–1024px)
  - Desktop (>1024px)

✔ Use:
  - CSS Grid / Flexbox
  - Relative units (%, rem, vw)
  - Media queries

✔ REQUIRED RESPONSIVE BEHAVIOR:
  - Navbar collapses / stacks on mobile
  - Sections stack vertically on mobile
  - Multi-column layouts become single-column on small screens
  - Images scale proportionally
  - Text remains readable on all devices
  - No horizontal scrolling on mobile
  - Touch-friendly buttons on mobile

IF THE WEBSITE IS NOT RESPONSIVE → RESPONSE IS INVALID.

--------------------------------------------------
IMAGES (MANDATORY & RESPONSIVE)
--------------------------------------------------
- Use high-quality images ONLY from:
  https://images.unsplash.com/
- EVERY image URL MUST include:
  ?auto=format&fit=crop&w=1200&q=80

- Images must:
  - Be responsive (max-width: 100%)
  - Resize correctly on mobile
  - Never overflow containers

--------------------------------------------------
TECHNICAL RULES (VERY IMPORTANT)
--------------------------------------------------
- Output ONE single HTML file
- Exactly ONE <style> tag
- Exactly ONE <script> tag
- NO external CSS / JS / fonts
- Use system fonts only
- iframe srcdoc compatible
- SPA-style navigation using JavaScript
- No page reloads
- No dead UI
- No broken buttons
--------------------------------------------------
SPA VISIBILITY RULE (MANDATORY)
--------------------------------------------------
- Pages MUST NOT be hidden permanently
- If .page { display: none } is used,
  then .page.active { display: block } is REQUIRED
- At least ONE page MUST be visible on initial load
- Hiding all content is INVALID


--------------------------------------------------
FUNCTIONAL REQUIREMENTS (MANDATORY)
--------------------------------------------------
- Navigation must switch pages using JS (Active nav state must update)
- Forms must have JS validation
- Buttons must show hover + active states
- Smooth section/page transitions

--------------------------------------------------
ADAPTIVE PAGE STRUCTURE (MANDATORY)
--------------------------------------------------
- YOU MUST GENERATE PAGES THAT ARE RELEVANT TO THE USER REQUIREMENT.
- DO NOT default to a generic "Business" site if the user asks for something specific.
- EXAMPLES:
  - Food Delivery: Home, Menu, Order Tracking, Cart, Profile.
  - Car Delivery/Rental: Home, Fleet Listing, Booking, Locations.
  - Inventory: Dashboard, Inventory List, Add Item, Reports.
  - Restaurant: Home, Menu, Reservation, About.

- AT LEAST 4 DISTINCT PAGES/VIEWS ARE REQUIRED.

--------------------------------------------------
FINAL SELF-CHECK (MANDATORY)
--------------------------------------------------
BEFORE RESPONDING, ENSURE:

1. Layout works on mobile, tablet, desktop
2. No horizontal scroll on mobile
3. All images are responsive
4. All sections adapt properly
5. Media queries are present and used
6. Navigation works on all screen sizes
7. At least ONE page is visible without user interaction

IF ANY CHECK FAILS → RESPONSE IS INVALID

--------------------------------------------------
OUTPUT FORMAT (RAW JSON ONLY)
--------------------------------------------------
{
  "message": "Short professional confirmation sentence",
  "code": "<FULL VALID HTML DOCUMENT>"
}

--------------------------------------------------
ABSOLUTE RULES
--------------------------------------------------
- RETURN RAW JSON ONLY
- NO markdown
- NO explanations
- NO extra text
- FORMAT MUST MATCH EXACTLY
- IF FORMAT IS BROKEN → RESPONSE IS INVALID
`;


export const generateWebsite = async (req, res) => {
    try {
        const { prompt } = req.body
        if (!prompt) {
            return res.status(400).json({ message: "prompt is required" })
        }

        // Handle DB failure or missing user
        let user = req.user;
        if (!user) {
            console.warn("User not found in request, using hardcoded guest");
            user = { _id: "000000000000000000000000", credits: 999, save: async () => { } };
        }

        if (user.credits < 50) {
            return res.status(400).json({ message: "you have not enough credits to generate a website" })
        }

        const finalPrompt = masterPrompt.replace("{USER_PROMPT}", prompt)
        let raw = ""
        let parsed = null
        for (let i = 0; i < 2 && !parsed; i++) {
            try {
                raw = await generateResponse(finalPrompt)
                parsed = await extractJson(raw)

                if (!parsed) {
                    raw = await generateResponse(finalPrompt + "\n\nRETURN ONLY RAW JSON.")
                    parsed = await extractJson(raw)
                }
            } catch (apiErr) {
                console.error("AI Generation failed:", apiErr.message);
                return res.status(500).json({ message: `AI Generation error: ${apiErr.message}` });
            }
        }

        if (!parsed || !parsed.code) {
            console.log("ai returned invalid response", raw)
            return res.status(400).json({ message: "ai returned invalid response" })
        }

        let websiteId = "mock-id-" + Date.now();
        try {
            const website = await Website.create({
                user: user._id,
                title: prompt.slice(0, 60),
                latestCode: parsed.code,
                conversation: [
                    { role: "user", content: prompt },
                    { role: "ai", content: parsed.message }
                ]
            })
            websiteId = website._id;

            user.credits = user.credits - 50
            await user.save()
        } catch (dbErr) {
            console.error("Failed to save website to DB:", dbErr.message);
            // We still return the generated code if DB fails, allowing the user to see it
            return res.status(201).json({
                websiteId: websiteId,
                remainingCredits: user.credits,
                code: parsed.code,
                message: "Website generated but failed to save to database (Offline Mode)"
            });
        }

        return res.status(201).json({
            websiteId: websiteId,
            remainingCredits: user.credits
        })

    } catch (error) {
        console.error("Fatal error in generateWebsite:", error);
        return res.status(500).json({ message: `generate website error ${error.message}` })
    }
}


export const getWebsiteById = async (req, res) => {
    try {
        const { id } = req.params;

        // Handle Mock IDs from Offline Mode
        if (id.startsWith("mock-id")) {
            return res.status(200).json({
                _id: id,
                title: "Mock Website (Offline)",
                latestCode: "<!-- Generated code is only available in the generation response during offline mode -->",
                conversation: [],
                message: "This is a mock response because the database is offline."
            });
        }

        // Validate ObjectId to prevent CastError
        if (id.length !== 24) {
            return res.status(400).json({ message: "Invalid website ID format" });
        }

        const website = await Website.findOne({
            _id: id,
            user: req.user._id
        })

        if (!website) {
            return res.status(400).json({ message: "website not found" })
        }
        return res.status(200).json(website)
    } catch (error) {
        console.error("Error in getWebsiteById:", error);
        return res.status(500).json({ message: `get website by id error ${error.message || error}` })
    }
}


export const changes = async (req, res) => {
    try {
        const { prompt } = req.body
        if (!prompt) {
            return res.status(400).json({ message: "prompt is required" })
        }

        // Handle DB failure or missing user
        let user = req.user;
        if (!user) {
            console.warn("User not found in request, using hardcoded guest");
            user = { _id: "000000000000000000000000", credits: 999, save: async () => { } };
        }

        let website = null;
        try {
            website = await Website.findOne({
                _id: req.params.id,
                user: user._id
            })
        } catch (dbErr) {
            console.warn("DB failed while finding website, using mock for update");
            website = {
                latestCode: "<!-- Mock Code -->",
                conversation: [],
                save: async () => { }
            };
        }

        if (!website) {
            return res.status(400).json({ message: "website not found" })
        }

        if (user.credits < 25) {
            return res.status(400).json({ message: "you have not enough credits to update a website" })
        }

        const updatePrompt = `
UPDATE THIS HTML WEBSITE.

CURRENT CODE:
${website.latestCode}

USER REQUEST:
${prompt}

RETURN RAW JSON ONLY:
{
  "message": "Short confirmation",
  "code": "<UPDATED FULL HTML>"
}
`
        let raw = ""
        let parsed = null
        for (let i = 0; i < 2 && !parsed; i++) {
            try {
                raw = await generateResponse(updatePrompt)
                parsed = await extractJson(raw)

                if (!parsed) {
                    raw = await generateResponse(updatePrompt + "\n\nRETURN ONLY RAW JSON.")
                    parsed = await extractJson(raw)
                }
            } catch (apiErr) {
                console.error("AI Update failed:", apiErr.message);
                return res.status(500).json({ message: `AI Update error: ${apiErr.message}` });
            }
        }

        if (!parsed || !parsed.code) {
            console.log("ai returned invalid response", raw)
            return res.status(400).json({ message: "ai returned invalid response" })
        }

        try {
            website.conversation.push(
                { role: "user", content: prompt },
                { role: "ai", content: parsed.message },
            )

            website.latestCode = parsed.code
            await website.save()

            user.credits = user.credits - 25
            await user.save()
        } catch (dbErr) {
            console.error("Failed to save updated website to DB:", dbErr.message);
            return res.status(200).json({
                message: parsed.message,
                code: parsed.code,
                remainingCredits: user.credits,
                warning: "Update successful but failed to save to database (Offline Mode)"
            })
        }

        return res.status(200).json({
            message: parsed.message,
            code: parsed.code,
            remainingCredits: user.credits
        })

    } catch (error) {
        console.error("Fatal error in changes controller:", error);
        return res.status(500).json({ message: `update website error ${error.message}` })
    }
}



export const getAll = async (req, res) => {
    try {
        const websites = await Website.find({ user: req.user._id })
        return res.status(200).json(websites)
    } catch (error) {
        return res.status(500).json({ message: `get all websites error ${error}` })
    }
}


export const deploy = async (req, res) => {
    try {
        const { id } = req.params;

        if (id.startsWith("mock-id") || id.length !== 24) {
            return res.status(400).json({ message: "Cannot deploy a mock website or invalid ID" });
        }

        const website = await Website.findOne({
            _id: id,
            user: req.user._id
        })

        if (!website) {
            return res.status(400).json({ message: "website not found" })
        }

        if (!website.slug) {
            website.slug = website.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60) + website._id.toString().slice(-5)
        }

        website.deployed = true
        website.deployUrl = `${process.env.FRONTEND_URL}/site/${website.slug}`
        await website.save()

        return res.status(200).json({
            url: website.deployUrl
        })

    } catch (error) {
        return res.status(500).json({ message: `deploy website error ${error}` })
    }
}


export const getBySlug = async (req, res) => {
    try {
        const website = await Website.findOne({
            slug: req.params.slug
        })

        if (!website) {
            return res.status(400).json({ message: "website not found" })
        }
        return res.status(200).json(website)
    } catch (error) {
        return res.status(500).json({ message: `get by slug website error ${error.message || error}` })
    }
}