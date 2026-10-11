import TeamApp from './team-app';
import { requireTeamUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export default async function Page() {
  const user = await requireTeamUser();
  return <TeamApp user={user.displayName} />;
}
