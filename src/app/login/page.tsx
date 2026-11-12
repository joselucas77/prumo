"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BoxIcon } from "@/components/ui/box-icon";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao entrar na conta.");
      }

      toast.success(`Bem-vindo de volta, ${data.user?.name || "ao Prumo"}!`);
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao realizar login.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md bg-card border rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Cabeçalho de Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl shadow-md mb-3">
            P
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Entrar no Prumo
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs">
            Gerencie suas tarefas e hábitos diários offline e com sincronização segura.
          </p>
        </div>

        {/* Mensagem de Erro Inline se houver */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
            <BoxIcon name="error-circle" className="text-base shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="loginEmail" className="text-xs font-semibold text-foreground">
              E-mail
            </label>
            <div className="relative">
              <BoxIcon
                name="envelope"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base"
              />
              <Input
                id="loginEmail"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 text-base md:text-sm h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="loginPassword" className="text-xs font-semibold text-foreground">
                Senha
              </label>
            </div>
            <div className="relative">
              <BoxIcon
                name="lock-alt"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base"
              />
              <Input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 text-base md:text-sm h-11 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                <BoxIcon name={showPassword ? "hide" : "show"} className="text-base" />
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl font-bold text-sm mt-2 shadow-sm"
          >
            {isLoading ? (
              <>
                <BoxIcon name="loader-alt" className="animate-spin text-lg mr-2" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        {/* Rodapé / Link para Cadastro */}
        <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
          Ainda não tem uma conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Criar conta gratuitamente
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-muted/30">
          <div className="w-full max-w-md bg-card border rounded-3xl p-8 shadow-xl flex items-center justify-center">
            <BoxIcon name="loader-alt" className="animate-spin text-2xl text-primary" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
