import nodemailer from "nodemailer";

/**
 * Singleton Transporter (connection pooling like enterprise systems)
 */
class EmailService {
    constructor() {
        if (!EmailService.instance) {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT),
                secure: false, // true for 465
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                pool: true, // 🔥 connection pooling (high performance)
                maxConnections: 5,
                maxMessages: 100,
            });

            EmailService.instance = this;
        }

        return EmailService.instance;
    }

    /**
     * Generic Send Email Function
     * @param {Object} options
     * @param {string|string[]} options.to
     * @param {string} options.subject
     * @param {string} options.html
     * @param {string} [options.text]
     */
    async sendEmail({ to, subject, html, text }) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject,
                text,
                html,
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error("Email Error:", error);

            return {
                success: false,
                error: error.message,
            };
        }
    }
}

export default new EmailService();