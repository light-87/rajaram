import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to todos page
  redirect("/todos");
}
