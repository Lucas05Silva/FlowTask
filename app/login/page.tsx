"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = login(email, password);
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError(res.error ?? "Não foi possível entrar.");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center bg-canvas bg-aurora px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={48} />
          <p className="mt-3 text-sm text-muted">
            A central de produtividade de Lucas &amp; Thaiane
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-6 shadow-pop">
          <h1 className="mb-1 text-xl font-semibold text-content">Bem-vindo de volta 👋</h1>
          <p className="mb-6 text-sm text-muted">Entre para continuar de onde parou.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="voce@flowsys.lt"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-input bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={submitting} className="w-full justify-center">
              Entrar
            </Button>
          </form>

          <p className="mt-5 rounded-input bg-panel px-3 py-2 text-center text-xs text-muted">
            Demo: <strong>lukasoliveira47210@gmail.com</strong> ou{" "}
            <strong>thaiane@flowtask.app</strong> · senha <strong>flowtask</strong>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
