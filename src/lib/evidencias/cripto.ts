export const AVISO_SIMULACAO_ENVELOPE =
  "Demonstração: nesta versão a chave AES-GCM que cifra o envelope é derivada localmente no seu navegador a partir do identificador da instituição, e nada sai do dispositivo. Em produção, essa chave é gerada e custodiada em KMS/HSM, com rotação, segregação por tenant e registro de uso — o conteúdo lacrado nunca fica legível para quem não tem a chave.";

export const IDENTIFICADOR_CHAVE_SIMULADA_PREFIXO = "kms-simulado";

export const ALGORITMO_HASH = "SHA-256";

const MATERIAL_DERIVACAO_DEMONSTRACAO = "videnas-demonstracao-envelope-v1";
const ITERACOES_DERIVACAO = 120_000;
const TAMANHO_VETOR_INICIALIZACAO = 12;

const codificador = new TextEncoder();
const decodificador = new TextDecoder();

export function criptografiaDisponivel(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.subtle !== "undefined"
  );
}

function exigirCripto(): Crypto {
  if (!criptografiaDisponivel()) {
    throw new Error(
      "Web Crypto indisponível neste ambiente. O lacre criptográfico só pode ser gerado no navegador."
    );
  }
  return globalThis.crypto;
}

export function paraHex(bytes: ArrayBuffer | Uint8Array): string {
  const visao = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let saida = "";
  for (const octeto of visao) {
    saida += octeto.toString(16).padStart(2, "0");
  }
  return saida;
}

export function paraBase64(bytes: ArrayBuffer | Uint8Array): string {
  const visao = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binario = "";
  for (const octeto of visao) {
    binario += String.fromCharCode(octeto);
  }
  if (typeof btoa === "function") {
    return btoa(binario);
  }
  return Buffer.from(visao).toString("base64");
}

export function deBase64(texto: string): Uint8Array {
  if (typeof atob === "function") {
    const binario = atob(texto);
    const bytes = new Uint8Array(binario.length);
    for (let indice = 0; indice < binario.length; indice += 1) {
      bytes[indice] = binario.charCodeAt(indice);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(texto, "base64"));
}

function paraBytes(dados: ArrayBuffer | Uint8Array | string): Uint8Array {
  if (typeof dados === "string") {
    return codificador.encode(dados);
  }
  if (dados instanceof Uint8Array) {
    return dados;
  }
  return new Uint8Array(dados);
}

function paraBufferIsolado(bytes: Uint8Array): ArrayBuffer {
  const copia = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copia).set(bytes);
  return copia;
}

export async function calcularHashSha256(
  dados: ArrayBuffer | Uint8Array | string
): Promise<string> {
  const cripto = exigirCripto();
  const bytes = paraBytes(dados);
  const digest = await cripto.subtle.digest(ALGORITMO_HASH, paraBufferIsolado(bytes));
  return paraHex(digest);
}

export function identificadorChaveDoTenant(instituicaoId: string): string {
  return `${IDENTIFICADOR_CHAVE_SIMULADA_PREFIXO}:${instituicaoId}:v1`;
}

function salParaTenant(instituicaoId: string): Uint8Array {
  return codificador.encode(`${MATERIAL_DERIVACAO_DEMONSTRACAO}:sal:${instituicaoId}`);
}

export async function derivarChaveSimuladaDoTenant(instituicaoId: string): Promise<CryptoKey> {
  const cripto = exigirCripto();

  const material = await cripto.subtle.importKey(
    "raw",
    paraBufferIsolado(codificador.encode(`${MATERIAL_DERIVACAO_DEMONSTRACAO}:${instituicaoId}`)),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return cripto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: paraBufferIsolado(salParaTenant(instituicaoId)),
      iterations: ITERACOES_DERIVACAO,
      hash: ALGORITMO_HASH,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface EnvelopeSelado {
  envelopeCifrado: string;
  vetorInicializacao: string;
  identificadorChave: string;
}

export async function selarEnvelope(
  instituicaoId: string,
  conteudo: string
): Promise<EnvelopeSelado> {
  const cripto = exigirCripto();
  const chave = await derivarChaveSimuladaDoTenant(instituicaoId);
  const vetor = cripto.getRandomValues(new Uint8Array(TAMANHO_VETOR_INICIALIZACAO));

  const cifrado = await cripto.subtle.encrypt(
    { name: "AES-GCM", iv: paraBufferIsolado(vetor) },
    chave,
    paraBufferIsolado(codificador.encode(conteudo))
  );

  return {
    envelopeCifrado: paraBase64(cifrado),
    vetorInicializacao: paraBase64(vetor),
    identificadorChave: identificadorChaveDoTenant(instituicaoId),
  };
}

export async function abrirEnvelope(
  instituicaoId: string,
  envelopeCifrado: string,
  vetorInicializacao: string
): Promise<string> {
  const cripto = exigirCripto();
  const chave = await derivarChaveSimuladaDoTenant(instituicaoId);
  const vetor = deBase64(vetorInicializacao);
  const cifrado = deBase64(envelopeCifrado);

  const aberto = await cripto.subtle.decrypt(
    { name: "AES-GCM", iv: paraBufferIsolado(vetor) },
    chave,
    paraBufferIsolado(cifrado)
  );

  return decodificador.decode(aberto);
}
