import { redirect } from "next/navigation";
import { getAuthToken, verifyToken } from "@/lib/auth";

export default async function Home() {
  const token = await getAuthToken();
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      redirect("/dashboard");
    }
  }
  redirect("/login");
}
