import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

class EmailService {
    constructor() {
        if (!EmailService.instance) {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT),
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },

                // 🔥 DEBUG + OBSERVABILITY
                logger: true,
                debug: true,

                pool: true,
                maxConnections: 5,
                maxMessages: 100,

                tls: {
                    rejectUnauthorized: false, // helps in VPS issues
                },
            });

            // 🔍 Attach low-level listeners
            this._attachDebugListeners();

            EmailService.instance = this;
        }

        return EmailService.instance;
    }

    /**
     * 🔍 Attach SMTP lifecycle listeners
     */
    _attachDebugListeners() {
        this.transporter.on("idle", () => {
            console.log("[SMTP] Transport is idle, ready to send messages");
        });

        this.transporter.on("error", (err) => {
            console.error("[SMTP ERROR]", {
                message: err.message,
                code: err.code,
                response: err.response,
            });
        });
    }

    /**
     * 🔍 Verify SMTP Connection (Call this on server start)
     */
    async verifyConnection() {
        try {
            console.log("🔍 Verifying SMTP connection...");

            await this.transporter.verify();

            console.log("✅ SMTP Server is ready to send emails");
        } catch (error) {
            console.error("❌ SMTP Verification Failed:", {
                message: error.message,
                code: error.code,
                response: error.response,
            });

            // 🔥 Critical debug hints
            console.error("👉 Debug Checklist:");
            console.error("- Check EMAIL_USER & EMAIL_PASS");
            console.error("- Remove spaces from App Password");
            console.error("- Enable Gmail 2FA");
            console.error("- Restart PM2 with --update-env");
        }
    }

    /**
     * 🚀 Send Email with Debug Trace
     */
    async sendEmail({ to, subject, html, text }) {
        const start = Date.now();

        try {
            console.log("📤 Sending email:", {
                to,
                subject,
                from: process.env.EMAIL_FROM,
            });

            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to,
                subject,
                text,
                html,
            });

            console.log("✅ Email sent:", {
                messageId: info.messageId,
                response: info.response,
                timeTaken: `${Date.now() - start}ms`,
            });

            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error("❌ Email Send Failed:", {
                message: error.message,
                code: error.code,
                response: error.response,
                command: error.command,
                stack: error.stack,
            });

            // 🔥 Smart classification
            if (error.code === "EAUTH") {
                console.error("🚨 AUTH ISSUE DETECTED:");
                console.error("- Invalid Gmail credentials");
                console.error("- App password wrong or has spaces");
                console.error("- Gmail blocked login");
            }

            return {
                success: false,
                error: error.message,
            };
        }
    }
}

export default new EmailService();