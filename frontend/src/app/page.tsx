/**
 * Home page - Redirects users to login if not authenticated
 * Serves as the root entry point of the application
 */
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
