-- 0008_investments_shared_metadata.sql
-- Carteira de investimentos compartilhada + metadados novos (instituição,
-- alocação mensal, preço de cota, nível de risco, placeholder) e atribuição
-- de aportes (Lucas/Thaiane/Ambos). Aditivo — não altera RLS (já é
-- "for all to authenticated using(true)", ou seja, compartilhada no nível do banco).

alter table public.investments
  add column if not exists institution text,
  add column if not exists allocation_percent integer,   -- 60 / 15 / 25
  add column if not exists unit_price double precision,   -- preço da cota (ex 199.43)
  add column if not exists risk_level text,               -- 'baixo' | 'medio' | 'alto'
  add column if not exists is_placeholder boolean not null default false; -- Exterior "Em breve"

alter table public.investment_contributions
  add column if not exists contributor text not null default 'ambos'; -- 'lucas' | 'thaiane' | 'ambos'
