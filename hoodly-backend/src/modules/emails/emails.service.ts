import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<number>('SMTP_PORT', 587));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    if (!this.transporter) {
      throw new InternalServerErrorException(
        'Configuration SMTP manquante (SMTP_USER et SMTP_PASS non renseignés).',
      );
    }

    try {
      const from = this.configService.get<string>('SMTP_USER');
      await this.transporter.sendMail({
        from: `"Hoodly" <${from}>`,
        to,
        subject,
        text: body,
      });
      this.logger.log(`E-mail envoyé avec succès à ${to}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Erreur lors de l'envoi de l'e-mail à ${to} : ${err.message}`);
      throw new InternalServerErrorException(`Échec de l'envoi de l'e-mail : ${err.message}`);
    }
  }
}
