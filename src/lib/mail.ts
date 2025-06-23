import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://notion-synker.vercel.app'; // Replace with your actual domain
  }
  return 'http://localhost:3000';
};

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    const baseUrl = getBaseUrl();
    const confirmLink = `${baseUrl}/new-verification?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Confirm your email',
      html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't throw the error to prevent registration from failing
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  try {
    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/new-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't throw the error to prevent reset from failing
  }
}; 