
import 'dotenv/config';
import { storage } from "../server/storage";
import { generateToken } from "../server/middleware/auth";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

async function debugAvatarUpload() {
    try {
        console.log("Starting avatar upload debug...");

        // 1. Get a user
        const users = await storage.getUsers();
        const user = users[0];
        if (!user) {
            console.error("No users found to test with.");
            process.exit(1);
        }
        console.log(`Testing with user: ${user.username} (${user.id})`);

        // 2. Generate Token
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role
        });
        console.log("Token generated.");

        // 3. Test /api/health first
        console.log("Testing /api/health...");
        try {
            const healthRes = await axios.get("http://localhost:5000/api/health");
            console.log("Health Status:", healthRes.status);
            console.log("Health Data:", healthRes.data);
        } catch (e: any) {
            console.log("Health Error:", e.message);
            if (e.response) {
                console.log("Health Error Status:", e.response.status);
                console.log("Health Error Data:", e.response.data);
            }
        }

        // 4. Test /api/auth/me
        console.log("Testing /api/auth/me...");
        try {
            const meRes = await axios.get("http://localhost:5000/api/auth/me", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            console.log("ME Status:", meRes.status);
            console.log("ME Data:", meRes.data);
        } catch (e: any) {
            console.log("ME Error:", e.message);
            if (e.response) {
                console.log("ME Error Status:", e.response.status);
                console.log("ME Error Data:", e.response.data);
            }
        }

        // 5. Create a dummy image
        const testImagePath = path.join(process.cwd(), "test_avatar.jpg");
        if (!fs.existsSync(testImagePath)) {
            // Create a simple text file pretending to be an image if real image doesn't exist
            fs.writeFileSync(testImagePath, "fake image content");
        }

        // 6. Send Request
        const form = new FormData();
        form.append("avatar", fs.createReadStream(testImagePath));

        console.log("Sending upload request...");
        try {
            const response = await axios.post("http://localhost:5000/api/users/me/avatar", form, {
                headers: {
                    ...form.getHeaders(),
                    "Authorization": `Bearer ${token}`
                }
            });
            console.log("Response Status:", response.status);
            console.log("Response Data:", response.data);
        } catch (error: any) {
            if (error.response) {
                console.error("Error Response Status:", error.response.status);
                console.error("Error Response Data:", error.response.data);
            } else {
                console.error("Error:", error.message);
            }
        }

        console.log("Debug finished.");

        // Cleanup
        if (fs.readFileSync(testImagePath).toString() === "fake image content") {
            fs.unlinkSync(testImagePath);
        }

    } catch (error) {
        console.error("Unexpected error:", error);
    }
}

debugAvatarUpload();
