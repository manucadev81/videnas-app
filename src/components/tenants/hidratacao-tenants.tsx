"use client";

import { useHidratarTenants } from "@/lib/store/tenants";

export function HidratacaoTenants() {
  useHidratarTenants();
  return null;
}
