import { Suspense } from "react";
import ResetPasswordForm from "./reset-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-paper" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
