-- =====================================================================
-- 0013 · Plataforma: planes, suscripciones, pagos y corte de servicio
--   - planes con precio mensual y límites (usuarios, productos)
--   - empresas: plan, pagado_hasta, días de gracia, suspensión manual
--   - estado: activa → gracia (aviso) → vencida (solo lectura) ; suspendida (bloqueo total)
--   - la BD hace cumplir el corte: triggers en las tablas de negocio
--   - todo lo de plataforma solo lo opera el superadmin (RPCs security definer)
-- =====================================================================

-- Planes ---------------------------------------------------------------
create table public.planes (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null check (length(trim(nombre)) between 2 and 60),
  descripcion     text,
  precio_mensual  numeric(14,2) not null default 0 check (precio_mensual >= 0),
  max_usuarios    integer check (max_usuarios is null or max_usuarios > 0),
  max_productos   integer check (max_productos is null or max_productos > 0),
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index uq_planes_nombre on public.planes (lower(nombre));
comment on table public.planes is 'Planes comerciales de la plataforma. Límites null = ilimitado.';

alter table public.planes enable row level security;
revoke all on public.planes from anon;
grant select, insert, update on public.planes to authenticated;

create policy planes_select on public.planes for select to authenticated using (true);
create policy planes_insert on public.planes for insert to authenticated with check (private.es_superadmin());
create policy planes_update on public.planes for update to authenticated
  using (private.es_superadmin()) with check (private.es_superadmin());

-- Suscripción en empresas ---------------------------------------------
alter table public.empresas
  add column plan_id            uuid references public.planes (id),
  add column pagado_hasta       date,
  add column dias_gracia        integer not null default 7 check (dias_gracia between 0 and 60),
  add column suspendida         boolean not null default false,
  add column motivo_suspension  text;

comment on column public.empresas.pagado_hasta is 'Último día cubierto por pagos. null = sin vencimiento (cortesía / demo).';
create index idx_empresas_plan on public.empresas (plan_id);

-- Las columnas nuevas no se agregan al grant de update: solo cambian vía RPC de plataforma.

-- Pagos de suscripción --------------------------------------------------
create table public.pagos_suscripcion (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas (id) on delete cascade,
  plan_id         uuid references public.planes (id),
  fecha           date not null,
  meses           integer not null check (meses between 1 and 36),
  monto           numeric(14,2) not null check (monto >= 0),
  medio           text not null default 'transferencia',
  desde           date not null,
  hasta           date not null,
  hasta_anterior  date,
  nota            text,
  anulado         boolean not null default false,
  anulado_motivo  text,
  registrado_por  uuid references public.perfiles (id) default auth.uid(),
  created_at      timestamptz not null default now(),
  check (hasta >= desde)
);
create index idx_pagos_suscripcion_empresa on public.pagos_suscripcion (empresa_id, created_at desc);
create index idx_pagos_suscripcion_plan on public.pagos_suscripcion (plan_id);
create index idx_pagos_suscripcion_registrado on public.pagos_suscripcion (registrado_por);

alter table public.pagos_suscripcion enable row level security;
revoke all on public.pagos_suscripcion from anon, authenticated;
grant select on public.pagos_suscripcion to authenticated;
-- El admin de la empresa ve sus pagos; el superadmin todos. Altas/anulación solo por RPC.
create policy pagos_suscripcion_select on public.pagos_suscripcion for select to authenticated
  using (private.tiene_rol(empresa_id, array['admin']::public.rol_empresa[]));

-- Estado de la empresa --------------------------------------------------
create or replace function private.hoy_ar()
returns date language sql stable set search_path = ''
as $$ select (now() at time zone 'America/Argentina/Buenos_Aires')::date $$;

create or replace function private.estado_empresa(p_empresa uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when e.suspendida then 'suspendida'
    when e.pagado_hasta is null then 'activa'
    when private.hoy_ar() <= e.pagado_hasta then 'activa'
    when private.hoy_ar() <= e.pagado_hasta + e.dias_gracia then 'gracia'
    else 'vencida'
  end
  from public.empresas e
  where e.id = p_empresa;
$$;

-- Pertenencia sin importar el estado (para poder ver la propia empresa suspendida y mostrar el aviso)
create or replace function private.pertenece(p_empresa uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.empresa_usuarios eu
    where eu.empresa_id = p_empresa and eu.usuario_id = (select auth.uid()) and eu.activo
  );
$$;

-- Suspensión = bloqueo total: los helpers de RLS dejan de reconocer al miembro.
create or replace function private.es_miembro(p_empresa uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.es_superadmin() or exists (
    select 1
    from public.empresa_usuarios eu
    join public.empresas e on e.id = eu.empresa_id
    where eu.empresa_id = p_empresa
      and eu.usuario_id = (select auth.uid())
      and eu.activo
      and e.activa
      and not e.suspendida
  );
$$;

create or replace function private.tiene_rol(p_empresa uuid, p_roles public.rol_empresa[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.es_superadmin() or exists (
    select 1
    from public.empresa_usuarios eu
    join public.empresas e on e.id = eu.empresa_id
    where eu.empresa_id = p_empresa
      and eu.usuario_id = (select auth.uid())
      and eu.activo
      and e.activa
      and not e.suspendida
      and eu.rol = any (p_roles)
  );
$$;

-- (se aplicó en Supabase en partes 0013…0013g; este archivo es el equivalente completo)
-- La fila de la empresa se sigue viendo (activa y no dada de baja) aunque esté suspendida
alter policy empresas_select on public.empresas
  using (private.es_miembro(id) or (activa and private.pertenece(id)));

-- Corte de servicio en las tablas de negocio -----------------------------
create or replace function private.exigir_empresa_operativa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empresa uuid := coalesce(new.empresa_id, old.empresa_id);
  v_estado  text;
begin
  -- Superadmin y conexiones de servicio (sin JWT) no se bloquean
  if (select auth.uid()) is null or private.es_superadmin() then
    return coalesce(new, old);
  end if;
  v_estado := private.estado_empresa(v_empresa);
  if v_estado = 'suspendida' then
    raise exception 'La empresa está suspendida. Comunicate con el administrador de la plataforma.' using errcode = 'P0001';
  elsif v_estado = 'vencida' then
    raise exception 'La suscripción está vencida: la empresa está en modo solo lectura hasta registrar el pago.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['categorias', 'productos', 'proveedores', 'movimientos_stock', 'ajustes',
                           'compras', 'ventas', 'caja_sesiones', 'caja_movimientos'] loop
    execute format(
      'create trigger trg_%1$s_empresa_operativa before insert or update or delete on public.%1$I
         for each row execute function private.exigir_empresa_operativa()', t);
  end loop;
end $$;

-- Límites del plan -------------------------------------------------------
create or replace function private.validar_limite_usuarios()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max     integer;
  v_activos integer;
begin
  if not new.activo or (tg_op = 'UPDATE' and old.activo) then
    return new;
  end if;
  select p.max_usuarios into v_max
  from public.empresas e join public.planes p on p.id = e.plan_id
  where e.id = new.empresa_id;
  if v_max is null then
    return new;
  end if;
  select count(*) into v_activos
  from public.empresa_usuarios
  where empresa_id = new.empresa_id and activo and usuario_id <> new.usuario_id;
  if v_activos >= v_max then
    raise exception 'El plan permite hasta % usuarios activos. Desactivá uno o cambiá de plan.', v_max using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_empresa_usuarios_limite
  before insert or update of activo on public.empresa_usuarios
  for each row execute function private.validar_limite_usuarios();

create or replace function private.validar_limite_productos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max     integer;
  v_activos integer;
begin
  if not new.activo or (tg_op = 'UPDATE' and old.activo) then
    return new;
  end if;
  select p.max_productos into v_max
  from public.empresas e join public.planes p on p.id = e.plan_id
  where e.id = new.empresa_id;
  if v_max is null then
    return new;
  end if;
  select count(*) into v_activos
  from public.productos
  where empresa_id = new.empresa_id and activo and id <> new.id;
  if v_activos >= v_max then
    raise exception 'El plan permite hasta % productos activos. Desactivá alguno o cambiá de plan.', v_max using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_productos_limite
  before insert or update of activo on public.productos
  for each row execute function private.validar_limite_productos();

-- RPCs de plataforma (solo superadmin) -----------------------------------
create or replace function private.exigir_superadmin()
returns void language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.es_superadmin() then
    raise exception 'Solo el administrador de la plataforma puede hacer esto' using errcode = '42501';
  end if;
end;
$$;

-- Alta de empresa desde el panel (usa crear_empresa de 0003 y le agrega plan y vencimiento)
create or replace function public.plataforma_crear_empresa(
  p_nombre        text,
  p_rubro         public.rubro_empresa,
  p_plan          uuid default null,
  p_pagado_hasta  date default null,
  p_dias_gracia   integer default 7
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empresa uuid;
begin
  perform private.exigir_superadmin();
  if length(trim(coalesce(p_nombre, ''))) < 2 then
    raise exception 'Ingresá el nombre de la empresa';
  end if;
  if exists (select 1 from public.empresas where lower(nombre) = lower(trim(p_nombre))) then
    raise exception 'Ya existe una empresa con ese nombre';
  end if;
  v_empresa := public.crear_empresa(trim(p_nombre), p_rubro, null);
  update public.empresas
  set plan_id = p_plan, pagado_hasta = p_pagado_hasta, dias_gracia = coalesce(p_dias_gracia, 7)
  where id = v_empresa;
  return v_empresa;
end;
$$;

create or replace function public.plataforma_actualizar_empresa(
  p_empresa       uuid,
  p_nombre        text,
  p_rubro         public.rubro_empresa,
  p_plan          uuid,
  p_pagado_hasta  date,
  p_dias_gracia   integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.exigir_superadmin();
  if length(trim(coalesce(p_nombre, ''))) < 2 then
    raise exception 'Ingresá el nombre de la empresa';
  end if;
  update public.empresas
  set nombre = trim(p_nombre), rubro = p_rubro, plan_id = p_plan,
      pagado_hasta = p_pagado_hasta, dias_gracia = coalesce(p_dias_gracia, 7), updated_at = now()
  where id = p_empresa;
  if not found then
    raise exception 'Empresa inexistente';
  end if;
end;
$$;

create or replace function public.plataforma_suspender_empresa(p_empresa uuid, p_suspender boolean, p_motivo text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.exigir_superadmin();
  if p_suspender and length(trim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Indicá el motivo de la suspensión';
  end if;
  update public.empresas
  set suspendida = p_suspender,
      motivo_suspension = case when p_suspender then trim(p_motivo) else null end,
      updated_at = now()
  where id = p_empresa;
  if not found then
    raise exception 'Empresa inexistente';
  end if;
end;
$$;

-- Baja definitiva (oculta la empresa a sus usuarios) o reactivación
create or replace function public.plataforma_activar_empresa(p_empresa uuid, p_activa boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.exigir_superadmin();
  update public.empresas set activa = p_activa, updated_at = now() where id = p_empresa;
  if not found then
    raise exception 'Empresa inexistente';
  end if;
end;
$$;

create or replace function public.registrar_pago_suscripcion(
  p_empresa  uuid,
  p_meses    integer,
  p_monto    numeric,
  p_medio    text default 'transferencia',
  p_fecha    date default null,
  p_nota     text default null
)
returns public.pagos_suscripcion
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_emp    public.empresas;
  v_fecha  date := coalesce(p_fecha, private.hoy_ar());
  v_desde  date;
  v_hasta  date;
  v_pago   public.pagos_suscripcion;
begin
  perform private.exigir_superadmin();
  if p_meses is null or p_meses < 1 or p_meses > 36 then
    raise exception 'Los meses deben estar entre 1 y 36';
  end if;
  if p_monto is null or p_monto < 0 then
    raise exception 'Monto inválido';
  end if;
  if v_fecha > private.hoy_ar() then
    raise exception 'La fecha del pago no puede ser futura';
  end if;

  select * into v_emp from public.empresas where id = p_empresa for update;
  if not found then
    raise exception 'Empresa inexistente';
  end if;

  -- Si todavía está cubierta, el período nuevo empieza al día siguiente; si no, desde la fecha del pago
  v_desde := case when v_emp.pagado_hasta is not null and v_emp.pagado_hasta >= v_fecha
                  then v_emp.pagado_hasta + 1 else v_fecha end;
  v_hasta := (v_desde + make_interval(months => p_meses))::date - 1;

  insert into public.pagos_suscripcion (empresa_id, plan_id, fecha, meses, monto, medio, desde, hasta, hasta_anterior, nota)
  values (p_empresa, v_emp.plan_id, v_fecha, p_meses, round(p_monto, 2), coalesce(nullif(trim(p_medio), ''), 'transferencia'),
          v_desde, v_hasta, v_emp.pagado_hasta, nullif(trim(coalesce(p_nota, '')), ''))
  returning * into v_pago;

  update public.empresas set pagado_hasta = v_hasta, updated_at = now() where id = p_empresa;
  return v_pago;
end;
$$;

-- Anula el último pago vigente y devuelve la fecha de cobertura a la anterior
create or replace function public.anular_pago_suscripcion(p_pago uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pago public.pagos_suscripcion;
begin
  perform private.exigir_superadmin();
  if length(trim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Indicá el motivo de la anulación';
  end if;
  select * into v_pago from public.pagos_suscripcion where id = p_pago for update;
  if not found or v_pago.anulado then
    raise exception 'El pago no existe o ya está anulado';
  end if;
  if exists (
    select 1 from public.pagos_suscripcion
    where empresa_id = v_pago.empresa_id and not anulado and created_at > v_pago.created_at
  ) then
    raise exception 'Solo se puede anular el último pago de la empresa';
  end if;
  update public.pagos_suscripcion set anulado = true, anulado_motivo = trim(p_motivo) where id = p_pago;
  update public.empresas set pagado_hasta = v_pago.hasta_anterior, updated_at = now() where id = v_pago.empresa_id;
end;
$$;

-- Resumen para el panel de plataforma
create or replace function public.plataforma_empresas()
returns table (
  id                 uuid,
  nombre             text,
  rubro              public.rubro_empresa,
  activa             boolean,
  suspendida         boolean,
  motivo_suspension  text,
  plan_id            uuid,
  plan_nombre        text,
  precio_mensual     numeric,
  pagado_hasta       date,
  dias_gracia        integer,
  estado             text,
  usuarios_activos   bigint,
  max_usuarios       integer,
  productos_activos  bigint,
  max_productos      integer,
  ultima_venta       timestamptz,
  ventas_30d         numeric,
  created_at         timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.exigir_superadmin();
  return query
  select e.id, e.nombre, e.rubro, e.activa, e.suspendida, e.motivo_suspension,
         e.plan_id, p.nombre, p.precio_mensual, e.pagado_hasta, e.dias_gracia,
         case when not e.activa then 'baja' else private.estado_empresa(e.id) end,
         (select count(*) from public.empresa_usuarios eu where eu.empresa_id = e.id and eu.activo),
         p.max_usuarios,
         (select count(*) from public.productos pr where pr.empresa_id = e.id and pr.activo),
         p.max_productos,
         (select max(v.fecha) from public.ventas v where v.empresa_id = e.id),
         (select coalesce(sum(v.total), 0) from public.ventas v
           where v.empresa_id = e.id and v.estado = 'confirmada' and v.fecha >= now() - interval '30 days'),
         e.created_at
  from public.empresas e
  left join public.planes p on p.id = e.plan_id
  order by e.nombre;
end;
$$;

revoke execute on function public.plataforma_crear_empresa(text, public.rubro_empresa, uuid, date, integer),
  public.plataforma_actualizar_empresa(uuid, text, public.rubro_empresa, uuid, date, integer),
  public.plataforma_suspender_empresa(uuid, boolean, text),
  public.plataforma_activar_empresa(uuid, boolean),
  public.registrar_pago_suscripcion(uuid, integer, numeric, text, date, text),
  public.anular_pago_suscripcion(uuid, text),
  public.plataforma_empresas()
  from public, anon;
grant execute on function public.plataforma_crear_empresa(text, public.rubro_empresa, uuid, date, integer),
  public.plataforma_actualizar_empresa(uuid, text, public.rubro_empresa, uuid, date, integer),
  public.plataforma_suspender_empresa(uuid, boolean, text),
  public.plataforma_activar_empresa(uuid, boolean),
  public.registrar_pago_suscripcion(uuid, integer, numeric, text, date, text),
  public.anular_pago_suscripcion(uuid, text),
  public.plataforma_empresas()
  to authenticated;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
revoke execute on function private.exigir_empresa_operativa(), private.validar_limite_usuarios(), private.validar_limite_productos()
  from authenticated;

-- Planes de ejemplo (precios editables desde la plataforma)
insert into public.planes (nombre, descripcion, precio_mensual, max_usuarios, max_productos) values
  ('Básico', 'Para un local chico: hasta 2 usuarios y 300 productos', 15000, 2, 300),
  ('Pro',    'Hasta 10 usuarios y productos ilimitados', 30000, 10, null);
