"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { camposFaltantesDoFormulario } from "@/lib/fornecimento";
import type { CampoFormularioInsumo, FornecimentoInsumo, InsumoDefinicao } from "@/lib/tipos";
import { idAncoraInsumo } from "@/components/fornecimento/constantes";

export interface FormularioInsumoProps {
  definicao: InsumoDefinicao;
  fornecimento: FornecimentoInsumo | undefined;
  desabilitado: boolean;
  aoEnviar: (valores: Record<string, string>) => Promise<boolean>;
}

const SELETOR_FOCAVEL = "input, select, textarea, button, [tabindex]";

function focarCampo(idElemento: string) {
  const alvo = document.getElementById(idElemento);
  if (!alvo) {
    return;
  }
  const focavel = alvo.matches(SELETOR_FOCAVEL)
    ? alvo
    : alvo.querySelector<HTMLElement>(SELETOR_FOCAVEL);
  focavel?.focus();
  alvo.scrollIntoView({ block: "center" });
}

function valoresIniciais(
  definicao: InsumoDefinicao,
  fornecimento: FornecimentoInsumo | undefined
): Record<string, string> {
  const base: Record<string, string> = {};
  for (const campo of definicao.camposFormulario ?? []) {
    base[campo.chave] = fornecimento?.valoresFormulario?.[campo.chave] ?? "";
  }
  return base;
}

export function FormularioInsumo({
  definicao,
  fornecimento,
  desabilitado,
  aoEnviar,
}: FormularioInsumoProps) {
  const [valores, setValores] = useState<Record<string, string>>(() =>
    valoresIniciais(definicao, fornecimento)
  );
  const [faltantes, setFaltantes] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const campos = definicao.camposFormulario ?? [];
  const idFormulario = `formulario-${definicao.id}`;

  function definirValor(chave: string, valor: string) {
    setValores((atual) => ({ ...atual, [chave]: valor }));
    setFaltantes((atual) => (valor.trim().length > 0 ? atual.filter((item) => item !== chave) : atual));
  }

  async function aoSubmeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (desabilitado || enviando) {
      return;
    }

    const pendentes = camposFaltantesDoFormulario(definicao, valores);
    setFaltantes(pendentes);

    if (pendentes.length > 0) {
      focarCampo(`${idFormulario}-${pendentes[0]}`);
      return;
    }

    setEnviando(true);
    const concluido = await aoEnviar(valores);
    setEnviando(false);

    if (!concluido) {
      return;
    }
    setFaltantes([]);
  }

  function renderizarCampo(campo: CampoFormularioInsumo) {
    const idCampo = `${idFormulario}-${campo.chave}`;
    const idAjuda = `${idCampo}-ajuda`;
    const idErro = `${idCampo}-erro`;
    const invalido = faltantes.includes(campo.chave);
    const descritores = invalido ? `${idAjuda} ${idErro}` : idAjuda;
    const valor = valores[campo.chave] ?? "";

    const rotulo = (
      <>
        {campo.rotulo}
        {campo.obrigatorio ? (
          <span className="text-status-error-text" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="text-xs font-normal text-neutral-400">(opcional)</span>
        )}
      </>
    );

    const mensagemErro = invalido ? (
      <p id={idErro} className="text-xs font-medium text-status-error-text">
        Preencha {campo.rotulo.toLowerCase()} para concluir o envio.
      </p>
    ) : null;

    const ajuda = (
      <p id={idAjuda} className="text-xs leading-relaxed text-neutral-500">
        {campo.ajuda}
      </p>
    );

    if (campo.tipo === "booleano") {
      const idRotulo = `${idCampo}-rotulo`;
      return (
        <div key={campo.chave} className="space-y-2">
          <span id={idRotulo} className="flex items-center gap-2 text-sm leading-none font-medium">
            {rotulo}
          </span>
          <RadioGroup
            id={idCampo}
            value={valor === "" ? null : valor}
            onValueChange={(escolha) => definirValor(campo.chave, String(escolha ?? ""))}
            disabled={desabilitado || enviando}
            aria-labelledby={idRotulo}
            aria-describedby={descritores}
            aria-invalid={invalido}
            className="flex flex-wrap gap-6"
          >
            <Label htmlFor={`${idCampo}-sim`} className="font-normal">
              <RadioGroupItem id={`${idCampo}-sim`} value="sim" />
              Sim
            </Label>
            <Label htmlFor={`${idCampo}-nao`} className="font-normal">
              <RadioGroupItem id={`${idCampo}-nao`} value="nao" />
              Não
            </Label>
          </RadioGroup>
          {ajuda}
          {mensagemErro}
        </div>
      );
    }

    if (campo.tipo === "selecao") {
      return (
        <div key={campo.chave} className="space-y-2">
          <Label htmlFor={idCampo}>{rotulo}</Label>
          <Select
            value={valor === "" ? null : valor}
            onValueChange={(escolha) => definirValor(campo.chave, String(escolha ?? ""))}
            disabled={desabilitado || enviando}
          >
            <SelectTrigger
              id={idCampo}
              aria-describedby={descritores}
              aria-invalid={invalido}
              className="h-9 w-full"
            >
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {(campo.opcoes ?? []).map((opcao) => (
                <SelectItem key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {ajuda}
          {mensagemErro}
        </div>
      );
    }

    const tipoEntrada = campo.tipo === "data" ? "date" : "text";

    return (
      <div key={campo.chave} className="space-y-2">
        <Label htmlFor={idCampo}>{rotulo}</Label>
        <Input
          id={idCampo}
          type={tipoEntrada}
          inputMode={campo.tipo === "numero" ? "decimal" : undefined}
          value={valor}
          placeholder={campo.placeholder}
          disabled={desabilitado || enviando}
          aria-describedby={descritores}
          aria-invalid={invalido}
          className="h-9"
          onChange={(evento) => definirValor(campo.chave, evento.target.value)}
        />
        {ajuda}
        {mensagemErro}
      </div>
    );
  }

  return (
    <form
      id={idFormulario}
      noValidate
      onSubmit={aoSubmeter}
      aria-labelledby={`${idAncoraInsumo(definicao.id)}-titulo`}
      className="space-y-4"
    >
      <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700">
        Preencha na plataforma
        <BadgeAjuda chave="fornecimento.formulario" tamanho="xs" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{campos.map(renderizarCampo)}</div>

      {faltantes.length > 0 ? (
        <p role="alert" className="text-sm font-medium text-status-error-text">
          {faltantes.length === 1
            ? "Há 1 campo obrigatório sem preenchimento."
            : `Há ${faltantes.length} campos obrigatórios sem preenchimento.`}
        </p>
      ) : null}

      <Button type="submit" disabled={desabilitado || enviando} className="min-h-10">
        {enviando ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {enviando ? "Lacrando respostas…" : "Enviar e lacrar respostas"}
      </Button>
    </form>
  );
}
