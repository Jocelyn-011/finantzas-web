-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- La interfaz funciona en modo local aunque aún no conectes Supabase.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  description text not null check (char_length(description) between 1 and 50),
  amount numeric(12,0) not null check (amount > 0),
  category text not null,
  payment_method text not null,
  frequency text not null default 'Único',
  is_micro_expense boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Los usuarios ven sus propios movimientos"
  on public.transactions for select using (auth.uid() = user_id);
create policy "Los usuarios agregan sus propios movimientos"
  on public.transactions for insert with check (auth.uid() = user_id);
create policy "Los usuarios actualizan sus propios movimientos"
  on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Los usuarios eliminan sus propios movimientos"
  on public.transactions for delete using (auth.uid() = user_id);

-- Metadatos de cuentas: solo guarda el alias, institución, saldo y últimos dígitos.
-- Nunca guardes credenciales, claves ni tokens bancarios directamente en esta tabla.
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  institution text not null,
  display_name text not null,
  last_four text not null check (char_length(last_four) = 4),
  available_balance numeric(12,0) not null default 0,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.bank_accounts enable row level security;
create policy "Los usuarios ven sus propias cuentas"
  on public.bank_accounts for select using (auth.uid() = user_id);
create policy "Los usuarios agregan sus propias cuentas"
  on public.bank_accounts for insert with check (auth.uid() = user_id);
create policy "Los usuarios actualizan sus propias cuentas"
  on public.bank_accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Los usuarios eliminan sus propias cuentas"
  on public.bank_accounts for delete using (auth.uid() = user_id);
