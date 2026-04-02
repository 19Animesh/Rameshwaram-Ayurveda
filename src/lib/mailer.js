import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOtpEmail(toEmail, otpCode) {
  const fromName = process.env.SMTP_FROM_NAME || 'Rameshwaram Ayurveda';
  const fromEmail = process.env.SMTP_EMAIL;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: `${otpCode} is your Rameshwaram Ayurveda verification code`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 520px; margin: 0 auto; background: #f8f5f0; border-radius: 12px; overflow: hidden; border: 1px solid #e0d6c8;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1B4332 0%, #2d6a4f 100%); padding: 32px 40px; text-align: center;">
          <h1 style="color: #C9A84C; margin: 0; font-size: 22px; letter-spacing: 1px;">🌿 Rameshwaram Ayurveda</h1>
          <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 13px;">Ancient Wisdom, Modern Wellness</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 40px; background: #ffffff;">
          <h2 style="color: #1B4332; margin: 0 0 12px; font-size: 20px;">Your Verification Code</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Use the code below to verify your account. It expires in <strong>10 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="background: #f0f7f4; border: 2px dashed #C9A84C; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <span style="font-size: 42px; font-weight: bold; letter-spacing: 10px; color: #1B4332; font-family: monospace;">${otpCode}</span>
          </div>

          <p style="color: #888; font-size: 13px; margin: 0;">
            If you did not request this code, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8f5f0; padding: 20px 40px; text-align: center; border-top: 1px solid #e0d6c8;">
          <p style="color: #aaa; font-size: 12px; margin: 0;">
            © 2026 Rameshwaram Ayurveda. All rights reserved.<br/>
            Ayurvedic products should be taken under guidance of a qualified practitioner.
          </p>
        </div>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ OTP email sent to ${toEmail}`);
}
