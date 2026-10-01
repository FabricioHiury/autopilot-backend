import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { join } from 'path';
import { AppErrorBadRequest } from '../errors/app-errors';
import * as crypto from 'crypto';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_SERVER'),
      port: this.configService.get<number>('SMTP_PORT', 465),
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_EMAIL'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  private renderTemplate(templatePath: string, context: any): string {
    const templateString = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateString);
    return template(context);
  }

  async sendEmail(to: string, subject: string, htmlContent: string) {
    const DEFAULT_EMAIL_FROM =
      process.env.DEFAULT_EMAIL_FROM || 'no-reply@autopilot.com.br';

    const mailOptions = {
      from: DEFAULT_EMAIL_FROM,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failure to send email:', error);
      return false;
    }
  }

  async sendUserRegistrationEmail(
    name: string,
    email: string,
    loginUrl: string,
  ) {
    try {
      const htmlContent = this.renderTemplate(
        join(__dirname, './templates/registration-confirmation.hbs'),
        { name, loginUrl, year: new Date().getFullYear() },
      );

      await this.sendEmail(email, 'Welcome to AutoPilot!', htmlContent);
    } catch (error) {
      console.error('Failure to send email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetUrl: string, name: string) {
    try {
      const htmlContent = this.renderTemplate(
        join(__dirname, './templates/reset-password.hbs'),
        { resetUrl, year: new Date().getFullYear(), name, email },
      );

      await this.sendEmail(email, 'Reset your password', htmlContent);
      return true;
    } catch (error) {
      console.error('Failure to send email:', error);
      return false;
    }
  }

  async sendDataOfAccess(params: {
    email: string;
    name: string;
    password: string;
    notes?: string;
  }) {
    if (!params.email || !params.name || !params.password) {
      throw new AppErrorBadRequest('Parameters required missing');
    }
    const email = params.email;
    const htmlContent = this.renderTemplate(
      join(__dirname, '/templates/data-access.hbs'),
      {
        ...params,
        year: new Date().getFullYear(),
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      },
    );

    try {
      await this.sendEmail(email, 'Your AutoPilot account', htmlContent);
      return true;
    } catch (error) {
      console.log('Failure to send email: ', error);
      return false;
    }
  }

  async sendEmailConfirmation(name: string, email: string, token: string) {
    try {
      const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-email?token=${token}`;

      const htmlContent = this.renderTemplate(
        join(__dirname, './templates/email-confirmation.hbs'),
        { name, confirmationUrl, year: new Date().getFullYear() },
      );

      await this.sendEmail(
        email,
        'Confirm your email - AutoPilot',
        htmlContent,
      );
      return true;
    } catch (error) {
      console.error('Failure to send email of confirmation:', error);
      return false;
    }
  }

  generateEmailConfirmationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
