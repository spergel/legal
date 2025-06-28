declare module '@mailchimp/mailchimp_marketing' {
  interface MailchimpConfig {
    apiKey: string;
    server: string;
  }

  interface Campaign {
    id: string;
    [key: string]: any;
  }

  interface List {
    stats?: {
      member_count?: number;
    };
    [key: string]: any;
  }

  interface MailchimpAPI {
    setConfig(config: MailchimpConfig): void;
    lists: {
      addListMember(listId: string, memberData: any): Promise<any>;
      updateListMember(listId: string, subscriberHash: string, data: any): Promise<any>;
      getList(listId: string): Promise<List>;
    };
    campaigns: {
      create(campaignData: any): Promise<Campaign>;
      setContent(campaignId: string, content: any): Promise<any>;
      send(campaignId: string): Promise<any>;
    };
  }

  const mailchimp: MailchimpAPI;
  export default mailchimp;
} 