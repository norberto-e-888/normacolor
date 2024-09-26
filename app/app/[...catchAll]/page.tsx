import { redirect } from "next/navigation";

export default function AppCatchAllPage() {
  redirect("/app");
}
