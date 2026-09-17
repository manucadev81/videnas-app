"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, PackageCheck, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { ValorHash } from "@/components/evidencias/valor-hash";
import { DialogoVerificarIntegridade } from "@/components/evidencias/dialogo-verificar-integridade";
import { AvisoEnvelope } from "@/components/evidencias/aviso-envelope";
import {
  baixarComprovante,
  contextoComprovanteDoLacre,
} from "@/components/evidencias/comprovante";
import { baixarArquivoEntregue } from "@/components/evidencias/arquivo-entregue";
import {
  lacresDaInstituicao,
  useEvidenciasStore,
  useHidratarEvidencias,
} from "@/lib/store/evidencias";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarPerfil } from "@/lib/permissoes";
import { formatarCompetencia, formatarDataHora } from "@/lib/formatadores";
import type { ArquivoGerado, PeriodoObrigacao, RegistroLacre } from "@/lib/tipos";

function baixar(lacre: RegistroLacre) {
  try {
    baixarComprovante(
      lacre,
      contextoComprovanteDoLacre(
        lacre,
        "Comprovante do arquivo disponibilizado pela Videnas à instituição."
      )
    );
    toast.success("Comprovante de entrega baixado.");
  } catch {
    toast.error("Não foi possível gerar o comprovante de entrega.");
  }
}

function baixarArquivo(arquivo: ArquivoGerado, periodo: PeriodoObrigacao) {
  try {
    baixarArquivoEntregue(arquivo, periodo);
    toast.success(`${arquivo.nomeArquivo} baixado. Use-o para conferir a integridade.`);
  } catch {
    toast.error("Não foi possível gerar o arquivo para download.");
  }
}

interface AcoesEntregaProps {
  lacre: RegistroLacre;
  arquivo: ArquivoGerado | undefined;
  periodo: PeriodoObrigacao | undefined;
  marcadorVerificar: string;
  aoVerificar: (lacre: RegistroLacre) => void;
}

function AcoesEntrega({
  lacre,
  arquivo,
  periodo,
  marcadorVerificar,
  aoVerificar,
}: AcoesEntregaProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {arquivo && periodo ? (
        <Button type="button" size="sm" onClick={() => baixarArquivo(arquivo, periodo)}>
          <Download aria-hidden="true" />
          Baixar arquivo
        </Button>
      ) : null}
      <Button type="button" variant="outline" size="sm" onClick={() => baixar(lacre)}>
        <Download aria-hidden="true" />
        Comprovante
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-tour={marcadorVerificar}
        onClick={() => aoVerificar(lacre)}
      >
        Verificar integridade
      </Button>
    </div>
  );
}

export default function EntregasPage() {
  const hidratado = useHidratarEvidencias();
  const lacres = useEvidenciasStore((estado) => estado.lacres);
  const periodos = usePeriodosStore((estado) => estado.periodos);
  const arquivos = usePeriodosStore((estado) => estado.arquivos);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);

  const [lacreEmConferencia, setLacreEmConferencia] = useState<RegistroLacre | null>(null);

  const entregas = instituicaoAtivaId
    ? lacresDaInstituicao(lacres, instituicaoAtivaId).filter((lacre) => lacre.sentido === "saida")
    : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-neutral-700">
          <PackageCheck className="size-6 text-brand-700" aria-hidden="true" />
          Arquivos entregues
          <BadgeAjuda chave="entrega.arquivosEntregues" tamanho="sm" side="bottom" />
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-neutral-500">
          Estes são os arquivos que a Videnas lacrou e disponibilizou para a sua instituição — os
          mesmos que você apresenta aos órgãos reguladores. Cada entrega vem com um hash SHA-256:
          ele prova que o arquivo que você tem em mãos é exatamente o que a Videnas entregou,
          naquela data e por aquela pessoa. Se um único byte mudar, o hash deixa de bater.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
        <ShieldQuestion className="size-4 shrink-0 text-neutral-500" aria-hidden="true" />
        <span className="min-w-0">
          Antes de encaminhar um arquivo ao regulador, use Verificar integridade para confirmar que
          o arquivo em mãos continua idêntico ao lacrado.
        </span>
        <BadgeAjuda chave="evidencia.verificarIntegridade" tamanho="xs" side="bottom" />
      </div>

      {!hidratado ? (
        <div role="status" aria-label="Carregando arquivos entregues" className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : entregas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum arquivo entregue nesta instituição"
          mensagem="Assim que a Videnas liberar o primeiro arquivo lacrado da competência, ele aparece aqui com hash, data, hora e comprovante."
          icone={PackageCheck}
        />
      ) : (
        <div data-tour="entregas-lista" className="space-y-3">
          <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Arquivos lacrados e entregues pela Videnas à instituição ativa, com hash, data e
                responsável pela liberação.
              </caption>
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Módulo
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Competência
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Arquivo
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Hash SHA-256
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Entregue em
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Quem liberou
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {entregas.map((lacre) => {
                  const modulo = buscarModulo(lacre.moduloId);
                  const arquivo = lacre.arquivoId ? arquivos[lacre.arquivoId] : undefined;
                  const periodo = periodos[lacre.periodoId];
                  return (
                    <tr key={lacre.id} className="border-t border-neutral-200 align-top">
                      <th
                        scope="row"
                        className="px-4 py-3 text-left font-medium text-neutral-700"
                      >
                        <span className="flex flex-wrap items-center gap-1.5">
                          {modulo.nome}
                          {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
                        </span>
                      </th>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatarCompetencia(lacre.competencia)}
                      </td>
                      <td className="max-w-56 px-4 py-3 break-all text-neutral-600">
                        {lacre.origemNome}
                      </td>
                      <td className="px-4 py-3">
                        <ValorHash hash={lacre.hashSha256} truncado />
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatarDataHora(lacre.seladoEm)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {lacre.seladoPorNome}
                        <span className="block text-xs text-neutral-500">
                          {buscarPerfil(lacre.perfilId).rotulo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <AcoesEntrega
                          lacre={lacre}
                          arquivo={arquivo}
                          periodo={periodo}
                          marcadorVerificar="entregas-verificar-tabela"
                          aoVerificar={setLacreEmConferencia}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {entregas.map((lacre) => {
              const modulo = buscarModulo(lacre.moduloId);
              const arquivo = lacre.arquivoId ? arquivos[lacre.arquivoId] : undefined;
              const periodo = periodos[lacre.periodoId];
              return (
                <li
                  key={lacre.id}
                  className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-bold text-neutral-700">
                      {modulo.nome}
                    </h2>
                    {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
                    <span className="text-sm text-neutral-500">
                      {formatarCompetencia(lacre.competencia)}
                    </span>
                  </div>

                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs font-medium text-neutral-500">Arquivo</dt>
                      <dd className="text-sm break-all text-neutral-700">{lacre.origemNome}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500">Hash SHA-256</dt>
                      <dd className="mt-1">
                        <ValorHash hash={lacre.hashSha256} truncado />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500">Entregue em</dt>
                      <dd className="text-sm text-neutral-700">
                        {formatarDataHora(lacre.seladoEm)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500">Quem liberou</dt>
                      <dd className="text-sm text-neutral-700">
                        {lacre.seladoPorNome} · {buscarPerfil(lacre.perfilId).rotulo}
                      </dd>
                    </div>
                  </dl>

                  <AcoesEntrega
                    lacre={lacre}
                    arquivo={arquivo}
                    periodo={periodo}
                    marcadorVerificar="entregas-verificar-cartao"
                    aoVerificar={setLacreEmConferencia}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <AvisoEnvelope />

      <DialogoVerificarIntegridade
        lacre={lacreEmConferencia}
        aoFechar={() => setLacreEmConferencia(null)}
      />
    </div>
  );
}
