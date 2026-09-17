"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Info, LogIn } from "lucide-react";
import { LogoSentinellus } from "@/components/marca/logo-sentinellus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessaoStore } from "@/lib/store/sessao";
import { cn } from "@/lib/utils";

interface AtalhoDemo {
  email: string;
  rotulo: string;
  instituicao: string;
}

const ATALHOS: AtalhoDemo[] = [
  {
    email: "ricardo.menezes@meridiandigital.com.br",
    rotulo: "Diretor / Compliance",
    instituicao: "Meridian Digital Assets",
  },
  {
    email: "paula.arantes@meridiandigital.com.br",
    rotulo: "Operacional / Backoffice",
    instituicao: "Meridian Digital Assets",
  },
  {
    email: "joao.beraldo@contabilberaldo.com.br",
    rotulo: "Contador / Fiscal",
    instituicao: "Atende os 3 tenants",
  },
  {
    email: "t.nakamura@sentinellus.com.br",
    rotulo: "Executor",
    instituicao: "Sentinellus",
  },
  {
    email: "c.veloso@sentinellus.com.br",
    rotulo: "Validador",
    instituicao: "Sentinellus",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const entrar = useSessaoStore((estado) => estado.entrar);

  const [email, setEmail] = useState(ATALHOS[0].email);
  const [senha, setSenha] = useState("demonstracao");
  const [erroEmail, setErroEmail] = useState<string | null>(null);

  function autenticar(emailInformado: string) {
    const emailNormalizado = emailInformado.trim();
    if (!emailNormalizado) {
      setErroEmail("Informe um e-mail para continuar.");
      return;
    }

    setErroEmail(null);
    const resultado = entrar(emailNormalizado);

    if (!resultado.reconhecido) {
      toast.info("Usuário não reconhecido na demonstração. Entrando como Operacional / Backoffice.");
    } else {
      toast.success("Login simulado realizado.");
    }

    router.push("/selecionar-instituicao");
  }

  function aoSubmeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    autenticar(email);
  }

  function aoClicarAtalho(atalho: AtalhoDemo) {
    setEmail(atalho.email);
    setSenha("demonstracao");
    autenticar(atalho.email);
  }

  return (
    <div className="flex min-h-full flex-1">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-linear-to-br from-brand-700 to-brand-800 p-10 text-white md:flex">
        <Image
          src="/logowhite-cropped.png"
          alt="Sentinellus"
          width={212}
          height={40}
          priority
          unoptimized
          className="h-10 w-auto self-start"
        />
        <div className="max-w-md">
          <p className="font-display text-3xl font-bold text-balance">
            Do dado bruto ao arquivo pronto para o Banco Central, com trilha de auditoria em cada etapa.
          </p>
          <p className="mt-4 text-sm text-brand-100">
            Ambiente de demonstração da plataforma Sentinellus, com dados e usuários fictícios.
          </p>
        </div>
        <p className="text-xs text-brand-200">
          A Sentinellus é prestadora de serviços tecnológicos (RegTech). Não é instituição financeira, PSAV ou
          SPSAV.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-white px-4 py-12 md:px-8">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-700"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para a página inicial
          </Link>

          <div className="mb-6 md:hidden">
            <LogoSentinellus className="h-8 w-auto text-brand-700" />
          </div>

          <h1 className="font-display text-2xl font-bold text-neutral-700">Entrar</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Acesse o ambiente de demonstração da Sentinellus.
          </p>

          <form className="mt-6 space-y-4" onSubmit={aoSubmeter} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="campo-email">E-mail</Label>
              <Input
                id="campo-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                aria-invalid={erroEmail ? true : undefined}
                aria-describedby={erroEmail ? "erro-email" : undefined}
                suppressHydrationWarning
              />
              {erroEmail ? (
                <p id="erro-email" className="text-xs text-status-error-text">
                  {erroEmail}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campo-senha">Senha</Label>
              <Input
                id="campo-senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                minLength={1}
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                suppressHydrationWarning
              />
            </div>

            <Button type="submit" className="w-full">
              <LogIn className="size-4" aria-hidden="true" />
              Entrar
            </Button>
          </form>

          <div className="mt-8">
            <p className="text-xs font-medium text-neutral-500">Atalhos de demonstração</p>
            <div className="mt-2 flex flex-col gap-2">
              {ATALHOS.map((atalho) => (
                <button
                  key={atalho.email}
                  type="button"
                  onClick={() => aoClicarAtalho(atalho)}
                  className={cn(
                    "flex flex-col items-start rounded-md border border-neutral-200 px-3 py-2 text-left text-xs transition-colors hover:border-brand-300 hover:bg-brand-50"
                  )}
                >
                  <span className="font-medium text-neutral-700">{atalho.rotulo}</span>
                  <span className="text-neutral-500">
                    {atalho.email} · {atalho.instituicao}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-2 rounded-md bg-status-info-bg p-3 text-xs text-status-info-text">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>Ambiente de demonstração. Nenhuma credencial é verificada e nenhum dado real é processado.</p>
          </div>

          <p className="mt-8 text-center text-[11px] leading-relaxed text-neutral-400">
            A Sentinellus é prestadora de serviços tecnológicos (RegTech). Não é instituição financeira, PSAV ou
            SPSAV, não realiza custódia de ativos virtuais, não emite NFS-e e não substitui contador ou advogado.
          </p>
        </div>
      </div>
    </div>
  );
}
