-- 0008 · Índice para la FK (empresa_id, ajuste_id) de ajuste_items (advisor de performance)
create index if not exists idx_ajuste_items_ajuste on public.ajuste_items (empresa_id, ajuste_id);
