import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  getVolunteerApprovedEmailTemplate,
  getVolunteerRejectedEmailTemplate,
  getVolunteerApplicationReceivedEmailTemplate,
  VolunteerApprovedEmailData,
  VolunteerRejectedEmailData,
  VolunteerApplicationReceivedEmailData,
} from './email.templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT')) || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465;

    this.fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      '"منصة باقون التعليمية" <no-reply@baaqoon.org>';

    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'https://baaqoon-platform.vercel.app';

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false, // Prevents self-signed cert issues on custom SMTP
          },
        });
        this.isConfigured = true;
        this.logger.log(`✅ EmailService: SMTP transporter initialized (${host}:${port})`);
      } catch (err: any) {
        this.logger.error(`❌ EmailService: Failed to initialize SMTP transporter: ${err.message}`);
        this.isConfigured = false;
      }
    } else {
      this.logger.warn(
        '⚠️ EmailService: SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not set in .env. Running in simulation/dev mode.',
      );
    }
  }

  /**
   * Generic low-level email sender with fallback simulation
   */
  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
    if (!options.to) {
      this.logger.warn('EmailService: Attempted to send email with no recipient address');
      return { success: false };
    }

    if (!this.isConfigured || !this.transporter) {
      this.logger.log(
        `📨 [Email Simulated] To: ${options.to} | Subject: "${options.subject}" | (Configure SMTP in .env for live delivery)`,
      );
      return { success: true, simulated: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`📧 Email sent successfully to ${options.to} | MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`❌ Failed to send email to ${options.to}: ${error.message}`);
      return { success: false };
    }
  }

  /**
   * 1. Send Volunteer Application Approval Email
   */
  async sendVolunteerApprovedEmail(data: {
    fullName: string;
    email: string;
    assignedSubject?: string;
    initialPassword?: string;
    loginUrl?: string;
  }): Promise<boolean> {
    try {
      const loginUrl = data.loginUrl || `${this.frontendUrl}/volunteer/status?email=${encodeURIComponent(data.email)}`;
      const template = getVolunteerApprovedEmailTemplate({
        fullName: data.fullName,
        email: data.email,
        assignedSubject: data.assignedSubject,
        initialPassword: data.initialPassword,
        loginUrl,
      });

      const res = await this.sendMail({
        to: data.email,
        subject: template.subject,
        html: template.html,
      });
      return res.success;
    } catch (err: any) {
      this.logger.error(`Error in sendVolunteerApprovedEmail: ${err.message}`);
      return false;
    }
  }

  /**
   * 2. Send Volunteer Application Rejection Email (Dignified & Grateful)
   */
  async sendVolunteerRejectedEmail(data: {
    fullName: string;
    email: string;
    reason?: string;
  }): Promise<boolean> {
    try {
      const template = getVolunteerRejectedEmailTemplate({
        fullName: data.fullName,
        reason: data.reason,
      });

      const res = await this.sendMail({
        to: data.email,
        subject: template.subject,
        html: template.html,
      });
      return res.success;
    } catch (err: any) {
      this.logger.error(`Error in sendVolunteerRejectedEmail: ${err.message}`);
      return false;
    }
  }

  /**
   * 3. Send Application Received Confirmation
   */
  async sendVolunteerApplicationReceivedEmail(data: {
    fullName: string;
    email: string;
    subjects?: string[];
  }): Promise<boolean> {
    try {
      const trackingUrl = `${this.frontendUrl}/volunteer/status?email=${encodeURIComponent(data.email)}`;
      const template = getVolunteerApplicationReceivedEmailTemplate({
        fullName: data.fullName,
        email: data.email,
        subjects: data.subjects,
        trackingUrl,
      });

      const res = await this.sendMail({
        to: data.email,
        subject: template.subject,
        html: template.html,
      });
      return res.success;
    } catch (err: any) {
      this.logger.error(`Error in sendVolunteerApplicationReceivedEmail: ${err.message}`);
      return false;
    }
  }
}
