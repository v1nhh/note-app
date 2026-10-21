import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { register } from "@/app/auth-actions";
import { getCurrentUser } from "@/lib/session";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Registreren" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect(ROUTES.HOME);

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold">Account maken</h1>

      <AuthForm action={register} submitLabel="Account maken" newPassword />

      <p className="mt-6 text-sm text-ink-3">
        Al een account?{" "}
        <Link href={ROUTES.LOGIN} className="underline">
          Inloggen
        </Link>
      </p>
    </main>
  );
}