-- FlowTask — Gastos pessoais por pessoa (Ajuste 3)
-- owner = null  -> lançamento compartilhado do casal (comportamento atual, sem mudança)
-- owner = 'lucas' | 'thaiane' -> lançamento pessoal daquela pessoa (ambos podem ver, só o dono lança)
alter table public.finances_entries
  add column if not exists owner text default null;
