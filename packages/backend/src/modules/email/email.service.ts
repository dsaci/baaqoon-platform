import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  getVolunteerApprovedEmailTemplate,
  getVolunteerRejectedEmailTemplate,
  getVolunteerApplicationReceivedEmailTemplate,
  getInactiveUserNudgeEmailTemplate,
  getSupervisorClarificationEmailTemplate,
  getImportantNotificationEmailTemplate,
  VolunteerApprovedEmailData,
  VolunteerRejectedEmailData,
  VolunteerApplicationReceivedEmailData,
  InactiveUserNudgeEmailData,
  SupervisorClarificationEmailData,
  ImportantNotificationEmailData,
} from './email.templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;
  private readonly gmailWebhookUrl: string;
  private readonly webhookToken: string;

  constructor(private readonly configService: ConfigService) {
    this.gmailWebhookUrl =
      this.configService.get<string>('GMAIL_WEBHOOK_URL') || '';
    this.webhookToken =
      this.configService.get<string>('GMAIL_WEBHOOK_TOKEN') || 'BaaqoonSecureGateway_2026';

    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = Number(this.configService.get<string>('SMTP_PORT')) || 465;
    const user = this.configService.get<string>('SMTP_USER') || 'baaqoon@gmail.com';
    const pass = this.configService.get<string>('SMTP_PASS') || 'qlsdemcnlkmvgmsm';
    const secure = (this.configService.get<string>('SMTP_SECURE') === 'true') || port === 465;

    this.fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      '"منصة باقون التعليمية" <baaqoon@gmail.com>';

    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'https://baaqoon-platform.vercel.app';

    if (this.gmailWebhookUrl) {
      this.logger.log(`✅ EmailService: HTTPS Webhook Gateway configured (Port 443)`);
    }

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
        this.logger.log(`✅ EmailService: SMTP transporter initialized (${host}:${port}) for ${user}`);
      } catch (err: any) {
        this.logger.error(`❌ EmailService: Failed to initialize SMTP transporter: ${err.message}`);
        this.isConfigured = false;
      }
    } else {
      this.logger.warn(
        '⚠️ EmailService: SMTP credentials not available. Running in simulation/dev mode.',
      );
    }
  }

  /**
   * Generic low-level email sender with HTTPS Gateway (Port 443) and SMTP fallback
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

    // 1. Try sending via Google Apps Script HTTPS Gateway (Port 443 - Bypasses Render Port Blocks)
    if (this.gmailWebhookUrl) {
      try {
        const resp = await fetch(this.gmailWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: this.webhookToken,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || '',
            fromName: 'منصة باقون التعليمية',
          }),
        });

        if (resp.ok) {
          const resJson: any = await resp.json().catch(() => ({ success: true }));
          if (resJson?.success) {
            this.logger.log(`📧 [HTTPS Gateway] Email sent successfully to ${options.to}`);
            return { success: true, messageId: `https-gw-${Date.now()}` };
          } else {
            this.logger.warn(`⚠️ [HTTPS Gateway] Returned failure: ${resJson?.error}. Falling back to SMTP...`);
          }
        } else {
          this.logger.warn(`⚠️ [HTTPS Gateway] HTTP ${resp.status}. Falling back to SMTP...`);
        }
      } catch (err: any) {
        this.logger.warn(`⚠️ [HTTPS Gateway] Failed to dispatch: ${err.message}. Falling back to SMTP...`);
      }
    }

    // 2. Fallback to direct SMTP transporter
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(
        `📨 [Email Simulated - Not Configured] To: ${options.to} | Subject: "${options.subject}"`,
      );
      return { success: false, simulated: true };
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

  /**
   * 4. Send Inactive User Nudge Email (تنبيه المتابعة للمنقطع والخامل عن المنصة)
   */
  async sendInactiveUserNudgeEmail(data: {
    fullName: string;
    email: string;
    role: string;
    customMessage: string;
    lastLoginAt?: Date | string | null;
    loginUrl?: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      const loginUrl = data.loginUrl || `${this.frontendUrl}/login`;
      const template = getInactiveUserNudgeEmailTemplate({
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        customMessage: data.customMessage,
        lastLoginAt: data.lastLoginAt,
        loginUrl,
      });

      const res = await this.sendMail({
        to: data.email,
        subject: template.subject,
        html: template.html,
        text: `${data.fullName}\n\n${data.customMessage}\n\nرابط الدخول: ${loginUrl}`,
      });

      return { success: res.success, messageId: res.messageId };
    } catch (err: any) {
      this.logger.error(`Error in sendInactiveUserNudgeEmail for ${data.email}: ${err.message}`);
      return { success: false };
    }
  }

  /**
   * 5. Send Supervisor Clarification / Directive Email to Teacher
   */
  async sendSupervisorClarificationEmail(data: {
    teacherName: string;
    email: string;
    supervisorName: string;
    subjectName?: string;
    title: string;
    content: string;
    isUrgent?: boolean;
    loginUrl?: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      const loginUrl = data.loginUrl || `${this.frontendUrl}/teacher/dashboard`;
      const template = getSupervisorClarificationEmailTemplate({
        teacherName: data.teacherName,
        email: data.email,
        supervisorName: data.supervisorName,
        subjectName: data.subjectName,
        title: data.title,
        content: data.content,
        isUrgent: data.isUrgent,
        loginUrl,
      });

      const res = await this.sendMail({
        to: data.email,
        subject: template.subject,
        html: template.html,
        text: `الأستاذ ${data.teacherName}\n\nمن المشرف الأكاديمي: ${data.supervisorName}\n\n${data.title}\n\n${data.content}\n\nرابط الدخول: ${loginUrl}`,
      });

      return { success: res.success, messageId: res.messageId };
    } catch (err: any) {
      this.logger.error(`Error in sendSupervisorClarificationEmail for ${data.email}: ${err.message}`);
      return { success: false };
    }
  }

  /**
   * 6. Send Important Notification / Urgent Announcement Email (إشعار وتعميم رسمي هام)
   */
  async sendImportantNotificationEmail(data: {
    recipientName: string;
    email: string;
    role?: string;
    title: string;
    body: string;
    actionUrl?: string;
    isUrgent?: boolean;
    senderName?: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      const loginUrl = data.actionUrl || `${this.frontendUrl}/login`;
      const template = getImportantNotificationEmailTemplate({
        recipientName: data.recipientName,
        email: data.email,
        role: data.role,
        title: data.title,
        body: data.body,
        actionUrl: loginUrl,
        isUrgent: data.isUrgent,
        senderName: data.senderName,
      });

      const res = await this.sendMail({
        to: data.email,
        subject: template.subject,
        html: template.html,
        text: `${data.recipientName}\n\n${data.title}\n\n${data.body}\n\nرابط المتابعة: ${loginUrl}`,
      });

      return { success: res.success, messageId: res.messageId };
    } catch (err: any) {
      this.logger.error(`Error in sendImportantNotificationEmail for ${data.email}: ${err.message}`);
      return { success: false };
    }
  }
}
