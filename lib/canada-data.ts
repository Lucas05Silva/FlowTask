/**
 * Canadá (Fase 16) — static reference data: metadata, the go-forward seed
 * (decisions/documents/cities/checklist) and educational content. Mirrors the
 * lib/investment-calculator.ts pattern used by the Investimentos module.
 */
import type {
  CanadaDecisionCategory,
  CanadaDocumentCategory,
  CanadaDocumentStatus,
  CanadaChecklistCategory,
  CanadaChecklistPriority,
  CanadaNoteCategory,
  Assignee,
} from "@/types";

export const DECISION_CATEGORY_META: Record<CanadaDecisionCategory, { label: string }> = {
  cidade: { label: "Cidade" },
  visto: { label: "Visto" },
  prazo: { label: "Prazo" },
  moradia: { label: "Moradia" },
  trabalho: { label: "Trabalho" },
  outro: { label: "Outro" },
};

export const DOCUMENT_CATEGORY_META: Record<CanadaDocumentCategory, { label: string }> = {
  passaporte: { label: "Passaporte" },
  visto: { label: "Visto" },
  civil: { label: "Civil" },
  financeiro: { label: "Financeiro" },
  outro: { label: "Outro" },
};

export const DOCUMENT_STATUS_META: Record<CanadaDocumentStatus, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "var(--danger)" },
  em_andamento: { label: "Em andamento", color: "var(--warning)" },
  concluido: { label: "Concluído", color: "var(--success)" },
  nao_aplicavel: { label: "N/A", color: "var(--text-secondary)" },
};

export const CHECKLIST_CATEGORY_META: Record<CanadaChecklistCategory, { label: string; emoji: string }> = {
  brasil: { label: "Antes de partir", emoji: "🇧🇷" },
  chegada: { label: "Chegada", emoji: "✈️" },
  instalacao: { label: "Instalação", emoji: "🏠" },
  estudos: { label: "LinkedIn & Carreira", emoji: "💼" },
};

export const CHECKLIST_PRIORITY_META: Record<CanadaChecklistPriority, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "var(--prio-baixa)" },
  media: { label: "Média", color: "var(--prio-media)" },
  alta: { label: "Alta", color: "var(--prio-alta)" },
};

export const NOTE_CATEGORY_META: Record<CanadaNoteCategory, { label: string }> = {
  visto: { label: "Visto" },
  cidade: { label: "Cidade" },
  trabalho: { label: "Trabalho" },
  moradia: { label: "Moradia" },
  geral: { label: "Geral" },
};

/** Educational accordion content — "Principais tipos de visto para o Canadá". */
export const VISA_TYPES: { name: string; description: string }[] = [
  { name: "Express Entry", description: "Para quem tem experiência de trabalho qualificado." },
  { name: "Study Permit", description: "Para quem vai estudar primeiro." },
  { name: "Working Holiday (IEC)", description: "Para jovens até 35 anos, mais simples." },
  { name: "Provincial Nominee Program (PNP)", description: "Indicado pela província." },
];
export const VISA_INFO_LINK = "https://www.canada.ca/en/immigration-refugees-citizenship.html";
export const COST_OF_LIVING_LINK = "https://www.numbeo.com/cost-of-living/";

/** Reserve estimate line items (editable in the UI, kept here as defaults). */
export const RESERVE_ESTIMATE_DEFAULTS: { label: string; amount: number }[] = [
  { label: "Passagens aéreas (2 pessoas)", amount: 8000 },
  { label: "1º mês moradia (depósito + aluguel)", amount: 15000 },
  { label: "Taxa de visto (2 pessoas)", amount: 3000 },
  { label: "Seguro saúde (3 meses)", amount: 4000 },
  { label: "Reserva de emergência", amount: 20000 },
];
export const RESERVE_ESTIMATE_TOTAL = RESERVE_ESTIMATE_DEFAULTS.reduce((s, i) => s + i.amount, 0);

/** Goal linkedModule marker shared by useCanada and the Metas module. */
export const CANADA_GOAL_LINKED_MODULE = "canada";

/* --------------------------------------------------------------------------- */
/* Seed specs (idempotent, applied client-side — see useCanada.seedIfEmpty)    */
/* --------------------------------------------------------------------------- */

export const DECISION_SEED: { category: CanadaDecisionCategory; question: string }[] = [
  { category: "cidade", question: "Qual cidade vamos morar?" },
  { category: "visto", question: "Qual tipo de visto vamos solicitar?" },
  { category: "prazo", question: "Qual nossa data alvo de partida?" },
  { category: "moradia", question: "Vamos alugar antes de chegar ou só depois?" },
  { category: "trabalho", question: "Qual área de trabalho cada um vai focar no Canadá?" },
];

export const DOCUMENT_SEED: { name: string; owner: Assignee; category: CanadaDocumentCategory }[] = [
  { name: "Passaporte Lucas", owner: "lucas", category: "passaporte" },
  { name: "Passaporte Thaiane", owner: "thaiane", category: "passaporte" },
  { name: "Certidão de Nascimento Lucas", owner: "lucas", category: "civil" },
  { name: "Certidão de Nascimento Thaiane", owner: "thaiane", category: "civil" },
  { name: "Certidão de União Estável / Casamento", owner: "ambos", category: "civil" },
  { name: "Comprovante de Renda (últimos 3 meses)", owner: "ambos", category: "financeiro" },
  { name: "Extrato Bancário (últimos 6 meses)", owner: "ambos", category: "financeiro" },
  { name: "Diploma / Histórico Escolar (traduzido)", owner: "lucas", category: "civil" },
  { name: "Diploma / Histórico Escolar (traduzido)", owner: "thaiane", category: "civil" },
  { name: "Antecedentes Criminais", owner: "lucas", category: "civil" },
  { name: "Antecedentes Criminais", owner: "thaiane", category: "civil" },
  { name: "Foto 35x45mm (padrão visto)", owner: "ambos", category: "visto" },
];

export const CITY_SEED: { name: string; province: string; avgRent1br: number }[] = [
  { name: "Toronto", province: "Ontario", avgRent1br: 2200 },
  { name: "Vancouver", province: "British Columbia", avgRent1br: 2400 },
  { name: "Calgary", province: "Alberta", avgRent1br: 1600 },
  { name: "Montreal", province: "Quebec", avgRent1br: 1400 },
  { name: "Ottawa", province: "Ontario", avgRent1br: 1700 },
];

export const CHECKLIST_SEED: {
  category: CanadaChecklistCategory;
  title: string;
  assignedTo: Assignee;
  priority: CanadaChecklistPriority;
}[] = [
  // Brasil
  { category: "brasil", title: "Quitar todas as dívidas antes de partir", assignedTo: "ambos", priority: "alta" },
  { category: "brasil", title: "Sacar FGTS (se aplicável)", assignedTo: "lucas", priority: "media" },
  { category: "brasil", title: "Cancelar planos de saúde, assinaturas, contratos", assignedTo: "ambos", priority: "media" },
  { category: "brasil", title: "Definir o que fazer com os móveis (vender/guardar)", assignedTo: "ambos", priority: "media" },
  { category: "brasil", title: "Avisar família e amigos", assignedTo: "ambos", priority: "baixa" },
  { category: "brasil", title: "Abrir conta no banco canadense antes de partir", assignedTo: "ambos", priority: "alta" },
  // Chegada
  { category: "chegada", title: "Reservar acomodação temporária (Airbnb / hostel)", assignedTo: "ambos", priority: "alta" },
  { category: "chegada", title: "Comprar chip de celular local ao chegar", assignedTo: "ambos", priority: "alta" },
  { category: "chegada", title: "Obter SIN (Social Insurance Number)", assignedTo: "ambos", priority: "alta" },
  { category: "chegada", title: "Abrir conta bancária (TD, RBC, Scotiabank)", assignedTo: "ambos", priority: "alta" },
  { category: "chegada", title: "Contratar seguro saúde temporário", assignedTo: "ambos", priority: "alta" },
  // Instalação
  { category: "instalacao", title: "Encontrar apartamento definitivo", assignedTo: "ambos", priority: "alta" },
  { category: "instalacao", title: "Obter carteira de motorista local", assignedTo: "ambos", priority: "media" },
  { category: "instalacao", title: "Matricular em cursos de inglês / francês", assignedTo: "ambos", priority: "media" },
  // Estudos & Carreira (LinkedIn)
  { category: "estudos", title: "Perfil do LinkedIn em inglês", assignedTo: "ambos", priority: "alta" },
  { category: "estudos", title: "Foto profissional atualizada", assignedTo: "ambos", priority: "media" },
  { category: "estudos", title: "Conectar com recrutadores/profissionais no Canadá", assignedTo: "ambos", priority: "media" },
  { category: "estudos", title: "Headline e resumo focados no mercado canadense", assignedTo: "ambos", priority: "baixa" },
];
