import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { login } from "@/app/auth-actions";
import { getCurrentUser } from "@/lib/session";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Inloggen" };

export default async function LoginPage() {
  // Wie al ingelogd is, heeft hier niets te zoeken.
  if (await getCurrentUser()) redirect(ROUTES.HOME);

  return (
    <main className="page page-narrow">
      <h1 className="view-title">Inloggen</h1>

      <AuthForm action={login} submitLabel="Inloggen" />

      <p className="mt-6 text-sm text-ink-3">
        Nog geen account?{" "}
        <Link href={ROUTES.REGISTER} className="underline">
          Registreren
        </Link>
      </p>
    </main>
  );
}