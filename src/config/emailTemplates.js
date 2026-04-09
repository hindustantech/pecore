// emailService.js
import { config } from "../config/index.js";
import nodemailer from "nodemailer";
import { logger } from "../config/logger.js";

// Create transporter once (reusable)
const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
        user: config.emailUser,
        pass: config.emailPass
    }
});

// Verify transporter connection (optional but recommended)
transporter.verify((error, success) => {
    if (error) {
        logger.error("Email transporter error:", error);
    } else {
        logger.info("Email server is ready to send messages");
    }
});

// Template for lead notification to admin
export const leadTemplate = (lead) => {
    return `
    <div style="margin:0; padding:0; background:#eef2f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial;">
      
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
        <tr>
          <td align="center">
            
            <!-- Main Card -->
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding:24px; color:#ffffff;">
                  <h2 style="margin:0; font-size:20px;">🚀 New Lead Captured</h2>
                  <p style="margin:6px 0 0; font-size:13px; opacity:0.9;">
                    A new company lead has been added to your pipeline
                  </p>
                </td>
              </tr>

              <!-- Badge -->
              <tr>
                <td style="padding:16px 24px 0;">
                  <span style="
                    display:inline-block;
                    padding:6px 12px;
                    font-size:12px;
                    background:#ecfdf5;
                    color:#065f46;
                    border-radius:20px;
                    font-weight:600;
                  ">
                    ● Active Lead
                  </span>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:20px 24px;">
                  
                  <table width="100%" style="border-collapse:collapse; font-size:14px;">
                    
                    ${row("👤 Name", lead.name)}
                    ${row("📧 Email", lead.email)}
                    ${row("📱 Phone", lead.phoneNumber)}
                    ${row("💬 WhatsApp", lead.whatsappNumber)}
                    ${row("🏢 Company", lead.companyName)}
                    ${row("📊 Company Size", lead.companySize)}
                    ${row("📍 Address", lead.address)}
                    ${row("🏷 Tags", lead.tags?.join(", "))}
                    ${row("🌐 Source", lead.source)}
                    ${row("⏱ Created", new Date(lead.createdAt).toLocaleString())}

                  </table>

                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding:0 24px;">
                  <hr style="border:none; border-top:1px solid #e5e7eb;" />
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding:20px 24px; text-align:center;">
                  <a href="${process.env.FRONTEND_URL}/leads"
                    style="
                      display:inline-block;
                      background:#4f46e5;
                      color:#ffffff;
                      padding:12px 20px;
                      border-radius:8px;
                      text-decoration:none;
                      font-weight:600;
                      font-size:14px;
                    ">
                    View Lead Dashboard →
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#6b7280;">
                  <p style="margin:0;">CRM System • Auto-generated notification</p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </div>
    `;
};

// Row Helper (Reusable + Clean)
const row = (label, value) => `
  <tr>
    <td style="padding:10px 0; color:#6b7280; width:40%; font-weight:500;">
      ${label}
    </td>
    <td style="padding:10px 0; color:#111827; font-weight:600;">
      ${value || "-"}
    </td>
  </tr>
`;

// Template for auto-reply to lead
export const leadReplyTemplate = ({
    name,
    companyName,
    salesPersonName,
    meetingLink,
    contactEmail,
    contactPhone,
}) => {
    return `
    <div style="margin:0; padding:0; background:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial;">
      
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
        <tr>
          <td align="center">
            
            <!-- Card -->
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding:24px; color:#ffffff;">
                  <h2 style="margin:0;">Thank you for exploring our solutions and for your interest in our company., ${name} 👋</h2>
                  <p style="margin:6px 0 0; font-size:13px; opacity:0.9;">
                  We have received your inquiry and will get in touch with you shortly.
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:24px; font-size:14px; color:#111827; line-height:1.6;">
                  
                  <p>Hi <b>${name}</b>,</p>

                  <p>
                    Thank you for reaching out regarding <b>${companyName || "your company"}</b>.  
                   We appreciate your interest and look forward to exploring how we can support your requirements.
                  </p>

                  <p>
                    Our team will review your details and connect with you on the next working day                  </p>

                  <!-- CTA -->
                  ${meetingLink
            ? `
                    <div style="text-align:center; margin:24px 0;">
                      <a href="${meetingLink}" style="
                        display:inline-block;
                        background:#2563eb;
                        color:#ffffff;
                        padding:12px 22px;
                        border-radius:8px;
                        text-decoration:none;
                        font-weight:600;
                        font-size:14px;
                      ">
                        Schedule a Meeting →
                      </a>
                    </div>
                  `
            : ""
        }

                  <p>
                    If you prefer, you can also reply directly to this email or contact us using the details below.
                  </p>

                  <!-- Contact Info -->
                  <div style="background:#f9fafb; padding:16px; border-radius:8px; margin-top:16px;">
                    <p style="margin:4px 0;"><b>Contact Person:</b> ${salesPersonName}</p>
                    <p style="margin:4px 0;"><b>Email:</b> ${contactEmail}</p>
                    <p style="margin:4px 0;"><b>Phone:</b> ${contactPhone}</p>
                  </div>

                  <p style="margin-top:20px;">
                    Looking forward to connecting with you.
                  </p>

                  <p>
                    Best regards,<br/>
                    <b>${salesPersonName}</b>
                  </p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f3f4f6; padding:14px; text-align:center; font-size:12px; color:#6b7280;">
                  <p style="margin:0;">This is a response to your recent inquiry</p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </div>
    `;
};

// Main email sending function
export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const info = await transporter.sendMail({
            from: `"CRM System" <${config.emailUser}>`,
            to,
            subject,
            html: htmlContent
        });
        logger.info(`Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        logger.error("Error sending email:", error);
        return false;
    }
};

// Send OTP function
export const sendOTP = async (to, otp) => {
    try {
        await transporter.sendMail({
            from: `"CRM System" <${config.emailUser}>`,
            to,
            subject: "Your OTP Code",
            text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
            html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`
        });
        logger.info(`OTP sent to ${to}`);
        return true;
    } catch (error) {
        logger.error("Error sending OTP:", error);
        return false;
    }
};

// Send lead notification to admin
export const sendLeadNotification = async (lead) => {
    const adminEmail = config.adminEmail; // Configure admin email in config
    return await sendEmail(
        adminEmail,
        "New Lead Captured",
        leadTemplate(lead)
    );
};

// Send auto-reply to lead
export const sendLeadAutoReply = async (leadEmail, leadName, companyName) => {
    const replyHtml = leadReplyTemplate({
        name: leadName,
        companyName: companyName,
        salesPersonName: config.salesPersonName || "Sales Team",
        meetingLink: config.meetingLink || null,
        contactEmail: config.emailUser,
        contactPhone: config.contactPhone || "8986147449"
    });

    return await sendEmail(
        leadEmail,
        "Thank you for your interest",
        replyHtml
    );
};