import { curateArt } from "@/functions/art";

export default async function AdminDashboardPage() {
  await curateArt();

  return (
    <div>
      <h1>DASHBOARD</h1>
    </div>
  );
}
