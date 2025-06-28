import mailchimp from '@mailchimp/mailchimp_marketing';

export interface EmailProvider {
  addSubscriber(email: string, name?: string): Promise<boolean>;
  removeSubscriber(email: string): Promise<boolean>;
  getSubscriberCount(): Promise<number>;
  createCampaign(subject: string, content: string): Promise<string>;
  sendCampaign(campaignId: string): Promise<boolean>;
}

class MailchimpProvider implements EmailProvider {
  private listId: string;

  constructor() {
    const apiKey = process.env.MAILCHIMP_API_KEY;
    const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX; // e.g., 'us1'
    this.listId = process.env.MAILCHIMP_LIST_ID || '';

    if (apiKey && serverPrefix) {
      mailchimp.setConfig({
        apiKey,
        server: serverPrefix,
      });
    }
  }

  async addSubscriber(email: string, name?: string): Promise<boolean> {
    try {
      const subscriberData: any = {
        email_address: email,
        status: 'subscribed',
      };

      if (name) {
        const [firstName, ...lastNameParts] = name.split(' ');
        subscriberData.merge_fields = {
          FNAME: firstName,
          LNAME: lastNameParts.join(' ') || '',
        };
      }

      await mailchimp.lists.addListMember(this.listId, subscriberData);
      return true;
    } catch (error: any) {
      // Handle case where subscriber already exists
      if (error.status === 400 && error.response?.body?.title === 'Member Exists') {
        return true; // Consider this a success
      }
      console.error('Error adding subscriber to Mailchimp:', error);
      return false;
    }
  }

  async removeSubscriber(email: string): Promise<boolean> {
    try {
      const subscriberHash = this.getSubscriberHash(email);
      await mailchimp.lists.updateListMember(this.listId, subscriberHash, {
        status: 'unsubscribed',
      });
      return true;
    } catch (error) {
      console.error('Error removing subscriber from Mailchimp:', error);
      return false;
    }
  }

  async getSubscriberCount(): Promise<number> {
    try {
      const list = await mailchimp.lists.getList(this.listId);
      return list.stats?.member_count || 0;
    } catch (error) {
      console.error('Error getting subscriber count from Mailchimp:', error);
      return 0;
    }
  }

  async createCampaign(subject: string, content: string): Promise<string> {
    try {
      const campaign = await mailchimp.campaigns.create({
        type: 'regular',
        recipients: {
          list_id: this.listId,
        },
        settings: {
          subject_line: subject,
          from_name: process.env.FROM_NAME || 'Legal Events',
          reply_to: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL || 'noreply@example.com',
          title: `Newsletter: ${subject}`,
        },
      });

      // Set campaign content
      await mailchimp.campaigns.setContent(campaign.id, {
        html: this.wrapContentInTemplate(content, subject),
      });

      return campaign.id;
    } catch (error) {
      console.error('Error creating Mailchimp campaign:', error);
      throw error;
    }
  }

  async sendCampaign(campaignId: string): Promise<boolean> {
    try {
      await mailchimp.campaigns.send(campaignId);
      return true;
    } catch (error) {
      console.error('Error sending Mailchimp campaign:', error);
      return false;
    }
  }

  private getSubscriberHash(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  }

  private wrapContentInTemplate(content: string, subject: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .content { background: white; padding: 20px; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; }
            a { color: #0066cc; }
            .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; color: #0066cc;">Legal Events Newsletter</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>You're receiving this because you subscribed to legal event updates.</p>
            <p>
              *|UNSUBSCRIBE|* | *|UPDATE_PROFILE|*
            </p>
          </div>
        </body>
      </html>
    `;
  }
}

// Fallback database provider for when external services aren't configured
class DatabaseProvider implements EmailProvider {
  async addSubscriber(email: string, name?: string): Promise<boolean> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.newsletterSubscriber.upsert({
        where: { email },
        update: { 
          isActive: true, 
          name: name || undefined,
          unsubscribedAt: null 
        },
        create: { 
          email, 
          name: name || undefined,
          isActive: true 
        },
      });
      
      await prisma.$disconnect();
      return true;
    } catch (error) {
      console.error('Database provider error:', error);
      return false;
    }
  }

  async removeSubscriber(email: string): Promise<boolean> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { 
          isActive: false, 
          unsubscribedAt: new Date() 
        },
      });
      
      await prisma.$disconnect();
      return true;
    } catch (error) {
      console.error('Database provider error:', error);
      return false;
    }
  }

  async getSubscriberCount(): Promise<number> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const count = await prisma.newsletterSubscriber.count({
        where: { isActive: true }
      });
      
      await prisma.$disconnect();
      return count;
    } catch (error) {
      console.error('Database provider error:', error);
      return 0;
    }
  }

  async createCampaign(subject: string, content: string): Promise<string> {
    // For database provider, we'll just return a placeholder ID
    // In a real implementation, you might store the campaign in the database
    return `db-campaign-${Date.now()}`;
  }

  async sendCampaign(campaignId: string): Promise<boolean> {
    // Database provider doesn't actually send emails
    console.log('Database provider: Campaign would be sent:', campaignId);
    return true;
  }
}

// Factory function to get the appropriate email provider
export function getEmailProvider(): EmailProvider {
  // Check if Mailchimp is configured
  if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_SERVER_PREFIX && process.env.MAILCHIMP_LIST_ID) {
    return new MailchimpProvider();
  }
  
  // Fall back to database provider
  return new DatabaseProvider();
}

export function isExternalEmailServiceConfigured(): boolean {
  return !!(process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_SERVER_PREFIX && process.env.MAILCHIMP_LIST_ID);
} 