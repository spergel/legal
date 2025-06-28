'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { ExternalLink, Mail, Settings, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailServiceSetupProps {
  isConfigured: boolean;
  serviceType: string;
}

export default function EmailServiceSetup({ isConfigured, serviceType }: EmailServiceSetupProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const envVariables = `# Mailchimp Configuration
MAILCHIMP_API_KEY=your_api_key_here
MAILCHIMP_SERVER_PREFIX=us1
MAILCHIMP_LIST_ID=your_list_id_here
FROM_NAME=Legal Events Newsletter
REPLY_TO_EMAIL=noreply@yourdomain.com`;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Mail className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email Service Status</h3>
            <p className="text-sm text-gray-600">
              Currently using: <span className="font-medium">{serviceType}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center">
          {isConfigured ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Database Mode</span>
            </div>
          )}
        </div>
      </div>

      {!isConfigured && (
        <div className="border-t pt-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              You're currently in database mode. Subscribers will be stored locally, but emails won't be sent.
              For full email functionality, connect to Mailchimp:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
              icon={<Settings className="w-4 h-4" />}
            >
              {showInstructions ? 'Hide' : 'Show'} Setup Instructions
            </Button>
          </div>

          {showInstructions && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Mailchimp Setup Instructions</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Step 1: Get Mailchimp API Key</h5>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 ml-2">
                    <li>Sign up for a <a href="https://mailchimp.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Mailchimp account <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                    <li>Go to Account → Extras → API keys</li>
                    <li>Create a new API key and copy it</li>
                  </ol>
                </div>

                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Step 2: Create an Audience</h5>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 ml-2">
                    <li>Go to Audience → All contacts → Create Audience</li>
                    <li>Fill in your audience details</li>
                    <li>Copy the Audience ID from Settings → Audience name and campaign defaults</li>
                  </ol>
                </div>

                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Step 3: Add Environment Variables</h5>
                  <p className="text-sm text-gray-600 mb-2">Add these to your <code className="bg-gray-200 px-1 rounded">.env.local</code> file:</p>
                  <div className="relative">
                    <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {envVariables}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(envVariables)}
                      className="absolute top-2 right-2"
                      icon={<Copy className="w-3 h-3" />}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Step 4: Find Your Server Prefix</h5>
                  <p className="text-sm text-gray-600">
                    Your server prefix is in your API key after the dash (e.g., if your key ends with <code className="bg-gray-200 px-1 rounded">-us1</code>, use <code className="bg-gray-200 px-1 rounded">us1</code>)
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> After adding these environment variables, restart your development server for the changes to take effect.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isConfigured && (
        <div className="border-t pt-4">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              ✅ Mailchimp is connected! Your newsletters will be sent through Mailchimp, which provides better deliverability, 
              analytics, and automatic unsubscribe handling.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 