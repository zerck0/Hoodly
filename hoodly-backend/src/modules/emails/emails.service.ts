import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
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

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    html?: string,
  ): Promise<boolean> {
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
        html: html || undefined,
      });
      this.logger.log(`E-mail envoyé avec succès à ${to}`);
      return true;
    } catch (err: any) {
      this.logger.error(
        `Erreur lors de l'envoi de l'e-mail à ${to} : ${err.message}`,
      );
      throw new InternalServerErrorException(
        `Échec de l'envoi de l'e-mail : ${err.message}`,
      );
    }
  }

  private generateHtmlLayout(title: string, contentHtml: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #fefefa;
      color: #111827;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f3f4f6;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #e5e7eb;
    }
    .header {
      background-color: #111827;
      padding: 30px 40px;
      text-align: center;
    }
    .logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: bold;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.02em;
    }
    .content {
      padding: 40px;
    }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      color: #111827;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 600;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #4b5563;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .highlight-box {
      background-color: #f9fafb;
      border: 1px solid #f3f4f6;
      border-left: 4px solid #111827;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 25px;
    }
    .highlight-box p:last-child {
      margin-bottom: 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #111827;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 30px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 6px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #f3f4f6;
    }
    .footer p {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 5px;
    }
    .footer a {
      color: #4b5563;
      text-decoration: underline;
    }
    ul {
      margin: 0 0 20px 20px;
      padding: 0;
    }
    li {
      font-size: 15px;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="https://hoodly.fr" class="logo">Hoodly</a>
      </div>
      <div class="content">
        <h1>${title}</h1>
        ${contentHtml}
      </div>
      <div class="footer">
        <p>Hoodly — Votre vie de quartier, simplifiée.</p>
        <p>Si vous avez des questions, contactez-nous à <a href="mailto:support@hoodly.fr">support@hoodly.fr</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  async sendWelcomeCreationEmail(
    to: string,
    name: string,
    neighborhoodName: string,
  ): Promise<boolean> {
    const subject = "Bienvenue sur Hoodly ! Demande de création de quartier";
    const title = "Bienvenue chez vous !";
    const textBody = `Bonjour ${name},\n\nBienvenue sur Hoodly ! Vous avez demandé la création du quartier "${neighborhoodName}". Votre demande est en cours d'examen par nos administrateurs. Vous recevrez un e-mail dès qu'elle aura été validée.\n\nL'équipe Hoodly`;
    const htmlBody = this.generateHtmlLayout(
      title,
      `<p>Bonjour ${name},</p>
       <p>Bienvenue sur Hoodly ! Nous sommes ravis de vous compter parmi nous.</p>
       <p>Vous venez de demander la création du quartier <strong>${neighborhoodName}</strong>.</p>
       <div class="highlight-box">
         <p><strong>Statut de votre demande :</strong> En attente de validation par un administrateur.</p>
         <p>Nos équipes examinent votre demande de création pour s'assurer que le périmètre et les informations du quartier sont corrects. Vous recevrez un e-mail de confirmation dès que le quartier sera officiellement créé.</p>
       </div>
       <p>À très bientôt,</p>
       <p>L'équipe Hoodly</p>`,
    );

    return this.sendEmail(to, subject, textBody, htmlBody);
  }

  async sendWelcomeJoinEmail(
    to: string,
    name: string,
    neighborhoodName: string,
  ): Promise<boolean> {
    const subject = "Bienvenue sur Hoodly ! Demande d'adhésion en cours";
    const title = "Bienvenue chez vous !";
    const textBody = `Bonjour ${name},\n\nBienvenue sur Hoodly ! Vous avez demandé à rejoindre le quartier "${neighborhoodName}". Votre demande d'adhésion et vos pièces justificatives sont en cours de validation par nos administrateurs. Vous recevrez un e-mail dès qu'elle aura été validée.\n\nL'équipe Hoodly`;
    const htmlBody = this.generateHtmlLayout(
      title,
      `<p>Bonjour ${name},</p>
       <p>Bienvenue sur Hoodly ! Nous sommes ravis de vous compter parmi nous.</p>
       <p>Vous venez de demander à rejoindre le quartier <strong>${neighborhoodName}</strong>.</p>
       <div class="highlight-box">
         <p><strong>Statut de votre demande :</strong> Vérification des pièces justificatives en cours.</p>
         <p>Pour garantir la sécurité et la convivialité au sein du quartier, nos administrateurs valident manuellement votre justificatif de domicile et votre pièce d'identité. Cette étape prend généralement moins de 24 heures.</p>
       </div>
       <p>Vous recevrez un e-mail dès que votre adhésion aura été approuvée.</p>
       <p>À très bientôt,</p>
       <p>L'équipe Hoodly</p>`,
    );

    return this.sendEmail(to, subject, textBody, htmlBody);
  }

  async sendNeighborhoodCreatedEmail(
    to: string,
    name: string,
    neighborhoodName: string,
  ): Promise<boolean> {
    const subject = `Bonne nouvelle ! Votre quartier ${neighborhoodName} a été créé`;
    const title = "Votre quartier est prêt !";
    const textBody = `Bonjour ${name},\n\nBonne nouvelle ! Votre demande de création pour le quartier "${neighborhoodName}" a été acceptée par l'administrateur ! Vous pouvez maintenant vous connecter et valider votre adhésion en téléversant vos justificatifs.\n\nAccédez à votre compte : https://hoodly.fr/dashboard\n\nL'équipe Hoodly`;
    const htmlBody = this.generateHtmlLayout(
      title,
      `<p>Bonjour ${name},</p>
       <p>Bonne nouvelle ! Votre demande de création pour le quartier <strong>${neighborhoodName}</strong> a été acceptée par l'administrateur ! 🎉</p>
       <p>Le quartier a bien été configuré sur Hoodly.</p>
       <div class="highlight-box">
         <p><strong>Prochaine étape :</strong></p>
         <p>Pour pouvoir échanger avec vos voisins, vous devez maintenant vous connecter et téléverser votre justificatif de domicile ainsi que votre pièce d'identité afin de valider officiellement votre adhésion à ce nouveau quartier.</p>
       </div>
       <div class="button-container">
         <a href="https://hoodly.fr/dashboard" class="button">Valider mon adhésion</a>
       </div>
       <p>À très vite sur Hoodly,</p>
       <p>L'équipe Hoodly</p>`,
    );

    return this.sendEmail(to, subject, textBody, htmlBody);
  }

  async sendMembershipApprovedEmail(
    to: string,
    name: string,
    neighborhoodName: string,
  ): Promise<boolean> {
    const subject = `Félicitations ! Vous avez rejoint le quartier ${neighborhoodName}`;
    const title = "Bienvenue dans votre quartier !";
    const textBody = `Bonjour ${name},\n\nFélicitations ! Votre demande d'adhésion pour le quartier "${neighborhoodName}" a été validée. Vous pouvez désormais accéder à Hoodly et échanger avec vos voisins.\n\nDécouvrez votre quartier : https://hoodly.fr/dashboard\n\nL'équipe Hoodly`;
    const htmlBody = this.generateHtmlLayout(
      title,
      `<p>Bonjour ${name},</p>
       <p>Félicitations ! Votre demande d'adhésion pour le quartier <strong>${neighborhoodName}</strong> a été validée avec succès. 🏡</p>
       <p>Vos documents ont été vérifiés. Vous êtes désormais un habitant actif de votre quartier sur Hoodly !</p>
       <div class="highlight-box">
         <p>Vous pouvez désormais :</p>
         <ul>
           <li>Publier des messages et échanger avec vos voisins</li>
           <li>Signaler des incidents ou proposer des événements</li>
           <li>Proposer ou demander des services d'entraide</li>
         </ul>
       </div>
       <div class="button-container">
         <a href="https://hoodly.fr/dashboard" class="button">Découvrir mon quartier</a>
       </div>
       <p>Nous sommes heureux de vous avoir parmi nous !</p>
       <p>L'équipe Hoodly</p>`,
    );

    return this.sendEmail(to, subject, textBody, htmlBody);
  }

  async sendAccountDeletedEmail(
    to: string,
    name: string,
  ): Promise<boolean> {
    const subject = "Confirmation de suppression de votre compte Hoodly";
    const title = "Compte supprimé";
    const textBody = `Bonjour ${name},\n\nNous vous confirmons que votre compte Hoodly a bien été supprimé définitivement, conformément à votre demande. Toutes vos données personnelles ont été effacées.\n\nBonne continuation,\nL'équipe Hoodly`;
    const htmlBody = this.generateHtmlLayout(
      title,
      `<p>Bonjour ${name},</p>
       <p>Nous vous confirmons que votre compte Hoodly a bien été supprimé définitivement, conformément à votre demande.</p>
       <div class="highlight-box">
         <p><strong>Conformité RGPD :</strong></p>
         <p>Toutes vos données personnelles ainsi que vos documents justificatifs ont été effacés de nos serveurs de manière sécurisée et irréversible.</p>
       </div>
       <p>Nous sommes désolés de vous voir partir et nous vous remercions d'avoir fait partie de notre communauté.</p>
       <p>Si vous changez d'avis, sachez que vous pourrez créer un nouveau compte à tout moment.</p>
       <p>Bonne continuation,</p>
       <p>L'équipe Hoodly</p>`,
    );

    return this.sendEmail(to, subject, textBody, htmlBody);
  }

  async sendServiceCompletedClientEmail(
    to: string,
    clientName: string,
    providerName: string,
    contractTitle: string,
    pricePoints: number,
  ): Promise<boolean> {
    const subject = `Prestation terminée ! Confirmation de paiement pour ${contractTitle}`;
    const title = "Prestation validée !";
    const textBody = `Bonjour ${clientName},\n\nLa prestation pour le contrat "${contractTitle}" est terminée. Votre paiement de ${pricePoints} points a bien été transféré à ${providerName}.\n\nMerci d'utiliser Hoodly !\nL'équipe Hoodly`;
    const htmlBody = this.generateHtmlLayout(
      title,
      `<p>Bonjour ${clientName},</p>
       <p>La prestation de service pour le contrat <strong>"${contractTitle}"</strong> a été validée et clôturée avec succès !</p>
       <div class="highlight-box">
         <p><strong>Détails du paiement :</strong></p>
         <p>Votre paiement de <strong>${pricePoints} points</strong> a bien été transféré à <strong>${providerName}</strong>.</p>
       </div>
       <p>Merci d'avoir utilisé Hoodly pour vos échanges et services de quartier ! Votre participation contribue à renforcer l'entraide locale.</p>
       <p>À bientôt pour de nouveaux échanges,</p>
       <p>L'équipe Hoodly</p>`,
    );

    return this.sendEmail(to, subject, textBody, htmlBody);
  }

  async sendServiceCompletedProviderEmail(
    to: string,
    providerName: string,
    clientName: string,
    contractTitle: string,
    pricePoints: number,
  ): Promise<boolean> {
    const subject = `Prestation terminée ! Points reçus pour ${contractTitle}`;
    const title = "Points reçus !";
    const textBody = `Bonjour ${providerName},\n\nLa prestation pour le contrat "${contractTitle}" est terminée. Vous avez bien reçu ${pricePoints} points de la part de ${clientName}.\n\nMerci pour votre engagement !\nL'équipe Hoodly`;
    const htmlBody = this.generateHtmlLayout(
      title,
      `<p>Bonjour ${providerName},</p>
       <p>La prestation de service pour le contrat <strong>"${contractTitle}"</strong> est désormais terminée et validée !</p>
       <div class="highlight-box">
         <p><strong>Points reçus :</strong></p>
         <p>Vous avez bien reçu <strong>${pricePoints} points</strong> de la part de <strong>${clientName}</strong>.</p>
       </div>
       <p>Merci pour votre engagement et votre aide précieuse au sein de la communauté Hoodly !</p>
       <p>À bientôt pour de futurs services,</p>
       <p>L'équipe Hoodly</p>`,
    );

    return this.sendEmail(to, subject, textBody, htmlBody);
  }

  async sendOTPEmail(
    to: string,
    name: string,
    otpCode: string,
  ): Promise<boolean> {
    const subject = 'Code de vérification - Signature de contrat';
    const title = "Signature électronique";
    const textBody = `Bonjour ${name},\n\nVotre code de vérification OTP pour la signature de votre contrat est : ${otpCode}\n\nCe code est valable pendant 10 minutes.\n\nL'équipe Hoodly`;
    const htmlBody = this.generateHtmlLayout(
      title,
      `<p>Bonjour ${name},</p>
       <p>Vous avez demandé un code de vérification pour la signature électronique de votre contrat sur Hoodly.</p>
       <div class="highlight-box" style="text-align: center;">
         <p style="font-size: 14px; margin-bottom: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Votre code de validation OTP</p>
         <p style="font-size: 32px; font-weight: bold; letter-spacing: 0.1em; color: #111827; margin: 0;">${otpCode}</p>
       </div>
       <p style="font-size: 14px; color: #9ca3af;">Ce code est strictement confidentiel et valable pendant 10 minutes.</p>
       <p>L'équipe Hoodly</p>`,
    );

    return this.sendEmail(to, subject, textBody, htmlBody);
  }

  async sendContractSignedNotification(
    to: string,
    name: string,
    contractTitle: string,
    fileUrl: string,
  ): Promise<boolean> {
    const subject = `Signature du contrat : ${contractTitle}`;
    const title = "Contrat signé avec succès !";
    const textBody = `Bonjour ${name},\n\nLe contrat "${contractTitle}" a été signé par les deux parties.\n\nVous trouverez le PDF final à l'adresse suivante :\n${fileUrl}\n\nL'équipe Hoodly`;
    const htmlBody = this.generateHtmlLayout(
      title,
      `<p>Bonjour ${name},</p>
       <p>Le contrat <strong>"${contractTitle}"</strong> a été signé avec succès par les deux parties ! ✍️</p>
       <p>Vous trouverez le document final contenant le certificat de signature électronique en cliquant sur le lien ci-dessous :</p>
       <div class="button-container">
         <a href="${fileUrl}" class="button">Télécharger le PDF signé</a>
       </div>
       <p style="font-size: 14px; color: #9ca3af;">Vous pouvez également copier-coller ce lien dans votre navigateur : <br>${fileUrl}</p>
       <p>L'équipe Hoodly</p>`,
    );

    return this.sendEmail(to, subject, textBody, htmlBody);
  }
}
