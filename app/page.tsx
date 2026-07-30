import { HomeContent } from "@/components/pages/home-content";
import { getSessionUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getSessionUser();

  return <HomeContent initialAuthenticated={Boolean(user)} />;
}
