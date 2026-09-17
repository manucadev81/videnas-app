import type { InsumoDefinicao, ModuloId } from "@/lib/tipos";

export const CATALOGO_INSUMOS: Record<ModuloId, InsumoDefinicao[]> = {
  acam212: [
    {
      id: "acam212-cadastro-clientes",
      moduloId: "acam212",
      rotulo: "Cadastro de clientes com KYC resolvido",
      descricao:
        "Base cadastral dos clientes que operaram câmbio com ativo virtual na competência, já com a diligência de conhecimento do cliente concluída.",
      tipo: "arquivo",
      obrigatorio: true,
      comoFornecer:
        "Exporte a base cadastral em CSV com uma linha por cliente (documento, nome, tipo PF/PJ, país de residência e situação do KYC) e envie no padrão acam212_clientes_{instituicao}_{AAAAMM}.csv, codificação UTF-8 e separador vírgula ou ponto e vírgula.",
      baseNormativa: "Circular BCB nº 3.978/2020, art. 2º a 4º (conheça seu cliente)",
      camposFormulario: null,
    },
    {
      id: "acam212-operacoes-periodo",
      moduloId: "acam212",
      rotulo: "Operações de câmbio com ativo virtual da competência",
      descricao:
        "Uma linha por operação de câmbio com ativo virtual liquidada na competência, com número de controle, data/hora, contraparte, ativo, quantidade, valor em BRL e taxa aplicada.",
      tipo: "arquivo",
      obrigatorio: true,
      comoFornecer:
        "Use o modelo CSV da obrigação (acam212_{instituicao}_{AAAAMM}.csv). As colunas obrigatórias são as do layout ACAM212 mostrado na tela de envio: numero_controle, data_hora, tipo_operacao, cliente_documento, ativo_virtual, quantidade, valor_brl, valor_moeda_estrangeira e taxa_cambio.",
      baseNormativa: "Resolução BCB nº 277/2022 e schema oficial ACAM212 2.1",
      camposFormulario: null,
    },
    {
      id: "acam212-saldos-encerramento",
      moduloId: "acam212",
      rotulo: "Saldos de encerramento da competência",
      descricao:
        "Posição de fechamento por moeda e por ativo virtual no último dia útil da competência, usada para conciliar o somatório das operações declaradas.",
      tipo: "arquivo",
      obrigatorio: true,
      comoFornecer:
        "Envie o relatório de fechamento em CSV com uma linha por moeda/ativo (codigo, descricao, saldo_inicial, entradas, saidas, saldo_final) no padrão acam212_saldos_{instituicao}_{AAAAMM}.csv.",
      baseNormativa: "Resolução BCB nº 277/2022, art. 14 (conciliação de posições)",
      camposFormulario: null,
    },
    {
      id: "acam212-parametros-competencia",
      moduloId: "acam212",
      rotulo: "Parâmetros da competência",
      descricao:
        "Declaração do responsável pelos dados da competência e das condições de fechamento contábil que a Videnas precisa registrar junto do arquivo gerado.",
      tipo: "formulario",
      obrigatorio: true,
      comoFornecer:
        "Preencha os quatro campos abaixo diretamente na plataforma. Eles ficam lacrados junto com os arquivos e constam do comprovante de envio.",
      baseNormativa: "Circular BCB nº 3.978/2020, art. 47 (responsável pelas informações)",
      camposFormulario: [
        {
          chave: "responsavel_declaracao",
          rotulo: "Responsável pela declaração",
          tipo: "texto",
          obrigatorio: true,
          placeholder: "Nome completo de quem responde pelos dados",
          ajuda: "Pessoa da instituição que responde pela veracidade dos dados enviados nesta competência.",
        },
        {
          chave: "data_fechamento_contabil",
          rotulo: "Data do fechamento contábil",
          tipo: "data",
          obrigatorio: true,
          ajuda: "Data em que a contabilidade da competência foi encerrada e os saldos deixaram de sofrer alteração.",
        },
        {
          chave: "houve_operacao_anulada",
          rotulo: "Houve operação anulada na competência?",
          tipo: "booleano",
          obrigatorio: true,
          ajuda: "Marque sim se alguma operação declarada foi cancelada ou estornada. O arquivo precisa referenciar a operação original.",
        },
        {
          chave: "observacao",
          rotulo: "Observação",
          tipo: "texto",
          obrigatorio: false,
          placeholder: "Contexto adicional que a Videnas deva considerar",
          ajuda: "Campo livre para registrar qualquer particularidade da competência. Opcional.",
        },
      ],
    },
  ],
  cadoc5711: [
    {
      id: "cadoc5711-datas-base",
      moduloId: "cadoc5711",
      rotulo: "Datas-base da competência",
      descricao:
        "Delimitação do intervalo diário coberto pela posição de custódia, usada para conferir se nenhuma data-base ficou faltando no arquivo.",
      tipo: "formulario",
      obrigatorio: true,
      comoFornecer:
        "Informe a primeira e a última data-base efetivamente apuradas e a quantidade de dias úteis da competência. A Videnas cruza esses números com as datas presentes no arquivo de posições.",
      baseNormativa: "Carta Circular BCB nº 4.026/2022 — leiaute Cadoc 5711",
      camposFormulario: [
        {
          chave: "primeira_data_base",
          rotulo: "Primeira data-base",
          tipo: "data",
          obrigatorio: true,
          ajuda: "Primeiro dia da competência com posição de custódia apurada.",
        },
        {
          chave: "ultima_data_base",
          rotulo: "Última data-base",
          tipo: "data",
          obrigatorio: true,
          ajuda: "Último dia da competência com posição de custódia apurada.",
        },
        {
          chave: "dias_uteis_competencia",
          rotulo: "Dias úteis da competência",
          tipo: "numero",
          obrigatorio: true,
          placeholder: "21",
          ajuda: "Quantidade de dias úteis apurados. Serve para detectar datas-base ausentes no arquivo diário.",
        },
      ],
    },
    {
      id: "cadoc5711-posicoes-clientes",
      moduloId: "cadoc5711",
      rotulo: "Posição de custódia diária por cliente",
      descricao:
        "Uma linha por cliente, por ativo e por data-base, com quantidade custodiada, cotação do dia e valor equivalente em reais.",
      tipo: "arquivo",
      obrigatorio: true,
      comoFornecer:
        "Exporte o relatório diário consolidado em CSV no padrão cadoc5711_{instituicao}_{AAAAMM}.csv, com as colunas data_base, cliente_documento, ativo_virtual, quantidade e valor_brl. Todas as datas-base da competência precisam estar presentes.",
      baseNormativa: "Resolução BCB nº 314/2023 e schema CADOC5711 1.4",
      camposFormulario: null,
    },
    {
      id: "cadoc5711-conciliacao-custodia",
      moduloId: "cadoc5711",
      rotulo: "Conciliação de custódia própria e de terceiros",
      descricao:
        "Repartição entre custódia própria e custódia delegada a terceiros, com confirmação de que a conciliação foi conferida pela instituição.",
      tipo: "formulario",
      obrigatorio: true,
      comoFornecer:
        "Informe o percentual sob custódia própria e, havendo custódia delegada, o nome do custodiante. A confirmação de conciliação é obrigatória e fica registrada com seu nome no lacre.",
      baseNormativa: "Resolução BCB nº 314/2023, art. 9º (segregação patrimonial)",
      camposFormulario: [
        {
          chave: "custodia_propria_percentual",
          rotulo: "Percentual sob custódia própria",
          tipo: "numero",
          obrigatorio: true,
          placeholder: "87,5",
          ajuda: "Percentual do valor total custodiado que permanece sob controle direto da instituição.",
        },
        {
          chave: "custodiante_terceiro",
          rotulo: "Custodiante terceiro",
          tipo: "texto",
          obrigatorio: false,
          placeholder: "Razão social do custodiante contratado",
          ajuda: "Preencha somente se parte da custódia estiver delegada a um terceiro. Opcional.",
        },
        {
          chave: "conciliacao_conferida",
          rotulo: "Conciliação conferida?",
          tipo: "booleano",
          obrigatorio: true,
          ajuda: "Confirme que os saldos do arquivo batem com os controles internos da instituição na data-base final.",
        },
      ],
    },
  ],
  cadoc5710: [
    {
      id: "cadoc5710-carteiras",
      moduloId: "cadoc5710",
      rotulo: "Inventário de carteiras e endereços por rede",
      descricao:
        "Relação das carteiras sob controle da instituição, com apelido interno, endereço público, rede blockchain e titularidade.",
      tipo: "arquivo",
      obrigatorio: true,
      comoFornecer:
        "Envie o inventário em CSV no padrão cadoc5710_carteiras_{instituicao}_{AAAAMM}.csv, com as colunas carteira_apelido, carteira_endereco, rede e titularidade (propria, de_cliente ou terceiro).",
      baseNormativa: "Resolução BCB nº 314/2023, art. 11 (controle de endereços)",
      camposFormulario: null,
    },
    {
      id: "cadoc5710-ativos-posicoes",
      moduloId: "cadoc5710",
      rotulo: "Posição consolidada por ativo na data-base mensal",
      descricao:
        "Saldo de cada ativo virtual por carteira na data-base do mês, com cotação de referência e valor em reais.",
      tipo: "arquivo",
      obrigatorio: true,
      comoFornecer:
        "Use o modelo CSV cadoc5710_{instituicao}_{AAAAMM}.csv, com as colunas data_base, carteira_endereco, rede, ativo_virtual, quantidade, valor_brl e, quando houver, quantidade_staking e recompensa_acumulada.",
      baseNormativa: "Carta Circular BCB nº 4.027/2022 e schema CADOC5710 1.4",
      camposFormulario: null,
    },
    {
      id: "cadoc5710-staking",
      moduloId: "cadoc5710",
      rotulo: "Declaração de staking",
      descricao:
        "Informação sobre saldos bloqueados em staking, protocolo utilizado e prazo de desbloqueio, que precisam ser destacados no arquivo mensal.",
      tipo: "formulario",
      obrigatorio: true,
      comoFornecer:
        "Responda se houve staking na competência. Em caso afirmativo, informe o protocolo principal e o prazo de desbloqueio em dias; esses dois campos ficam opcionais quando não há staking.",
      baseNormativa: "Resolução BCB nº 314/2023, art. 12 (ativos com restrição de liquidez)",
      camposFormulario: [
        {
          chave: "possui_staking",
          rotulo: "Houve saldo em staking na competência?",
          tipo: "booleano",
          obrigatorio: true,
          ajuda: "Marque sim se qualquer ativo ficou bloqueado em protocolo de staking na data-base.",
        },
        {
          chave: "protocolo_principal",
          rotulo: "Protocolo principal",
          tipo: "texto",
          obrigatorio: false,
          placeholder: "Lido Finance, Rocket Pool, staking nativo…",
          ajuda: "Protocolo responsável pela maior parte do saldo bloqueado. Opcional quando não há staking.",
        },
        {
          chave: "prazo_desbloqueio_dias",
          rotulo: "Prazo de desbloqueio (dias)",
          tipo: "numero",
          obrigatorio: false,
          placeholder: "7",
          ajuda: "Prazo médio, em dias, para resgatar o saldo bloqueado. Opcional quando não há staking.",
        },
      ],
    },
    {
      id: "cadoc5710-data-base-mensal",
      moduloId: "cadoc5710",
      rotulo: "Data-base e fonte de cotação",
      descricao:
        "Data-base mensal adotada para a posição e a fonte de cotação usada para converter os ativos em reais.",
      tipo: "formulario",
      obrigatorio: true,
      comoFornecer:
        "Informe a data-base efetivamente apurada e selecione a fonte de cotação utilizada. A fonte precisa ser a mesma do arquivo de posições.",
      baseNormativa: "Carta Circular BCB nº 4.027/2022, item 5 (critério de conversão)",
      camposFormulario: [
        {
          chave: "data_base",
          rotulo: "Data-base da posição",
          tipo: "data",
          obrigatorio: true,
          ajuda: "Último dia da competência em que a posição foi apurada, normalmente o último dia do mês.",
        },
        {
          chave: "fonte_cotacao",
          rotulo: "Fonte de cotação",
          tipo: "selecao",
          obrigatorio: true,
          ajuda: "Provedor de preço usado para converter cada ativo virtual em reais na data-base.",
          opcoes: [
            { valor: "ptax_bcb", rotulo: "PTAX do Banco Central (conversão via USD)" },
            { valor: "media_exchanges_nacionais", rotulo: "Média ponderada de exchanges nacionais" },
            { valor: "provedor_contratado", rotulo: "Provedor de preços contratado" },
            { valor: "cotacao_interna_auditada", rotulo: "Cotação interna auditada" },
          ],
        },
      ],
    },
  ],
  fiscal: [
    {
      id: "fiscal-dps-emitidas",
      moduloId: "fiscal",
      rotulo: "Serviços prestados na competência",
      descricao:
        "Uma linha por serviço prestado no mês, com tomador, município de prestação, código do serviço, valor e alíquota sugerida.",
      tipo: "arquivo",
      obrigatorio: true,
      comoFornecer:
        "Exporte o faturamento de serviços em CSV no padrão fiscal_{instituicao}_{AAAAMM}.csv, com as colunas tomador, tomador_documento, municipio, codigo_ibge, codigo_servico, descricao, valor_servico, aliquota_iss e retencao.",
      baseNormativa: "Lei Complementar nº 116/2003 e leiaute nacional da NFS-e (DPS 1.0)",
      camposFormulario: null,
    },
    {
      id: "fiscal-parametros-tributarios",
      moduloId: "fiscal",
      rotulo: "Parâmetros tributários da instituição",
      descricao:
        "Regime tributário, inscrição municipal e padrões de alíquota e retenção aplicados quando o arquivo de serviços não traz o valor explícito.",
      tipo: "formulario",
      obrigatorio: true,
      comoFornecer:
        "Preencha os quatro campos abaixo. Eles são usados como padrão na estruturação da DPS e ficam disponíveis para a conferência do contador.",
      baseNormativa: "Lei Complementar nº 116/2003, art. 6º e legislação municipal do ISS",
      camposFormulario: [
        {
          chave: "regime_tributario",
          rotulo: "Regime tributário",
          tipo: "selecao",
          obrigatorio: true,
          ajuda: "Regime vigente na competência. Define como a alíquota efetiva do ISS é apurada.",
          opcoes: [
            { valor: "simples_nacional", rotulo: "Simples Nacional" },
            { valor: "lucro_presumido", rotulo: "Lucro Presumido" },
            { valor: "lucro_real", rotulo: "Lucro Real" },
          ],
        },
        {
          chave: "inscricao_municipal",
          rotulo: "Inscrição municipal",
          tipo: "texto",
          obrigatorio: true,
          placeholder: "1.234.567-8",
          ajuda: "Inscrição da instituição no município de prestação do serviço, exigida na emissão da NFS-e.",
        },
        {
          chave: "aliquota_iss_padrao",
          rotulo: "Alíquota de ISS padrão (%)",
          tipo: "numero",
          obrigatorio: true,
          placeholder: "2,00",
          ajuda: "Alíquota aplicada quando o arquivo de serviços não informa um percentual específico.",
        },
        {
          chave: "retencao_na_fonte_padrao",
          rotulo: "Retenção na fonte como padrão?",
          tipo: "booleano",
          obrigatorio: true,
          ajuda: "Marque sim se, por padrão, o ISS é retido pelo tomador. O contador ainda pode ajustar caso a caso.",
        },
      ],
    },
  ],
};

export function buscarInsumos(moduloId: ModuloId): InsumoDefinicao[] {
  return CATALOGO_INSUMOS[moduloId] ?? [];
}

export function buscarInsumo(insumoId: string): InsumoDefinicao | undefined {
  for (const lista of Object.values(CATALOGO_INSUMOS)) {
    const encontrado = lista.find((insumo) => insumo.id === insumoId);
    if (encontrado) {
      return encontrado;
    }
  }
  return undefined;
}

export function insumosObrigatorios(moduloId: ModuloId): InsumoDefinicao[] {
  return buscarInsumos(moduloId).filter((insumo) => insumo.obrigatorio);
}
