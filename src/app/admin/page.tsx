import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AdminPageClient from './AdminPageClient';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  
  console.log('🔍 Admin Access Check:', {
    hasSession: !!session,
    userEmail: session?.user?.email,
    adminEmails: ADMIN_EMAILS,
    isAdmin: session?.user?.email ? ADMIN_EMAILS.includes(session.user.email) : false,
    envVar: process.env.ADMIN_EMAILS
  });
  
  // Check if user is admin
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    console.log('❌ Admin access denied:', {
      userEmail: session?.user?.email,
      adminEmails: ADMIN_EMAILS,
      isAdmin: session?.user?.email ? ADMIN_EMAILS.includes(session.user.email) : false
    });
    redirect('/');
  }

  console.log('✅ Admin access granted to:', session.user.email);
  
  return (
    <>
      {/* Client-side debug info */}
      <script dangerouslySetInnerHTML={{
        __html: `
          console.log('🎯 Admin page server-side check completed');
          console.log('👤 User email: ${session.user.email}');
          console.log('🔑 Admin emails: ${ADMIN_EMAILS.join(', ')}');
          console.log('✅ Access granted!');
        `
      }} />
      <AdminPageClient session={session} />
    </>
  );
} 