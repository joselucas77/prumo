"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BoxIcon } from "@/components/ui/box-icon";
import { PrumoLogo } from "@/components/ui/prumo-logo";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Por favor, preencha todos os campos.");
      return;
    }

    if (name.trim().length < 2) {
      setErrorMessage("O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao criar conta.");
      }

      toast.success("Conta criada com sucesso! Bem-vindo ao Prumo.");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao cadastrar conta.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-4 bg-background pt-[env(safe-area-inset-top)] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md bg-card border rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Cabeçalho de Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <PrumoLogo size="lg" className="mb-3 shadow-md" />
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Criar Conta no Prumo
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs">
            Comece a organizar suas tarefas, hábitos e ofensivas de forma personalizada.
          </p>
        </div>

        {/* Mensagem de Erro Inline */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
            <BoxIcon name="error-circle" className="text-base shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário de Cadastro */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="registerName" className="text-xs font-semibold text-foreground">
              Nome Completo
            </label>
            <div className="relative">
              <BoxIcon
                name="user"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base"
              />
              <Input
                id="registerName"
                type="text"
                required
                autoComplete="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 text-base md:text-sm h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="registerEmail" className="text-xs font-semibold text-foreground">
              E-mail
            </label>
            <div className="relative">
              <BoxIcon
                name="envelope"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base"
              />
              <Input
                id="registerEmail"
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
            <label htmlFor="registerPassword" className="text-xs font-semibold text-foreground">
              Senha (mínimo 6 caracteres)
            </label>
            <div className="relative">
              <BoxIcon
                name="lock-alt"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base"
              />
              <Input
                id="registerPassword"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Crie uma senha forte"
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
                Criando conta...
              </>
            ) : (
              "Criar Conta"
            )}
          </Button>
        </form>

        {/* Rodapé / Link para Login */}
        <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
          Já possui uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Entrar com e-mail e senha
          </Link>
        </div>
      </div>
    </div>
  );
}
