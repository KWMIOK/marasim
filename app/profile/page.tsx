import { ProfilePageContent } from "@/components/pages/profile-page-content";
import { getProfile } from "@/lib/auth/session";

export default async function ProfilePage() {
  const profile = await getProfile();

  return <ProfilePageContent isSuperAdmin={profile?.role === "super_admin"} />;
}
