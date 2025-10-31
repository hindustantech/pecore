
import supertest from "supertest";
import mongoose from "mongoose";
import app from "../index.js";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";

const request = supertest(app);

describe("Auth API", () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    it("should register a new user", async () => {
        const response = await request.post("/api/auth/register").send({
            name: "Test User",
            email: "test@example.com",
            mobile: "+1234567890",
            password: "password123"
        });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("User registered, OTP sent to email");
    });

    it("should not register a user with existing email", async () => {
        await User.create({
            name: "Test User",
            email: "test@example.com",
            mobile: "+1234567890",
            password: "password123"
        });

        const response = await request.post("/api/auth/register").send({
            name: "Test User 2",
            email: "test@example.com",
            mobile: "+0987654321",
            password: "password123"
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("User already exists");
    });
});
