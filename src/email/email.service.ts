import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import * as moment from 'moment';
import { BookingsService } from '../bookings/bookings.service';
import { console } from 'inspector';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject() private readonly configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly bookingsService: BookingsService
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
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

    const qrCodeData = {
      bookingId: booking.id,
      courtId: court.id,
      userId,
    };

    const jsonData = JSON.stringify(qrCodeData);
    const signature = crypto
      .createHmac('sha256', 'qrcode_secret')
      .update(jsonData)
      .digest('hex');

    const payloadString = JSON.stringify({
      signature,
      data: qrCodeData,
    });

    // Generate QR code asynchronously using await
    try {
      const svg = await QRCode.toString(JSON.stringify(payloadString), {
        type: 'svg',
        errorCorrectionLevel: 'H',
      });

      const qrImgDataURL = await QRCode.toDataURL(
        JSON.stringify(payloadString),
        {
          errorCorrectionLevel: 'H',
          type: 'image/png',
        }
      );

      console.log('QR Code Data URL: ', qrImgDataURL);

      const subject = 'Booking Completed';
      const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
      <meta charset="UTF-8">
      <title>Xác Nhận Đặt Sân</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
          <td style="background-color: #4CAF50; padding: 20px; text-align: center; color: white;">
              <h2 style="margin: 0;">Đặt Sân Thành Công! 🏸</h2>
          </td>
          </tr>
          <tr>
          <td style="padding: 20px;">
              <p>Chào ${user.email.split('@')[0]},</p>
              <p>Chúng tôi xác nhận rằng bạn đã đặt sân cầu lông thành công! Thông tin chi tiết như sau:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                  <tr>
                      <td><strong>Địa chỉ trung tâm:</strong></td>
                      <td>${center.address}, ${center.district}, ${center.city}</td>
                  </tr>
                  <tr>
                      <td><strong>Số sân:</strong></td>
                      <td>${court.courtNo < 10 ? `0${court.courtNo}` : `${court.courtNo}`}</td>
                  </tr>
                  <tr>
                      <td><strong>Ngày:</strong></td>
                      <td>${moment(booking.startTime).format('DD/MM/YYYY')}</td>
                  </tr>
                  <tr>
                      <td><strong>Thời gian chơi:</strong></td>
                      <td>${new Date(booking.startTime).getHours()} giờ tới ${new Date(booking.endTime).getHours()} giờ</td>
                  </tr>
                  <tr>
                      <td><strong>Mã QR (vui lòng đưa mã QR khi tới sân để được xác nhận):</strong></td>
                      <td>${svg}</td>
                  </tr>
              </table>
              <p>Vui lòng đến trước giờ chơi 10 phút. Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua <a href="mailto:support@badminton.com" style="color: #4CAF50;">support@badminton.com</a>.</p>
              <p>Hẹn gặp bạn tại sân!</p>
              <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ Badminton</strong></p>
          </td>
          </tr>
          <tr>
          <td style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777;">
              © ${new Date().getFullYear()} Badminton. Đã đăng ký bản quyền.
          </td>
          </tr>
      </table>
      </body>
      </html>
    `;
      console.log(html);
      // Send email after the QR code is ready
      this.sendMail(user.email, subject, html);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
}
