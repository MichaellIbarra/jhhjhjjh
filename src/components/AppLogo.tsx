import { School } from 'lucide-react';
import Link from 'next/link';

const AppLogo = () => {
  return (
    <Link href="/dashboard" className="flex items-center gap-2" aria-label="EduAssist Home">
      <School className="h-7 w-7 text-primary" />
      <span className="font-semibold text-xl text-primary">EduAssist</span>
    </Link>
  );
};

export default AppLogo;
