import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Building2,
  CircleCheck,
  Fingerprint,
  Landmark,
  ShieldCheck,
  Vault,
  Wallet,
  Workflow,
} from "lucide-react";
import { LogoVidenas } from "@/components/marca/logo-videnas";
import { BannerPosicionamento } from "@/components/dominio/banner-posicionamento";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buscarModulo } from "@/lib/mock/modulos";
import type { EtapaId } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Videnas — Conformidade regulatória de ativos virtuais",
  description:
    "RegTech que estrutura, valida e audita os arquivos ACAM212, Cadoc 5710/5711 e a estrutura fiscal DPS para exchanges, custodiantes e mesas de OTC brasileiras, do dado bruto ao arquivo pronto para o Banco Central.",
};

const ROTULO_ETAPA: Record<EtapaId, string> = {
  ingestao: "Ingestão",
  geracao: "Geração",
  contador: "Contador",
  validacao: "Validação",
  auditoria: "Auditoria",
  entrega: "Entrega",
};

const acam212 = buscarModulo("acam212");
const cadoc5711 = buscarModulo("cadoc5711");
const cadoc5710 = buscarModulo("cadoc5710");
const fiscal = buscarModulo("fiscal");

const JORNADA = [
  {
    titulo: "Onboarding",
    descricao: "Cadastro da instituição, usuários, papéis e dicionários de referência (ativos, contas, dados fiscais).",
  },
  {
    titulo: "Alimentação de dados",
    descricao: "A instituição envia ou integra os dados do período: operações, posições de custódia, serviços prestados.",
  },
  {
    titulo: "Geração",
    descricao: "O time Videnas monta o arquivo ou a estrutura de cada módulo aplicável, com hash calculado.",
  },
  {
    titulo: "Validação",
    descricao: "Conferência contra o schema oficial e as regras determinísticas do módulo. No Fiscal, o contador confirma alíquota, retenção e enquadramento.",
  },
  {
    titulo: "Auditoria",
    descricao: "Registro de hash, carimbo de tempo e autoria de cada geração, validação e aprovação, em trilha imutável.",
  },
  {
    titulo: "Entrega",
    descricao: "O arquivo ou a estrutura fica disponível para download, íntegro e pronto para a etapa seguinte.",
  },
  {
    titulo: "Acompanhamento",
    descricao: "A instituição consulta status e histórico e trata pendências, com o time Videnas apoiando a operação.",
  },
];

const MODULOS_CARD = [
  {
    icone: ShieldCheck,
    modulo: acam212,
    destaque: "1.284 operações/mês em média nos tenants de demonstração",
  },
  {
    icone: Vault,
    modulo: cadoc5711,
    moduloComplementar: cadoc5710,
    destaque: "Posição diária (5711) e mensal por carteira (5710), incluindo staking",
  },
  {
    icone: Wallet,
    modulo: fiscal,
    destaque: "Estruturação da DPS para validação obrigatória do contador",
  },
];

const FAQ = [
  {
    pergunta: "A Videnas envia o arquivo ao Banco Central por mim?",
    resposta:
      "Não. A Videnas entrega o arquivo pronto, íntegro e com hash calculado. A transmissão ao Banco Central é feita pela própria instituição, fora da plataforma.",
  },
  {
    pergunta: "A Videnas emite a NFS-e?",
    resposta:
      "Não. No módulo Fiscal (candidato) a Videnas estrutura a DPS a partir dos dados enviados. A emissão da nota em si ocorre fora da Videnas, pelo emissor que a instituição definir.",
  },
  {
    pergunta: "A Videnas substitui meu contador?",
    resposta:
      "Não. A definição de alíquota, retenção e enquadramento tributário é sempre do contador responsável pela instituição — a validação dele é obrigatória antes da liberação no módulo Fiscal.",
  },
  {
    pergunta: "A Videnas é custodiante dos meus ativos?",
    resposta:
      "Não. A Videnas não custodia ativos virtuais de ninguém. Ela recebe os dados de posição que a instituição já mantém e os estrutura no formato exigido pelo regulador.",
  },
  {
    pergunta: "Quem responde perante o regulador?",
    resposta:
      "A instituição cliente. É ela quem está registrada perante o Banco Central, o município e a Receita Federal, quem aprova o conteúdo do arquivo e quem faz a transmissão.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" aria-label="Página inicial da Videnas">
            <LogoVidenas className="h-7 w-auto text-brand-700" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            Entrar
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section
          className="relative overflow-hidden bg-linear-to-br from-brand-700 to-brand-800 text-white"
          aria-labelledby="hero-titulo"
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center md:px-6 md:py-24">
            <LogoVidenas className="h-12 w-auto text-white" />
            <h1 id="hero-titulo" className="max-w-3xl text-3xl font-bold text-balance md:text-5xl">
              Conformidade regulatória de ativos virtuais, do dado bruto ao arquivo pronto para o Banco Central.
            </h1>
            <p className="max-w-2xl text-base text-brand-100 md:text-lg">
              A Videnas estrutura, valida e audita os arquivos ACAM212, Cadoc 5710/5711 e a estrutura fiscal
              DPS para exchanges, custodiantes e mesas de OTC brasileiras que operam com criptoativos.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"
              >
                Entrar na plataforma
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a
                href="mailto:contato@videnas.com.br"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Falar com o time
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6" aria-labelledby="modulos-titulo">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="modulos-titulo" className="font-display text-2xl font-bold text-neutral-700 md:text-3xl">
              O que a Videnas faz
            </h2>
            <p className="mt-3 text-sm text-neutral-500 md:text-base">
              Três módulos, cinco etapas comuns por competência: Ingestão, Geração, Validação, Auditoria e Entrega.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {MODULOS_CARD.map(({ icone: Icone, modulo, moduloComplementar, destaque }) => (
              <div
                key={modulo.id}
                className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-elevado-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icone className="size-5" aria-hidden="true" />
                  </div>
                  {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-neutral-700">
                    {moduloComplementar ? `${modulo.nome} / ${moduloComplementar.nome}` : modulo.nome}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {modulo.descricaoCurta}
                    {moduloComplementar ? ` ${moduloComplementar.descricaoCurta}` : ""}
                  </p>
                </div>

                <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs font-medium text-brand-700">
                  {modulo.etapas.map((etapa, indice) => (
                    <li key={etapa} className="flex items-center gap-1.5">
                      <span className="rounded-full bg-brand-50 px-2 py-1">{ROTULO_ETAPA[etapa]}</span>
                      {indice < modulo.etapas.length - 1 ? (
                        <ArrowRight className="size-3 text-neutral-300" aria-hidden="true" />
                      ) : null}
                    </li>
                  ))}
                </ol>

                <p className="text-xs text-neutral-400">{destaque}</p>

                {modulo.candidato ? (
                  <p className="rounded-md bg-status-candidate-bg px-3 py-2 text-xs text-status-candidate-text">
                    A emissão da NFS-e ocorre fora da Videnas.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-neutral-50 py-12" aria-labelledby="jornada-titulo">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="jornada-titulo" className="font-display text-2xl font-bold text-neutral-700 md:text-3xl">
                Como funciona
              </h2>
              <p className="mt-3 text-sm text-neutral-500 md:text-base">
                Uma jornada única de sete etapas, repetida por módulo na cadência de cada um.
              </p>
            </div>

            <ol className="mt-10 grid gap-4 md:grid-cols-4">
              {JORNADA.map((etapa, indice) => (
                <li
                  key={etapa.titulo}
                  className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                    {indice + 1}
                  </span>
                  <p className="text-sm font-bold text-neutral-700">{etapa.titulo}</p>
                  <p className="text-xs text-neutral-500">{etapa.descricao}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6" aria-labelledby="segregacao-titulo">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="segregacao-titulo" className="font-display text-2xl font-bold text-neutral-700 md:text-3xl">
              Segregação de funções
            </h2>
            <p className="mt-3 text-sm text-neutral-500 md:text-base">
              Nunca a mesma pessoa. Nunca o mesmo papel.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
              <Workflow className="mx-auto size-8 text-brand-700" aria-hidden="true" />
              <p className="mt-3 font-display text-base font-bold text-neutral-700">Executor gera</p>
              <p className="mt-1 text-sm text-neutral-500">
                O time Videnas roda a ingestão e monta o arquivo. Nunca libera o que gerou.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
              <CircleCheck className="mx-auto size-8 text-brand-700" aria-hidden="true" />
              <p className="mt-3 font-display text-base font-bold text-neutral-700">Validador libera</p>
              <p className="mt-1 text-sm text-neutral-500">
                Confere o arquivo contra o schema oficial e libera para a instituição — sempre uma pessoa diferente
                de quem gerou.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
              <ShieldCheck className="mx-auto size-8 text-brand-700" aria-hidden="true" />
              <p className="mt-3 font-display text-base font-bold text-neutral-700">Instituição aprova e envia</p>
              <p className="mt-1 text-sm text-neutral-500">
                O Responsável de Compliance da casa cliente assume a obrigação e transmite ao órgão.
                A Videnas não envia o arquivo ao regulador.
              </p>
            </div>
          </div>
        </section>

        <section
          className="border-y-4 border-brand-700 bg-brand-900 py-14 text-white"
          aria-labelledby="posicionamento-titulo"
        >
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <div className="flex items-center gap-2 text-brand-200">
              <Fingerprint className="size-6" aria-hidden="true" />
              <span className="text-xs font-bold tracking-wide uppercase">Posicionamento — leia com atenção</span>
            </div>
            <h2 id="posicionamento-titulo" className="mt-3 font-display text-2xl font-bold md:text-3xl">
              O que a Videnas é — e o que ela não é
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-brand-100 md:text-base">
              <p>
                A Videnas é uma <strong className="text-white">prestadora de serviços tecnológicos: uma RegTech</strong>.
                Recebemos os dados que a sua instituição nos envia, organizamos, estruturamos os arquivos no formato
                exigido pelo regulador, validamos contra o schema oficial e registramos a trilha de auditoria de
                cada etapa.
              </p>
              <p>
                A Videnas <strong className="text-white">não</strong> é instituição financeira,{" "}
                <strong className="text-white">não</strong> é prestadora de serviços de ativos virtuais (PSAV ou
                SPSAV), <strong className="text-white">não</strong> custodia ativos virtuais de ninguém,{" "}
                <strong className="text-white">não</strong> transmite o arquivo ao Banco Central em nome da
                instituição, <strong className="text-white">não</strong> emite NFS-e e{" "}
                <strong className="text-white">não</strong> substitui o trabalho do seu contador ou do seu
                advogado.
              </p>
              <p>
                A <strong className="text-white">instituição cliente</strong> é quem está registrada perante o
                Banco Central, o município e a Receita Federal. É ela quem responde pela obrigação, quem aprova o
                conteúdo do arquivo e quem faz a transmissão. A Videnas entrega o arquivo pronto, íntegro e
                auditável — a decisão e a responsabilidade continuam sendo de quem é regulado.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6" aria-labelledby="para-quem-titulo">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="para-quem-titulo" className="font-display text-2xl font-bold text-neutral-700 md:text-3xl">
              Para quem
            </h2>
            <p className="mt-3 text-sm text-neutral-500 md:text-base">
              Instituições brasileiras que operam com criptoativos e respondem por obrigações regulatórias perante
              o Banco Central, o município e a Receita Federal.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icone: Landmark, titulo: "SPSAVs", descricao: "Prestadoras de serviço de ativos virtuais em processo de autorização." },
              { icone: Building2, titulo: "Exchanges", descricao: "Plataformas de negociação de criptoativos." },
              { icone: Vault, titulo: "Custodiantes", descricao: "Instituições que mantêm posição de custódia própria ou de terceiros." },
              { icone: Banknote, titulo: "Mesas de OTC", descricao: "Operações de câmbio e negociação balcão com ativos virtuais." },
            ].map(({ icone: Icone, titulo, descricao }) => (
              <div key={titulo} className="rounded-lg border border-neutral-200 bg-white p-5 text-center">
                <Icone className="mx-auto size-7 text-brand-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-neutral-700">{titulo}</p>
                <p className="mt-1 text-xs text-neutral-500">{descricao}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-neutral-50 py-12" aria-labelledby="faq-titulo">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <h2 id="faq-titulo" className="text-center font-display text-2xl font-bold text-neutral-700 md:text-3xl">
              Perguntas de delimitação
            </h2>
            <Accordion className="mt-8 rounded-xl border border-neutral-200 bg-white px-4">
              {FAQ.map((item) => (
                <AccordionItem key={item.pergunta} value={item.pergunta}>
                  <AccordionTrigger className="text-neutral-700">{item.pergunta}</AccordionTrigger>
                  <AccordionContent className="text-neutral-500">{item.resposta}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <BannerPosicionamento />
        </section>

        <section className="bg-linear-to-br from-brand-700 to-brand-800 py-14 text-white" aria-labelledby="cta-titulo">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center md:px-6">
            <h2 id="cta-titulo" className="font-display text-2xl font-bold md:text-3xl">
              Pronto para ver a plataforma em ação?
            </h2>
            <p className="text-sm text-brand-100 md:text-base">
              Entre no ambiente de demonstração e acompanhe o fluxo completo, do dado bruto ao arquivo pronto para
              o Banco Central.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"
            >
              Entrar na plataforma
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 md:flex-row md:items-start md:justify-between md:px-6">
          <div className="max-w-xl">
            <LogoVidenas className="h-6 w-auto text-brand-700" />
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">
              A Videnas é prestadora de serviços tecnológicos (RegTech). Não é instituição financeira, PSAV ou
              SPSAV, não realiza custódia de ativos virtuais, não emite NFS-e e não substitui contador ou advogado.
              A responsabilidade pela obrigação regulatória perante o Banco Central do Brasil, o município e a
              Receita Federal é da instituição cliente.
            </p>
            <p className="mt-3 text-xs text-neutral-400">
              Videnas Tecnologia Regulatória Ltda (fictícia, ambiente de demonstração) · CNPJ 09.876.543/0001-21
            </p>
          </div>
          <nav aria-label="Links institucionais" className="flex gap-4 text-xs text-neutral-500">
            <Link href="/login" className="hover:text-brand-700">
              Entrar
            </Link>
            <a href="mailto:contato@videnas.com.br" className="hover:text-brand-700">
              Contato
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
