-- =====================================================================
-- 0001 · Plataforma multi-empresa: empresas, perfiles, membresías, helpers RLS
-- =====================================================================

-- Tipos -----------------------------------------------------------------
create type public.rubro_empresa as enum ('reposteria', 'kiosco', 'repuestos', 'general');
create type public.rol_empresa   as enum ('admin', 'encargado', 'vendedor', 'consulta');

-- updated_at genérico ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Empresas --------------------------------------------------------------
create table public.empresas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(trim(nombre)) > 0),
  cuit        text,
  direccion   text,
  telefono    text,
  email       text,
  rubro       public.rubro_empresa not null default 'general',
  config      jsonb not null default '{}'::jsonb,
  logo_url    text,
  activa      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.empresas is 'Tenants del sistema. Cada empresa ve solo sus datos (RLS).';
comment on column public.empresas.config is 'Flags por rubro: usa_vencimientos, usa_codigo_barras, permite_stock_negativo, usa_recetas, medios_pago[]';

create trigger trg_empresas_updated_at before update on public.empresas
  for each row execute function public.set_updated_at();

-- Perfiles (1:1 con auth.users) ----------------------------------------
create table public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text,
  email       text,
  superadmin  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on column public.perfiles.superadmin is 'Dueño de la plataforma. Solo se asigna por SQL.';

create trigger trg_perfiles_updated_at before update on public.perfiles
  for each row execute function public.set_updated_at();

-- Membresías usuario <-> empresa ---------------------------------------
create table public.empresa_usuarios (
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  usuario_id  uuid not null references public.perfiles (id) on delete cascade,
  rol         public.rol_empresa not null default 'vendedor',
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (empresa_id, usuario_id)
);
create index idx_empresa_usuarios_usuario on public.empresa_usuarios (usuario_id);

create trigger trg_empresa_usuarios_updated_at before update on public.empresa_usuarios
  for each row execute function public.set_updated_at();

-- Crear perfil automáticamente al registrarse un usuario ----------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers de autorización (schema privado, no expuesto por la API) -----
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.es_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.superadmin from public.perfiles p where p.id = (select auth.uid())),
    false
  );
$$;

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
      and eu.rol = any (p_roles)
  );
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- RLS -------------------------------------------------------------------
alter table public.empresas         enable row level security;
alter table public.perfiles         enable row level security;
alter table public.empresa_usuarios enable row level security;

-- Nada para anon en ninguna tabla.
revoke all on public.empresas, public.perfiles, public.empresa_usuarios from anon;

-- empresas: ver las propias; solo admin edita datos; altas vía RPC crear_empresa
create policy empresas_select on public.empresas
  for select to authenticated
  using (private.es_miembro(id));

create policy empresas_update on public.empresas
  for update to authenticated
  using (private.tiene_rol(id, array['admin']::public.rol_empresa[]))
  with check (private.tiene_rol(id, array['admin']::public.rol_empresa[]));

revoke insert, delete on public.empresas from authenticated;
revoke update on public.empresas from authenticated;
grant update (nombre, cuit, direccion, telefono, email, config, logo_url) on public.empresas to authenticated;

-- perfiles: me veo a mí y a los compañeros de mis empresas; edito solo mi nombre
create policy perfiles_select on public.perfiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or private.es_superadmin()
    or exists (
      select 1
      from public.empresa_usuarios yo
      join public.empresa_usuarios otro on otro.empresa_id = yo.empresa_id
      where yo.usuario_id = (select auth.uid()) and yo.activo
        and otro.usuario_id = perfiles.id
    )
  );

create policy perfiles_update on public.perfiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke insert, delete, update on public.perfiles from authenticated;
grant update (nombre) on public.perfiles to authenticated;

-- empresa_usuarios: miembros ven el equipo; admin gestiona
create policy empresa_usuarios_select on public.empresa_usuarios
  for select to authenticated
  using (usuario_id = (select auth.uid()) or private.es_miembro(empresa_id));

create policy empresa_usuarios_insert on public.empresa_usuarios
  for insert to authenticated
  with check (private.tiene_rol(empresa_id, array['admin']::public.rol_empresa[]));

create policy empresa_usuarios_update on public.empresa_usuarios
  for update to authenticated
  using (private.tiene_rol(empresa_id, array['admin']::public.rol_empresa[]))
  with check (private.tiene_rol(empresa_id, array['admin']::public.rol_empresa[]));

create policy empresa_usuarios_delete on public.empresa_usuarios
  for delete to authenticated
  using (private.tiene_rol(empresa_id, array['admin']::public.rol_empresa[]) and usuario_id <> (select auth.uid()));

revoke update on public.empresa_usuarios from authenticated;
grant update (rol, activo) on public.empresa_usuarios to authenticated;
