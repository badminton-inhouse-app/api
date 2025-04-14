import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject() private readonly configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL');

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: ', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email: ', error);
      throw error;
    }
  }

  async sendBookingCompletedEmail(userId: string, bookingId: string) {
    const user = await this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user || !user.email) {
      return;
    }

    const booking = await this.db.query.bookings.findFirst({
      where: (bookings, { eq }) => eq(bookings.id, bookingId),
    });

    if (!booking) {
      return;
    }

    const court = await this.db.query.courts.findFirst({
      where: (courts, { eq }) => eq(courts.id, booking.courtId),
    });

    if (!court) {
      return;
    }

    const center = await this.db.query.centers.findFirst({
      where: (centers, { eq }) => eq(centers.id, court.centerId),
    });

    if (!center) {
      return;
    }

    const subject = 'Booking Completed';
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <title>Booking Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <tr>
            <td style="background-color: #4CAF50; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0;">Booking Confirmed! 🏸</h2>
            </td>
            </tr>
            <tr>
            <td style="padding: 20px;">
                <p>Hi ${user.email.split('@')[0]},</p>
                <p>Your badminton court booking is confirmed! Here are your details:</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                 <tr>
                    <td><strong>Center address:</strong></td>
                    <td>${center.address}, ${center.district}, ${center.city}</td>
                </tr>
                <tr>
                    <td><strong>Court No:</strong></td>
                    <td>${court.courtNo}</td>
                </tr>
                <tr>
                    <td><strong>Date:</strong></td>
                    <td>${new Date(booking.startTime).toISOString()}</td>
                </tr>
                <tr>
                    <td><strong>Time:</strong></td>
                    <td>${new Date(booking.startTime).getHours()}} – ${new Date(booking.endTime).getHours()}}</td>
                </tr>
                <tr>
                    <td><strong>Booking ID:</strong></td>
                    <td>${booking.id}</td>
                </tr>
                </table>
                <p>Please arrive 10 minutes early. For questions, contact us at <a href="mailto: support@badminton.com" style="color: #4CAF50;">support@badminton.com</a>.</p>
                <p>See you on the court!</p>
                <p style="margin-top: 30px;">Thanks,<br><strong>Badminton Team</strong></p>
            </td>
            </tr>
            <tr>
            <td style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777;">
                © ${new Date().getFullYear()} Badminton. All rights reserved.
            </td>
            </tr>
        </table>
        </body>
        </html>
    `;

    return this.sendMail(user.email, subject, html);
  }
}
