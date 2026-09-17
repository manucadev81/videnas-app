"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ArquivoGerado,
  FornecimentoInsumo,
  PeriodoObrigacao,
  RegistroLacre,
} from "@/lib/tipos";
import {
  chaveDaCadeiaDe,
  construirLacre,
  encadearApos,
  filtrarCadeia,
  montarIdentificadorLacre,
  resumirValoresDeFormulario,
  type AutorLacre,
} from "@/lib/evidencias/lacre";
import { criptografiaDisponivel } from "@/lib/evidencias/cripto";
import {
  montarConteudoArquivoEntregue,
  tamanhoEmBytesDoConteudo,
} from "@/lib/evidencias/conteudo-arquivo";
import { buscarInsumo } from "@/lib/fornecimento/insumos";
import { camposFaltantesDoFormulario } from "@/lib/fornecimento/completude";
import { fornecimentosSemente, lacresSemente } from "@/lib/mock/evidencias";

export interface VerificacaoLacre {
  lacreId: string;
  verificadoEm: string;
  confere: boolean;
  hashCalculado: string;
}

export interface ResultadoEvidencia {
  sucesso: boolean;
  motivo?: string;
  lacre?: RegistroLacre;
}

export interface EstadoEvidencias {
  hidratado: boolean;
  lacres: Record<string, RegistroLacre>;
  fornecimentos: Record<string, Record<string, FornecimentoInsumo>>;
  verificacoes: VerificacaoLacre[];
  registrarFornecimentoArquivo: (entrada: EntradaFornecimentoArquivo) => Promise<ResultadoEvidencia>;
  registrarFornecimentoFormulario: (
    entrada: EntradaFornecimentoFormulario
  ) => Promise<ResultadoEvidencia>;
  registrarEntregaAoCliente: (entrada: EntradaEntregaAoCliente) => Promise<ResultadoEvidencia>;
  registrarVerificacao: (lacreId: string, confere: boolean, hashCalculado: string) => void;
  reiniciarEvidencias: () => void;
}

export interface EntradaFornecimentoArquivo {
  periodo: PeriodoObrigacao;
  insumoId: string;
  arquivo: File;
  linhasAceitas: number;
  autor: AutorLacre;
}

export interface EntradaFornecimentoFormulario {
  periodo: PeriodoObrigacao;
  insumoId: string;
  valores: Record<string, string>;
  autor: AutorLacre;
}

export interface EntradaEntregaAoCliente {
  periodo: PeriodoObrigacao;
  arquivo: ArquivoGerado;
  autor: AutorLacre;
}

type EvidenciasPersistidas = Pick<EstadoEvidencias, "lacres" | "fornecimentos" | "verificacoes">;

export const NOME_ARMAZENAMENTO_EVIDENCIAS = "videnas-evidencias";

const MOTIVO_SEM_CRIPTOGRAFIA =
  "Este navegador não expõe a Web Crypto API. O lacre criptográfico não pode ser gerado agora.";

const MOTIVO_LACRE_JA_EXISTE =
  "Já existe um lacre com este identificador e lacres nunca são sobrescritos. Envie novamente para gerar um lacre novo.";

const MOTIVO_SEM_CONTEUDO_ENTREGUE =
  "Não foi possível reconstruir o conteúdo do arquivo entregue. Sem o conteúdo completo não há o que lacrar — a prova de entrega não foi gerada.";

function lacresIniciais(): Record<string, RegistroLacre> {
  const registro: Record<string, RegistroLacre> = {};
  for (const lacre of lacresSemente) {
    registro[lacre.id] = lacre;
  }
  return registro;
}

function fornecimentosIniciais(): Record<string, Record<string, FornecimentoInsumo>> {
  const registro: Record<string, Record<string, FornecimentoInsumo>> = {};
  for (const [periodoId, porInsumo] of Object.entries(fornecimentosSemente)) {
    registro[periodoId] = { ...porInsumo };
  }
  return registro;
}

function estadoInicial(): EvidenciasPersistidas {
  return {
    lacres: lacresIniciais(),
    fornecimentos: fornecimentosIniciais(),
    verificacoes: [],
  };
}

export function lacresDoPeriodo(
  lacres: Record<string, RegistroLacre>,
  periodoId: string
): RegistroLacre[] {
  return Object.values(lacres)
    .filter((lacre) => lacre.periodoId === periodoId)
    .sort((a, b) => b.seladoEm.localeCompare(a.seladoEm));
}

export function lacresDaInstituicao(
  lacres: Record<string, RegistroLacre>,
  instituicaoId: string | "todas"
): RegistroLacre[] {
  return Object.values(lacres)
    .filter((lacre) => instituicaoId === "todas" || lacre.instituicaoId === instituicaoId)
    .sort((a, b) => b.seladoEm.localeCompare(a.seladoEm));
}

export function fornecimentosDoPeriodo(
  fornecimentos: Record<string, Record<string, FornecimentoInsumo>>,
  periodoId: string
): Record<string, FornecimentoInsumo> {
  return fornecimentos[periodoId] ?? {};
}

export function ultimoLacreDe(
  lacres: Record<string, RegistroLacre>,
  periodoId: string,
  insumoId: string | null
): RegistroLacre | undefined {
  const doPeriodo = Object.values(lacres).filter(
    (lacre) => lacre.periodoId === periodoId && lacre.insumoId === insumoId
  );
  if (doPeriodo.length === 0) {
    return undefined;
  }
  return doPeriodo.sort((a, b) => a.seladoEm.localeCompare(b.seladoEm))[doPeriodo.length - 1];
}

export function lacreDeSaidaDoArquivo(
  lacres: Record<string, RegistroLacre>,
  arquivoId: string
): RegistroLacre | undefined {
  return Object.values(lacres)
    .filter((lacre) => lacre.sentido === "saida" && lacre.arquivoId === arquivoId)
    .sort((a, b) => a.seladoEm.localeCompare(b.seladoEm))
    .at(-1);
}

function proximaSequenciaDaCadeia(
  lacres: Record<string, RegistroLacre>,
  periodo: PeriodoObrigacao,
  sentido: RegistroLacre["sentido"]
): number {
  return (
    Object.values(lacres).filter(
      (lacre) =>
        lacre.sentido === sentido &&
        lacre.instituicaoId === periodo.instituicaoId &&
        lacre.moduloId === periodo.moduloId &&
        lacre.competencia === periodo.competencia
    ).length + 1
  );
}

function ajustarNaCadeia(
  lacre: RegistroLacre,
  lacres: Record<string, RegistroLacre>,
  periodo: PeriodoObrigacao
): RegistroLacre {
  const hashAnterior = encadearApos(
    filtrarCadeia(Object.values(lacres), {
      instituicaoId: periodo.instituicaoId,
      moduloId: periodo.moduloId,
      competencia: periodo.competencia,
      insumoId: lacre.insumoId,
    })
  );

  let sequencia = proximaSequenciaDaCadeia(lacres, periodo, lacre.sentido);
  let id = montarIdentificadorLacre(lacre.sentido, lacre.moduloId, lacre.competencia, sequencia);
  while (lacres[id]) {
    sequencia += 1;
    id = montarIdentificadorLacre(lacre.sentido, lacre.moduloId, lacre.competencia, sequencia);
  }

  if (id === lacre.id && hashAnterior === lacre.hashAnterior) {
    return lacre;
  }

  return { ...lacre, id, hashAnterior };
}

export const useEvidenciasStore = create<EstadoEvidencias>()(
  persist<EstadoEvidencias, [], [], EvidenciasPersistidas>(
    (set, get) => ({
      hidratado: false,
      ...estadoInicial(),

      registrarFornecimentoArquivo: async ({
        periodo,
        insumoId,
        arquivo,
        linhasAceitas,
        autor,
      }: EntradaFornecimentoArquivo) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const definicao = buscarInsumo(insumoId);
        if (!definicao) {
          return { sucesso: false, motivo: `Insumo desconhecido: ${insumoId}.` };
        }

        const lacresAtuais = get().lacres;
        const chave = {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId,
        };
        const cadeia = filtrarCadeia(Object.values(lacresAtuais), chave);

        const conteudo = await arquivo.arrayBuffer();

        const lacre = await construirLacre({
          sentido: "entrada",
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          periodoId: periodo.id,
          insumoId,
          conteudo,
          origemNome: arquivo.name,
          tamanhoBytes: arquivo.size,
          autor,
          hashAnterior: encadearApos(cadeia),
          sequencia: proximaSequenciaDaCadeia(lacresAtuais, periodo, "entrada"),
        });

        let gravado = lacre;

        set((estado) => {
          const definitivo = ajustarNaCadeia(lacre, estado.lacres, periodo);
          if (estado.lacres[definitivo.id]) {
            return estado;
          }
          gravado = definitivo;
          const doPeriodo = estado.fornecimentos[periodo.id] ?? {};
          return {
            lacres: { ...estado.lacres, [definitivo.id]: definitivo },
            fornecimentos: {
              ...estado.fornecimentos,
              [periodo.id]: {
                ...doPeriodo,
                [insumoId]: {
                  insumoId,
                  periodoId: periodo.id,
                  status: "fornecido",
                  lacreId: definitivo.id,
                  fornecidoEm: definitivo.seladoEm,
                  fornecidoPorUsuarioId: autor.usuarioId,
                  nomeArquivo: arquivo.name,
                  tamanhoBytes: arquivo.size,
                  linhasAceitas,
                  valoresFormulario: null,
                  camposFaltantes: [],
                },
              },
            },
          };
        });

        if (get().lacres[gravado.id] !== gravado) {
          return { sucesso: false, motivo: MOTIVO_LACRE_JA_EXISTE };
        }

        return { sucesso: true, lacre: gravado };
      },

      registrarFornecimentoFormulario: async ({
        periodo,
        insumoId,
        valores,
        autor,
      }: EntradaFornecimentoFormulario) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const definicao = buscarInsumo(insumoId);
        if (!definicao) {
          return { sucesso: false, motivo: `Insumo desconhecido: ${insumoId}.` };
        }

        const camposFaltantes = camposFaltantesDoFormulario(definicao, valores);
        const lacresAtuais = get().lacres;
        const chave = {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId,
        };
        const cadeia = filtrarCadeia(Object.values(lacresAtuais), chave);

        const serializado = JSON.stringify(
          {
            insumo: insumoId,
            periodo: periodo.id,
            competencia: periodo.competencia,
            valores,
          },
          null,
          2
        );

        const lacre = await construirLacre({
          sentido: "entrada",
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          periodoId: periodo.id,
          insumoId,
          conteudo: serializado,
          origemNome: `${definicao.rotulo} (formulário)`,
          tamanhoBytes: new TextEncoder().encode(serializado).byteLength,
          autor,
          hashAnterior: encadearApos(cadeia),
          sequencia: proximaSequenciaDaCadeia(lacresAtuais, periodo, "entrada"),
        });

        const lacreComResumo: RegistroLacre = {
          ...lacre,
          resumoConteudo: resumirValoresDeFormulario(valores),
        };

        let gravado = lacreComResumo;

        set((estado) => {
          const definitivo = ajustarNaCadeia(lacreComResumo, estado.lacres, periodo);
          if (estado.lacres[definitivo.id]) {
            return estado;
          }
          gravado = definitivo;
          const doPeriodo = estado.fornecimentos[periodo.id] ?? {};
          return {
            lacres: { ...estado.lacres, [definitivo.id]: definitivo },
            fornecimentos: {
              ...estado.fornecimentos,
              [periodo.id]: {
                ...doPeriodo,
                [insumoId]: {
                  insumoId,
                  periodoId: periodo.id,
                  status: camposFaltantes.length === 0 ? "fornecido" : "parcial",
                  lacreId: definitivo.id,
                  fornecidoEm: definitivo.seladoEm,
                  fornecidoPorUsuarioId: autor.usuarioId,
                  nomeArquivo: null,
                  tamanhoBytes: null,
                  linhasAceitas: null,
                  valoresFormulario: { ...valores },
                  camposFaltantes,
                },
              },
            },
          };
        });

        if (get().lacres[gravado.id] !== gravado) {
          return { sucesso: false, motivo: MOTIVO_LACRE_JA_EXISTE };
        }

        return { sucesso: true, lacre: gravado };
      },

      registrarEntregaAoCliente: async ({
        periodo,
        arquivo,
        autor,
      }: EntradaEntregaAoCliente) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const lacresAtuais = get().lacres;
        const chave = {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId: null,
        };
        const cadeia = filtrarCadeia(Object.values(lacresAtuais), chave);

        const conteudo = montarConteudoArquivoEntregue(arquivo, periodo);
        if (conteudo.trim().length === 0) {
          return { sucesso: false, motivo: MOTIVO_SEM_CONTEUDO_ENTREGUE };
        }

        const lacre = await construirLacre({
          sentido: "saida",
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          periodoId: periodo.id,
          insumoId: null,
          arquivoId: arquivo.id,
          conteudo,
          origemNome: arquivo.nomeArquivo,
          tamanhoBytes: tamanhoEmBytesDoConteudo(conteudo),
          autor,
          hashAnterior: encadearApos(cadeia),
          sequencia: proximaSequenciaDaCadeia(lacresAtuais, periodo, "saida"),
        });

        let gravado = lacre;

        set((estado) => {
          const definitivo = ajustarNaCadeia(lacre, estado.lacres, periodo);
          if (estado.lacres[definitivo.id]) {
            return estado;
          }
          gravado = definitivo;
          return { lacres: { ...estado.lacres, [definitivo.id]: definitivo } };
        });

        if (get().lacres[gravado.id] !== gravado) {
          return { sucesso: false, motivo: MOTIVO_LACRE_JA_EXISTE };
        }

        return { sucesso: true, lacre: gravado };
      },

      registrarVerificacao: (lacreId: string, confere: boolean, hashCalculado: string) => {
        set((estado) => ({
          verificacoes: [
            { lacreId, verificadoEm: new Date().toISOString(), confere, hashCalculado },
            ...estado.verificacoes,
          ],
        }));
      },

      reiniciarEvidencias: () => {
        set({ ...estadoInicial() });
      },
    }),
    {
      name: NOME_ARMAZENAMENTO_EVIDENCIAS,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (estado) => ({
        lacres: estado.lacres,
        fornecimentos: estado.fornecimentos,
        verificacoes: estado.verificacoes,
      }),
      merge: (persistido, atual) => {
        const parcial = (persistido ?? {}) as Partial<EvidenciasPersistidas>;
        return {
          ...atual,
          ...parcial,
          lacres: { ...atual.lacres, ...(parcial.lacres ?? {}) },
          fornecimentos: { ...atual.fornecimentos, ...(parcial.fornecimentos ?? {}) },
          verificacoes: parcial.verificacoes ?? atual.verificacoes,
        };
      },
      onRehydrateStorage: () => () => {
        useEvidenciasStore.setState({ hidratado: true });
      },
    }
  )
);

export function useHidratarEvidencias(): boolean {
  const hidratado = useEvidenciasStore((estado) => estado.hidratado);

  useEffect(() => {
    const armazenamento = useEvidenciasStore.persist;

    if (!armazenamento) {
      useEvidenciasStore.setState({ hidratado: true });
      return;
    }

    if (!armazenamento.hasHydrated()) {
      void armazenamento.rehydrate();
    }
  }, []);

  return hidratado;
}

export { chaveDaCadeiaDe };
