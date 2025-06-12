import Link from 'next/link';

export default function OtherEventCalendars() {
  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-amber-900 mb-4">Additional Legal Resources</h2>
      <ul className="list-disc list-inside text-left max-w-xl mx-auto text-amber-800 space-y-2">
        <li>
          <Link href="https://www.nycourts.gov/cle" target="_blank" rel="noopener noreferrer" className="text-amber-800 hover:text-amber-700 font-semibold">
            New York State CLE Board
          </Link>: Official source for CLE requirements and accredited programs in New York State. <span className="italic">Track your CLE credits and find approved programs.</span>
        </li>
        <li>
          <Link href="https://www.americanbar.org/groups/cle/" target="_blank" rel="noopener noreferrer" className="text-amber-800 hover:text-amber-700 font-semibold">
            American Bar Association CLE
          </Link>: National CLE programs and resources from the ABA. <span className="italic">Access high-quality legal education programs and materials.</span>
        </li>
        <li>
          <Link href="https://www.law.nyu.edu/centers/cle" target="_blank" rel="noopener noreferrer" className="text-amber-800 hover:text-amber-700 font-semibold">
            NYU Law CLE
          </Link>: Continuing Legal Education programs from NYU School of Law. <span className="italic">Advanced legal education and professional development opportunities.</span>
        </li>
        <li>
          <Link href="https://www.nycbar.org/cle" target="_blank" rel="noopener noreferrer" className="text-amber-800 hover:text-amber-700 font-semibold">
            NYC Bar Association CLE
          </Link>: Comprehensive CLE programs from the New York City Bar Association. <span className="italic">Local legal education and networking opportunities.</span>
        </li>
      </ul>
    </section>
  );
} 