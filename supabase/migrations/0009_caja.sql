-- =====================================================================
-- 0009 · Caja: sesiones (apertura/cierre), movimientos y arqueo.
--         Integra las compras pagadas en efectivo desde la caja.
-- =====================================================================

create type public.estado_caja as enum ('abierta', 'cerrada');
create type public.tipo_mov_caja as enum ('ingreso', 'egreso');
create type public.origen_mov_caja as enum ('venta', 'compra', 'manual', 'anulacion_venta', 'anulacion_compra');
create type public.medio_pago as enum ('efectivo', 'debito', 'credito', 'transferencia', 'billetera', 'otro');

-- Sesiones de caja ------------------------------------------------------
create table public.caja_sesiones (
  id                 uuid primary key default gen_random_uuid(),
  empresa_id         uuid not null references public.empresas (id) on delete cascade,
  numero             integer not null,
  usuario_id         uuid not null references public.perfiles (id),
  estado             public.estado_caja not null default 'abierta',
  apertura_at        timestamptz not null default now(),
  monto_inicial      numeric(14,2) not null check (monto_inicial >= 0),
  obs_apertura       text,
  cierre_at          timestamptz,
  cerrada_por        uuid references public.perfiles (id),
  efectivo_esperado  numeric(14,2),
  efectivo_contado   numeric(14,2) check (efectivo_contado >= 0),
  diferencia         numeric(14,2),
  obs_cierre         text,
  unique (empresa_id, numero),
  unique (empresa_id, id)
);
-- Un usuario no puede tener dos cajas abiertas en la misma empresa
create unique index uq_caja_abierta_por_usuario on public.caja_sesiones (empresa_id, usuario_id) where estado = 'abierta';
create index idx_caja_sesiones_empresa on public.caja_sesiones (empresa_id, apertura_at desc);
create index idx_caja_sesiones_usuario on public.caja_sesiones (usuario_id);
create index idx_caja_sesiones_cerrada_por on public.caja_sesiones (cerrada_por);

-- Movimientos de caja (inmutables) ---------------------------------------
create table public.caja_movimientos (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null,
  caja_sesion_id   uuid not null,
  fecha            timestamptz not null default now(),
  tipo             public.tipo_mov_caja not null,
  origen           public.origen_mov_caja not null,
  medio_pago       public.medio_pago not null default 'efectivo',
  monto            numeric(14,2) not null check (monto > 0),
  concepto         text not null,
  referencia_tipo  text,
  referencia_id    uuid,
  usuario_id       uuid default auth.uid() references public.perfiles (id) on delete set null,
  foreign key (empresa_id, caja_sesion_id) references public.caja_sesiones (empresa_id, id)
);
create index idx_caja_mov_sesion on public.caja_movimientos (empresa_id, caja_sesion_id, fecha);
create index idx_caja_mov_referencia on public.caja_movimientos (referencia_tipo, referencia_id);
create index idx_caja_mov_usuario on public.caja_movimientos (usuario_id);

create trigger trg_caja_movimientos_inmutables
  before update or delete on public.caja_movimientos
  for each row execute function public.bloquear_modificacion();

-- RLS: admin/encargado/consulta ven todas las cajas; el vendedor solo las suyas
alter table public.caja_sesiones    enable row level security;
alter table public.caja_movimientos enable row level security;
revoke all on public.caja_sesiones, public.caja_movimientos from anon;
revoke insert, update, delete on public.caja_sesiones, public.caja_movimientos from authenticated;

create policy caja_sesiones_select on public.caja_sesiones for select to authenticated
  using (
    private.tiene_rol(empresa_id, array['admin','encargado','consulta']::public.rol_empresa[])
    or (usuario_id = (select auth.uid()) and private.es_miembro(empresa_id))
  );

create policy caja_movimientos_select on public.caja_movimientos for select to authenticated
  using (
    private.tiene_rol(empresa_id, array['admin','encargado','consulta']::public.rol_empresa[])
    or exists (
      select 1 from public.caja_sesiones s
      where s.id = caja_movimientos.caja_sesion_id and s.usuario_id = (select auth.uid())
    )
  );

-- Helpers -----------------------------------------------------------------
create or replace function private.efectivo_en_caja(p_sesion uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select s.monto_inicial
       + coalesce(sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end)
                  filter (where m.medio_pago = 'efectivo'), 0)
  from public.caja_sesiones s
  left join public.caja_movimientos m on m.caja_sesion_id = s.id
  where s.id = p_sesion
  group by s.id, s.monto_inicial;
$$;
revoke execute on function private.efectivo_en_caja(uuid) from public, anon;
grant execute on function private.efectivo_en_caja(uuid) to authenticated;

-- Caja abierta del usuario actual en una empresa (null si no tiene)
create or replace function private.caja_abierta_actual(p_empresa uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.caja_sesiones
  where empresa_id = p_empresa and usuario_id = (select auth.uid()) and estado = 'abierta';
$$;
revoke execute on function private.caja_abierta_actual(uuid) from public, anon;
grant execute on function private.caja_abierta_actual(uuid) to authenticated;

-- RPC: abrir caja ---------------------------------------------------------
create or replace function public.abrir_caja(p_empresa uuid, p_monto_inicial numeric, p_observaciones text default null)
returns public.caja_sesiones
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sesion public.caja_sesiones;
begin
  if not private.tiene_rol(p_empresa, array['admin','encargado','vendedor']::public.rol_empresa[]) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_monto_inicial is null or p_monto_inicial < 0 then
    raise exception 'El monto inicial no puede ser negativo';
  end if;
  if private.caja_abierta_actual(p_empresa) is not null then
    raise exception 'Ya tenés una caja abierta. Cerrala antes de abrir otra.';
  end if;

  insert into public.caja_sesiones (empresa_id, numero, usuario_id, monto_inicial, obs_apertura)
  values (p_empresa, private.siguiente_numero(p_empresa, 'caja'), auth.uid(), round(p_monto_inicial, 2),
          nullif(trim(p_observaciones), ''))
  returning * into v_sesion;
  return v_sesion;
end;
$$;
revoke execute on function public.abrir_caja(uuid, numeric, text) from public, anon;
grant execute on function public.abrir_caja(uuid, numeric, text) to authenticated;

-- RPC: ingreso / egreso manual --------------------------------------------
create or replace function public.movimiento_caja_manual(
  p_sesion    uuid,
  p_tipo      public.tipo_mov_caja,
  p_monto     numeric,
  p_concepto  text,
  p_medio     public.medio_pago default 'efectivo'
)
returns public.caja_movimientos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sesion public.caja_sesiones;
  v_mov    public.caja_movimientos;
begin
  select * into v_sesion from public.caja_sesiones where id = p_sesion for update;
  if not found then
    raise exception 'Caja inexistente';
  end if;
  if not (
    (v_sesion.usuario_id = auth.uid() and private.es_miembro(v_sesion.empresa_id))
    or private.tiene_rol(v_sesion.empresa_id, array['admin','encargado']::public.rol_empresa[])
  ) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if v_sesion.estado <> 'abierta' then
    raise exception 'La caja #% está cerrada', v_sesion.numero;
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto debe ser mayor a 0';
  end if;
  if coalesce(trim(p_concepto), '') = '' then
    raise exception 'Indicá el concepto del movimiento';
  end if;
  if p_tipo = 'egreso' and p_medio = 'efectivo' and round(p_monto, 2) > private.efectivo_en_caja(p_sesion) then
    raise exception 'No hay suficiente efectivo en la caja (disponible: %)', private.efectivo_en_caja(p_sesion);
  end if;

  insert into public.caja_movimientos (empresa_id, caja_sesion_id, tipo, origen, medio_pago, monto, concepto)
  values (v_sesion.empresa_id, v_sesion.id, p_tipo, 'manual', p_medio, round(p_monto, 2), trim(p_concepto))
  returning * into v_mov;
  return v_mov;
end;
$$;
revoke execute on function public.movimiento_caja_manual(uuid, public.tipo_mov_caja, numeric, text, public.medio_pago) from public, anon;
grant execute on function public.movimiento_caja_manual(uuid, public.tipo_mov_caja, numeric, text, public.medio_pago) to authenticated;

-- RPC: cerrar caja (arqueo de efectivo) ------------------------------------
create or replace function public.cerrar_caja(p_sesion uuid, p_efectivo_contado numeric, p_observaciones text default null)
returns public.caja_sesiones
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sesion   public.caja_sesiones;
  v_esperado numeric;
begin
  select * into v_sesion from public.caja_sesiones where id = p_sesion for update;
  if not found then
    raise exception 'Caja inexistente';
  end if;
  if not (
    (v_sesion.usuario_id = auth.uid() and private.es_miembro(v_sesion.empresa_id))
    or private.tiene_rol(v_sesion.empresa_id, array['admin','encargado']::public.rol_empresa[])
  ) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if v_sesion.estado <> 'abierta' then
    raise exception 'La caja #% ya está cerrada', v_sesion.numero;
  end if;
  if p_efectivo_contado is null or p_efectivo_contado < 0 then
    raise exception 'Ingresá el efectivo contado';
  end if;

  v_esperado := private.efectivo_en_caja(p_sesion);

  if round(p_efectivo_contado, 2) <> v_esperado and coalesce(trim(p_observaciones), '') = '' then
    raise exception 'Hay una diferencia de %: explicala en las observaciones', round(p_efectivo_contado, 2) - v_esperado;
  end if;

  update public.caja_sesiones
     set estado = 'cerrada', cierre_at = now(), cerrada_por = auth.uid(),
         efectivo_esperado = v_esperado, efectivo_contado = round(p_efectivo_contado, 2),
         diferencia = round(p_efectivo_contado, 2) - v_esperado,
         obs_cierre = nullif(trim(p_observaciones), '')
   where id = p_sesion
  returning * into v_sesion;
  return v_sesion;
end;
$$;
revoke execute on function public.cerrar_caja(uuid, numeric, text) from public, anon;
grant execute on function public.cerrar_caja(uuid, numeric, text) to authenticated;

-- Compras pagadas desde la caja ---------------------------------------------
-- Se agrega un trigger sobre compras: al confirmarse con pagada_desde_caja,
-- registra el egreso en la caja abierta del usuario; al anularse, devuelve
-- el efectivo a la caja abierta de quien anula.
alter table public.compras add column caja_sesion_id uuid;
alter table public.compras add constraint compras_caja_sesion_fkey
  foreign key (empresa_id, caja_sesion_id) references public.caja_sesiones (empresa_id, id);
create index idx_compras_caja_sesion on public.compras (empresa_id, caja_sesion_id);

create or replace function public.compra_impacto_caja()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caja uuid;
begin
  -- Pago: la compra se crea con total 0 y se actualiza al final de registrar_compra
  if tg_op = 'UPDATE' and new.pagada_desde_caja and new.estado = 'confirmada'
     and old.total = 0 and new.total > 0 and new.caja_sesion_id is null then
    v_caja := private.caja_abierta_actual(new.empresa_id);
    if v_caja is null then
      raise exception 'Para pagar la compra desde la caja tenés que tener una caja abierta';
    end if;
    if new.total > private.efectivo_en_caja(v_caja) then
      raise exception 'No hay suficiente efectivo en la caja para pagar la compra (disponible: %)',
        private.efectivo_en_caja(v_caja);
    end if;
    insert into public.caja_movimientos (empresa_id, caja_sesion_id, tipo, origen, medio_pago, monto, concepto,
                                         referencia_tipo, referencia_id)
    values (new.empresa_id, v_caja, 'egreso', 'compra', 'efectivo', new.total, 'Pago compra #' || new.numero,
            'compra', new.id);
    new.caja_sesion_id := v_caja;
  end if;

  -- Anulación: devuelve el efectivo a la caja abierta de quien anula
  if tg_op = 'UPDATE' and old.estado = 'confirmada' and new.estado = 'anulada' and old.pagada_desde_caja then
    v_caja := private.caja_abierta_actual(new.empresa_id);
    if v_caja is null then
      raise exception 'La compra se pagó desde la caja: abrí una caja para registrar la devolución del efectivo';
    end if;
    insert into public.caja_movimientos (empresa_id, caja_sesion_id, tipo, origen, medio_pago, monto, concepto,
                                         referencia_tipo, referencia_id)
    values (new.empresa_id, v_caja, 'ingreso', 'anulacion_compra', 'efectivo', new.total,
            'Anulación compra #' || new.numero, 'compra', new.id);
  end if;

  return new;
end;
$$;
revoke execute on function public.compra_impacto_caja() from public, anon, authenticated;

create trigger trg_compras_caja
  before update on public.compras
  for each row execute function public.compra_impacto_caja();
