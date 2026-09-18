import type { Instituicao, Usuario } from "@/lib/tipos";

let instituicoesRegistradas: Instituicao[] = [];
let usuariosRegistrados: Usuario[] = [];

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function definirRegistroInstituicoes(lista: Instituicao[]): void {
  instituicoesRegistradas = [...lista];
}

export function listarInstituicoesRegistradas(): Instituicao[] {
  return instituicoesRegistradas;
}

export function encontrarInstituicaoRegistrada(id: string): Instituicao | undefined {
  return instituicoesRegistradas.find((instituicao) => instituicao.id === id);
}

export function definirRegistroUsuarios(lista: Usuario[]): void {
  usuariosRegistrados = [...lista];
}

export function listarUsuariosRegistrados(): Usuario[] {
  return usuariosRegistrados;
}

export function encontrarUsuarioRegistrado(id: string): Usuario | undefined {
  return usuariosRegistrados.find((usuario) => usuario.id === id);
}

export function encontrarUsuarioRegistradoPorEmail(email: string): Usuario | undefined {
  const alvo = normalizarEmail(email);
  if (!alvo) {
    return undefined;
  }
  return usuariosRegistrados.find((usuario) => normalizarEmail(usuario.email) === alvo);
}
