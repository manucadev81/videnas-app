import type { ModuloId } from "@/lib/tipos";
import {
  ROTULO_DELIMITADOR,
  buscarEspecificacao,
  listarExtensoes,
  type EspecificacaoColuna,
  type EspecificacaoModulo,
} from "@/lib/ingestao/especificacoes";
import {
  competenciaDaData,
  converterNumero,
  detectarDelimitador,
  dividirLinha,
  ehBooleanoReconhecido,
  ehDataBrasileira,
  ehDataHoraIso,
  ehDataIso,
  ehDocumentoValido,
  normalizarChave,
  obterExtensao,
  obterNomeBase,
  possuiCaractereInvalido,
  removerMarcaDeOrdem,
  rotuloDocumento,
  separarLinhas,
} from "@/lib/ingestao/analise";

export type SeveridadeNaoConformidade = "bloqueante" | "aviso";

export interface NaoConformidade {
  id: string;
  codigo: string;
  severidade: SeveridadeNaoConformidade;
  linha: number | null;
  campo: string | null;
  mensagem: string;
  ajuste: string;
  ocorrenciasAdicionais: number;
}

export interface ResumoPreValidacao {
  nomeArquivo: string;
  tamanhoBytes: number;
  extensao: string;
  moduloId: ModuloId;
  competenciaEsperada: string;
  competenciaDetectada: string | null;
  instituicaoEsperada: string;
  instituicaoDetectada: string | null;
  delimitador: string | null;
  rotuloDelimitador: string;
  colunasDetectadas: string[];
  linhasLidas: number;
  linhasValidas: number;
  linhasComRessalva: number;
  linhasComPendencia: number;
  previsualizavel: boolean;
}

export interface ResultadoPreValidacao {
  id: string;
  resumo: ResumoPreValidacao;
  amostra: Record<string, string>[];
  colunasAmostra: EspecificacaoColuna[];
  naoConformidades: NaoConformidade[];
  totalBloqueantes: number;
  totalAvisos: number;
  conforme: boolean;
}

export interface ContextoPreValidacao {
  moduloId: ModuloId;
  competencia: string;
  instituicaoSlug: string;
  instituicaoNome: string;
}

const LIMITE_POR_CODIGO = 5;
const LIMITE_AMOSTRA = 10;
const LIMITE_LINHAS_ANALISADAS = 5000;

const PADRAO_NOME = /^([a-z0-9]+)_([a-z0-9-]+)_(\d{6})$/;

interface PendenciaCampo {
  bloqueante: boolean;
  aviso: boolean;
}

interface RegistroNaoConformidade {
  codigo: string;
  severidade: SeveridadeNaoConformidade;
  linha?: number | null;
  campo?: string | null;
  mensagem: string;
  ajuste: string;
}

function criarColetor() {
  const itens: NaoConformidade[] = [];
  const totaisPorCodigo = new Map<string, number>();
  let sequencia = 0;

  return {
    registrar(registro: RegistroNaoConformidade) {
      const total = (totaisPorCodigo.get(registro.codigo) ?? 0) + 1;
      totaisPorCodigo.set(registro.codigo, total);
      if (total > LIMITE_POR_CODIGO) return;
      sequencia += 1;
      itens.push({
        id: `nc-${sequencia.toString().padStart(3, "0")}`,
        codigo: registro.codigo,
        severidade: registro.severidade,
        linha: registro.linha ?? null,
        campo: registro.campo ?? null,
        mensagem: registro.mensagem,
        ajuste: registro.ajuste,
        ocorrenciasAdicionais: 0,
      });
    },
    finalizar(): NaoConformidade[] {
      for (const [codigo, total] of totaisPorCodigo) {
        if (total <= LIMITE_POR_CODIGO) continue;
        for (let indice = itens.length - 1; indice >= 0; indice -= 1) {
          if (itens[indice].codigo === codigo) {
            itens[indice] = { ...itens[indice], ocorrenciasAdicionais: total - LIMITE_POR_CODIGO };
            break;
          }
        }
      }
      return itens;
    },
  };
}

function competenciaCompacta(competencia: string): string {
  return competencia.replace("-", "");
}

function cabecalhoModelo(especificacao: EspecificacaoModulo): string {
  return especificacao.colunas.map((coluna) => coluna.chave).join(",");
}

function montarResultado(
  id: string,
  resumo: ResumoPreValidacao,
  amostra: Record<string, string>[],
  colunasAmostra: EspecificacaoColuna[],
  naoConformidades: NaoConformidade[]
): ResultadoPreValidacao {
  const totalBloqueantes = naoConformidades.filter((item) => item.severidade === "bloqueante").length;
  const totalAvisos = naoConformidades.filter((item) => item.severidade === "aviso").length;
  return {
    id,
    resumo,
    amostra,
    colunasAmostra,
    naoConformidades,
    totalBloqueantes,
    totalAvisos,
    conforme: totalBloqueantes === 0,
  };
}

function validarNomeArquivo(
  nomeArquivo: string,
  especificacao: EspecificacaoModulo,
  contexto: ContextoPreValidacao,
  coletor: ReturnType<typeof criarColetor>
): { competenciaDetectada: string | null; instituicaoDetectada: string | null } {
  const base = obterNomeBase(nomeArquivo)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const correspondencia = PADRAO_NOME.exec(base);
  const esperada = competenciaCompacta(contexto.competencia);

  if (!correspondencia) {
    const numeros = /(\d{6})/.exec(base);
    coletor.registrar({
      codigo: "ING-E010",
      severidade: "bloqueante",
      mensagem: `Nome "${nomeArquivo}" fora do padrão exigido pela obrigação. O nome deve conter exatamente módulo, instituição e competência.`,
      ajuste: `Renomeie o arquivo para ${especificacao.prefixoNome}_${contexto.instituicaoSlug}_${esperada}.${obterExtensao(nomeArquivo) || "csv"} — sem sufixos, espaços ou segmentos extras.`,
    });
    return {
      competenciaDetectada: numeros ? `${numeros[1].slice(0, 4)}-${numeros[1].slice(4)}` : null,
      instituicaoDetectada: null,
    };
  }

  const [, moduloNome, instituicaoNome, competenciaNome] = correspondencia;

  if (moduloNome !== especificacao.prefixoNome) {
    coletor.registrar({
      codigo: "ING-E011",
      severidade: "bloqueante",
      campo: "nome do arquivo",
      mensagem: `O nome indica a obrigação "${moduloNome}", mas este período pertence a "${especificacao.prefixoNome}".`,
      ajuste: `Envie o arquivo na competência da obrigação correta ou renomeie para o prefixo ${especificacao.prefixoNome}_.`,
    });
  }

  if (instituicaoNome !== contexto.instituicaoSlug) {
    coletor.registrar({
      codigo: "ING-E013",
      severidade: "bloqueante",
      campo: "nome do arquivo",
      mensagem: `Instituição divergente: o arquivo referencia "${instituicaoNome}" e o período aberto é de ${contexto.instituicaoNome} ("${contexto.instituicaoSlug}").`,
      ajuste: `Confirme a instituição de origem e reenvie com ${especificacao.prefixoNome}_${contexto.instituicaoSlug}_${esperada}.`,
    });
  }

  if (competenciaNome !== esperada) {
    coletor.registrar({
      codigo: "ING-E012",
      severidade: "bloqueante",
      campo: "nome do arquivo",
      mensagem: `Competência divergente: o arquivo é de ${competenciaNome.slice(4)}/${competenciaNome.slice(0, 4)} e o período aberto é ${contexto.competencia.slice(5)}/${contexto.competencia.slice(0, 4)}.`,
      ajuste: "Abra a competência correspondente ao arquivo ou exporte novamente os dados da competência deste período.",
    });
  }

  return {
    competenciaDetectada: `${competenciaNome.slice(0, 4)}-${competenciaNome.slice(4)}`,
    instituicaoDetectada: instituicaoNome,
  };
}

function validarCampo(
  coluna: EspecificacaoColuna,
  valor: string,
  numeroLinha: number,
  competencia: string,
  coletor: ReturnType<typeof criarColetor>
): PendenciaCampo {
  const pendencia: PendenciaCampo = { bloqueante: false, aviso: false };

  const registrar = (registro: RegistroNaoConformidade) => {
    if (registro.severidade === "bloqueante") {
      pendencia.bloqueante = true;
    } else {
      pendencia.aviso = true;
    }
    coletor.registrar(registro);
  };

  if (coluna.tipo === "data" || coluna.tipo === "data_hora") {
    const aceitaHora = coluna.tipo === "data_hora";
    const valido = aceitaHora ? ehDataHoraIso(valor) || ehDataIso(valor) : ehDataIso(valor);

    if (!valido && ehDataBrasileira(valor)) {
      registrar({
        codigo: "ING-A007",
        severidade: "aviso",
        linha: numeroLinha,
        campo: coluna.chave,
        mensagem: `Data "${valor}" no formato DD/MM/AAAA em "${coluna.rotulo}".`,
        ajuste: "O valor será convertido para AAAA-MM-DD na ingestão. Prefira exportar já no padrão ISO 8601.",
      });
    } else if (!valido) {
      registrar({
        codigo: "ING-E021",
        severidade: "bloqueante",
        linha: numeroLinha,
        campo: coluna.chave,
        mensagem: `Data inválida "${valor}" em "${coluna.rotulo}".`,
        ajuste: aceitaHora
          ? `Use o formato ISO 8601 com hora, como ${coluna.exemplo}.`
          : `Use o formato AAAA-MM-DD, como ${coluna.exemplo}.`,
      });
      return pendencia;
    }

    const competenciaValor = competenciaDaData(valor);
    if (competenciaValor && competenciaValor !== competencia) {
      registrar({
        codigo: "ING-A006",
        severidade: "aviso",
        linha: numeroLinha,
        campo: coluna.chave,
        mensagem: `Data ${valor} está fora da competência ${competencia.slice(5)}/${competencia.slice(0, 4)}.`,
        ajuste: "Confirme se a linha pertence mesmo a esta competência; registros fora do período viram exceção na validação.",
      });
    }

    return pendencia;
  }

  if (coluna.tipo === "documento") {
    if (!ehDocumentoValido(valor)) {
      registrar({
        codigo: "ING-E022",
        severidade: "bloqueante",
        linha: numeroLinha,
        campo: coluna.chave,
        mensagem: `Documento inválido "${valor}" em "${coluna.rotulo}": não corresponde a um CPF (11 dígitos) nem a um CNPJ (14 dígitos).`,
        ajuste: `Informe o ${rotuloDocumento(valor)} completo, com ou sem máscara, como ${coluna.exemplo}.`,
      });
    }
    return pendencia;
  }

  if (coluna.tipo === "valor" || coluna.tipo === "quantidade") {
    const numero = converterNumero(valor);
    if (numero === null) {
      registrar({
        codigo: coluna.tipo === "valor" ? "ING-E023" : "ING-E024",
        severidade: "bloqueante",
        linha: numeroLinha,
        campo: coluna.chave,
        mensagem: `Valor não numérico "${valor}" em "${coluna.rotulo}".`,
        ajuste: `Use apenas dígitos e separador decimal, como ${coluna.exemplo}. Remova símbolos de moeda e texto.`,
      });
      return pendencia;
    }
    if (numero < 0) {
      registrar({
        codigo: coluna.tipo === "valor" ? "ING-E023" : "ING-E024",
        severidade: "bloqueante",
        linha: numeroLinha,
        campo: coluna.chave,
        mensagem: `Valor negativo "${valor}" em "${coluna.rotulo}".`,
        ajuste: "A obrigação não aceita valores negativos neste campo. Corrija a origem ou envie a linha de estorno correspondente.",
      });
      return pendencia;
    }
    if (numero === 0) {
      registrar({
        codigo: "ING-A004",
        severidade: "aviso",
        linha: numeroLinha,
        campo: coluna.chave,
        mensagem: `"${coluna.rotulo}" está zerado.`,
        ajuste: "Confirme se a linha deve mesmo ser reportada com valor zero.",
      });
    }
    return pendencia;
  }

  if (coluna.tipo === "inteiro") {
    if (!/^\d+$/.test(valor)) {
      registrar({
        codigo: "ING-E023",
        severidade: "bloqueante",
        linha: numeroLinha,
        campo: coluna.chave,
        mensagem: `"${coluna.rotulo}" deve conter apenas dígitos; encontrado "${valor}".`,
        ajuste: `Informe o código numérico completo, como ${coluna.exemplo}.`,
      });
    }
    return pendencia;
  }

  if (coluna.tipo === "booleano") {
    if (!ehBooleanoReconhecido(valor)) {
      registrar({
        codigo: "ING-E023",
        severidade: "bloqueante",
        linha: numeroLinha,
        campo: coluna.chave,
        mensagem: `"${coluna.rotulo}" aceita apenas Sim ou Não; encontrado "${valor}".`,
        ajuste: 'Substitua o conteúdo da coluna por "Sim" ou "Não".',
      });
    }
    return pendencia;
  }

  return pendencia;
}

export async function prevalidarArquivo(
  arquivo: File,
  contexto: ContextoPreValidacao,
  identificador: string
): Promise<ResultadoPreValidacao> {
  const especificacao = buscarEspecificacao(contexto.moduloId);
  const coletor = criarColetor();
  const extensao = obterExtensao(arquivo.name);

  const resumoBase: ResumoPreValidacao = {
    nomeArquivo: arquivo.name,
    tamanhoBytes: arquivo.size,
    extensao,
    moduloId: contexto.moduloId,
    competenciaEsperada: contexto.competencia,
    competenciaDetectada: null,
    instituicaoEsperada: contexto.instituicaoSlug,
    instituicaoDetectada: null,
    delimitador: null,
    rotuloDelimitador: "não identificado",
    colunasDetectadas: [],
    linhasLidas: 0,
    linhasValidas: 0,
    linhasComRessalva: 0,
    linhasComPendencia: 0,
    previsualizavel: false,
  };

  const nome = validarNomeArquivo(arquivo.name, especificacao, contexto, coletor);
  const resumoComNome: ResumoPreValidacao = {
    ...resumoBase,
    competenciaDetectada: nome.competenciaDetectada,
    instituicaoDetectada: nome.instituicaoDetectada,
  };

  if (!especificacao.extensoesAceitas.includes(extensao)) {
    coletor.registrar({
      codigo: "ING-E001",
      severidade: "bloqueante",
      mensagem: `Formato "${extensao || "sem extensão"}" não previsto no layout do ${especificacao.prefixoNome}.`,
      ajuste: `Esta obrigação aceita ${listarExtensoes(contexto.moduloId)}. Baixe o modelo (CSV) e reexporte os dados nesse formato.`,
    });
    return montarResultado(identificador, resumoComNome, [], especificacao.colunas, coletor.finalizar());
  }

  if (especificacao.extensoesNaoPrevisualizaveis.includes(extensao)) {
    coletor.registrar({
      codigo: "ING-E002",
      severidade: "bloqueante",
      mensagem: `Arquivos .${extensao} são binários e não podem ser pré-visualizados nem conferidos linha a linha antes do aceite.`,
      ajuste: "Exporte a planilha como CSV usando o modelo desta obrigação e reenvie para que o conteúdo possa ser conferido.",
    });
    return montarResultado(identificador, resumoComNome, [], especificacao.colunas, coletor.finalizar());
  }

  if (arquivo.size === 0) {
    coletor.registrar({
      codigo: "ING-E004",
      severidade: "bloqueante",
      mensagem: "Arquivo vazio (0 byte).",
      ajuste: "Confirme a exportação na origem e reenvie o arquivo com o cabeçalho e ao menos uma linha de dados.",
    });
    return montarResultado(identificador, resumoComNome, [], especificacao.colunas, coletor.finalizar());
  }

  if (arquivo.size < especificacao.tamanhoMinimoBytes) {
    coletor.registrar({
      codigo: "ING-E005",
      severidade: "bloqueante",
      mensagem: `Arquivo com ${arquivo.size} bytes, abaixo do mínimo de ${especificacao.tamanhoMinimoBytes} bytes esperado para o layout desta obrigação.`,
      ajuste: "Um arquivo válido contém, no mínimo, a linha de cabeçalho completa e uma linha de dados. Reexporte a partir do modelo.",
    });
  }

  let conteudo = "";
  try {
    conteudo = removerMarcaDeOrdem(await arquivo.text());
  } catch {
    coletor.registrar({
      codigo: "ING-E009",
      severidade: "bloqueante",
      mensagem: "Não foi possível ler o conteúdo do arquivo neste navegador.",
      ajuste: "Verifique se o arquivo não está corrompido ou protegido e tente enviar novamente.",
    });
    return montarResultado(identificador, resumoComNome, [], especificacao.colunas, coletor.finalizar());
  }

  if (conteudo.trim().length === 0) {
    coletor.registrar({
      codigo: "ING-E004",
      severidade: "bloqueante",
      mensagem: "Arquivo sem conteúdo legível.",
      ajuste: "Confirme a exportação na origem e reenvie o arquivo com o cabeçalho e ao menos uma linha de dados.",
    });
    return montarResultado(identificador, resumoComNome, [], especificacao.colunas, coletor.finalizar());
  }

  if (possuiCaractereInvalido(conteudo)) {
    coletor.registrar({
      codigo: "ING-A005",
      severidade: "aviso",
      mensagem: "O arquivo contém caracteres que não puderam ser decodificados.",
      ajuste: "Reexporte o arquivo em UTF-8 para preservar acentuação e caracteres especiais.",
    });
  }

  const linhas = separarLinhas(conteudo);
  const linhaCabecalho = linhas.find((linha) => linha.texto.trim().length > 0);

  if (!linhaCabecalho) {
    coletor.registrar({
      codigo: "ING-E004",
      severidade: "bloqueante",
      mensagem: "Arquivo sem linhas preenchidas.",
      ajuste: "Reexporte a partir do modelo (CSV) desta obrigação.",
    });
    return montarResultado(identificador, resumoComNome, [], especificacao.colunas, coletor.finalizar());
  }

  const delimitadorDetectado = detectarDelimitador(linhaCabecalho.texto);
  const delimitadorAceito =
    delimitadorDetectado !== null && especificacao.delimitadoresAceitos.includes(delimitadorDetectado);

  if (!delimitadorAceito) {
    const aceitos = especificacao.delimitadoresAceitos
      .map((item) => ROTULO_DELIMITADOR[item] ?? item)
      .join(" ou ");
    coletor.registrar({
      codigo: "ING-E006",
      severidade: "bloqueante",
      linha: linhaCabecalho.numero,
      mensagem: delimitadorDetectado
        ? `Delimitador ${ROTULO_DELIMITADOR[delimitadorDetectado] ?? delimitadorDetectado} não é aceito por esta obrigação.`
        : "Nenhum delimitador de colunas foi identificado na primeira linha — o arquivo não está em formato tabular.",
      ajuste: `Reexporte usando ${aceitos} como separador de colunas, seguindo o modelo (CSV).`,
    });
  }

  const delimitador = delimitadorDetectado ?? especificacao.delimitadoresAceitos[0];
  const cabecalho = dividirLinha(linhaCabecalho.texto, delimitador).map(normalizarChave);
  const chavesEspecificacao = new Set(especificacao.colunas.map((coluna) => coluna.chave));
  const reconhecidas = cabecalho.filter((chave) => chavesEspecificacao.has(chave));

  const resumoComEstrutura: ResumoPreValidacao = {
    ...resumoComNome,
    delimitador: delimitadorAceito ? delimitador : null,
    rotuloDelimitador: delimitadorAceito ? (ROTULO_DELIMITADOR[delimitador] ?? delimitador) : "não identificado",
    colunasDetectadas: delimitadorAceito ? cabecalho : [],
    previsualizavel: delimitadorAceito,
  };

  if (reconhecidas.length === 0) {
    const obrigatorias = especificacao.colunas
      .filter((coluna) => coluna.obrigatoria)
      .map((coluna) => coluna.chave)
      .join(", ");
    coletor.registrar({
      codigo: "ING-E003",
      severidade: "bloqueante",
      linha: linhaCabecalho.numero,
      mensagem: `Cabeçalho ausente ou não reconhecido: nenhuma das colunas do layout ${especificacao.prefixoNome} foi encontrada na primeira linha.`,
      ajuste: `A primeira linha precisa ser o cabeçalho com as colunas obrigatórias (${obrigatorias}). Baixe o modelo (CSV) e reexporte a partir dele: ${cabecalhoModelo(especificacao)}.`,
    });
    return montarResultado(identificador, resumoComEstrutura, [], especificacao.colunas, coletor.finalizar());
  }

  if (!delimitadorAceito) {
    return montarResultado(identificador, resumoComEstrutura, [], especificacao.colunas, coletor.finalizar());
  }

  for (const coluna of especificacao.colunas) {
    if (cabecalho.includes(coluna.chave)) continue;
    if (coluna.obrigatoria) {
      coletor.registrar({
        codigo: "ING-E003",
        severidade: "bloqueante",
        linha: linhaCabecalho.numero,
        campo: coluna.chave,
        mensagem: `Coluna obrigatória "${coluna.chave}" (${coluna.rotulo}) ausente no cabeçalho.`,
        ajuste: `Inclua a coluna "${coluna.chave}" com valores no padrão ${coluna.exemplo} e reenvie.`,
      });
    } else {
      coletor.registrar({
        codigo: "ING-A001",
        severidade: "aviso",
        linha: linhaCabecalho.numero,
        campo: coluna.chave,
        mensagem: `Coluna opcional "${coluna.chave}" (${coluna.rotulo}) não foi enviada.`,
        ajuste: "O campo será reportado como não informado. Envie a coluna se a informação existir na origem.",
      });
    }
  }

  for (const chave of cabecalho) {
    if (chavesEspecificacao.has(chave)) continue;
    coletor.registrar({
      codigo: "ING-A002",
      severidade: "aviso",
      linha: linhaCabecalho.numero,
      campo: chave || "(coluna sem nome)",
      mensagem: `Coluna "${chave || "(sem nome)"}" não faz parte do layout e será ignorada.`,
      ajuste: "Remova a coluna extra para evitar divergência entre o arquivo enviado e o dado reportado.",
    });
  }

  const ultimaLinha = linhas.at(-1)?.numero ?? 0;
  const linhasDados = linhas.filter((linha) => linha.numero > linhaCabecalho.numero);
  const amostra: Record<string, string>[] = [];
  let linhasLidas = 0;
  let linhasValidas = 0;
  let linhasComRessalva = 0;
  let linhasAnalisadas = 0;

  for (const linha of linhasDados) {
    if (linha.texto.trim().length === 0) {
      if (linha.numero !== ultimaLinha) {
        coletor.registrar({
          codigo: "ING-A003",
          severidade: "aviso",
          linha: linha.numero,
          mensagem: "Linha em branco ignorada.",
          ajuste: "Remova as linhas vazias do arquivo antes de reenviar.",
        });
      }
      continue;
    }

    linhasLidas += 1;
    linhasAnalisadas += 1;
    if (linhasAnalisadas > LIMITE_LINHAS_ANALISADAS) {
      linhasValidas += 1;
      continue;
    }

    const campos = dividirLinha(linha.texto, delimitador);

    if (campos.length !== cabecalho.length) {
      coletor.registrar({
        codigo: "ING-E008",
        severidade: "bloqueante",
        linha: linha.numero,
        mensagem: `Linha com ${campos.length} campo(s), mas o cabeçalho define ${cabecalho.length}.`,
        ajuste: `Verifique delimitadores dentro do texto — campos com ${ROTULO_DELIMITADOR[delimitador] ?? delimitador} precisam estar entre aspas duplas.`,
      });
      continue;
    }

    const valores: Record<string, string> = {};
    cabecalho.forEach((chave, indice) => {
      valores[chave] = campos[indice] ?? "";
    });

    if (amostra.length < LIMITE_AMOSTRA) {
      amostra.push(valores);
    }

    let linhaComBloqueio = false;
    let linhaComRessalva = false;

    for (const coluna of especificacao.colunas) {
      if (!cabecalho.includes(coluna.chave)) continue;
      const valor = (valores[coluna.chave] ?? "").trim();

      if (valor.length === 0) {
        if (coluna.obrigatoria) {
          linhaComBloqueio = true;
          coletor.registrar({
            codigo: "ING-E020",
            severidade: "bloqueante",
            linha: linha.numero,
            campo: coluna.chave,
            mensagem: `Campo obrigatório "${coluna.rotulo}" está vazio.`,
            ajuste: `Preencha "${coluna.chave}" seguindo o exemplo ${coluna.exemplo}.`,
          });
        }
        continue;
      }

      const pendencia = validarCampo(coluna, valor, linha.numero, contexto.competencia, coletor);
      if (pendencia.bloqueante) {
        linhaComBloqueio = true;
      }
      if (pendencia.aviso) {
        linhaComRessalva = true;
      }
    }

    if (!linhaComBloqueio) {
      linhasValidas += 1;
      if (linhaComRessalva) {
        linhasComRessalva += 1;
      }
    }
  }

  if (linhasLidas < especificacao.linhasMinimas) {
    coletor.registrar({
      codigo: "ING-E007",
      severidade: "bloqueante",
      mensagem: "O arquivo tem cabeçalho, mas nenhuma linha de dados.",
      ajuste: "Reexporte a competência com os registros preenchidos abaixo do cabeçalho.",
    });
  }

  const resumoFinal: ResumoPreValidacao = {
    ...resumoComEstrutura,
    linhasLidas,
    linhasValidas,
    linhasComRessalva,
    linhasComPendencia: Math.max(0, linhasLidas - linhasValidas),
  };

  return montarResultado(identificador, resumoFinal, amostra, especificacao.colunas, coletor.finalizar());
}
