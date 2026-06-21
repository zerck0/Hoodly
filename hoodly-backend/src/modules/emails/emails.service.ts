import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // Dans un environnement de production, on utiliserait nodemailer ou SendGrid/Mailjet.
    // Pour le développement local, on affiche l'email dans la console de manière visible pour récupérer l'OTP.
    this.logger.log(`
============================================================
📧 [E-MAIL SIMULÉ EN LOCAL]
Destinataire : ${to}
Sujet        : ${subject}
Contenu      : 
${body}
============================================================
    `);
    return true;
  }
}
