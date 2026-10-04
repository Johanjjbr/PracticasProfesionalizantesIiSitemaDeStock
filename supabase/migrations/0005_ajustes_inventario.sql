-- =====================================================================
-- 0005 · Ajustes de inventario + numeración correlativa por empresa
-- =====================================================================

-- Numeración correlativa (ajustes, ventas, compras…) ---------------------
create table public.contadores (
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  clave       text not null,
  ultimo      integer not null default 0,
  primary key (empresa_id, clave)
);
alter table public.contadores enable row level security;
revoke all on public.contadores from anon, authenticated;
-- Sin policies: solo se usa desde funciones security definer.

create or replace function private.siguiente_numero(p_empresa uuid, p_clave text)
returns integer
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.contadores as c (empresa_id, clave, ultimo)
  values (p_empresa, p_clave, 1)
  on conflict (empresa_id, clave) do update set ultimo = c.ultimo + 1
  returning c.ultimo;
$$;
revoke execute on function private.siguiente_numero(uuid, text) from public, anon, authenticated;

-- Ajustes ----------------------------------------------------------------
create type public.motivo_ajuste as enum (
  'conteo_fisico', 'rotura', 'vencimiento', 'merma', 'consumo_interno',
  'produccion', 'error_carga', 'devolucion', 'otro'
);

create table public.ajustes (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas (id) on delete cascade,
  numero         integer not null,
  fecha          timestamptz not null default now(),
  motivo         public.motivo_ajuste not null,
  observaciones  text,
  usuario_id     uuid default auth.uid() references public.perfiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (empresa_id, numero),
  unique (empresa_id, id)
);
create index idx_ajustes_empresa_fecha on public.ajustes (empresa_id, fecha desc);
create index idx_ajustes_usuario on public.ajustes (usuario_id);

create table public.ajuste_items (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null,
  ajuste_id         uuid not null,
  producto_id       uuid not null,
  stock_anterior    numeric(14,3) not null,
  cantidad_contada  numeric(14,3),
  diferencia        numeric(14,3) not null,
  foreign key (empresa_id, ajuste_id)   references public.ajustes (empresa_id, id) on delete cascade,
  foreign key (empresa_id, producto_id) references public.productos (empresa_id, id),
  unique (ajuste_id, producto_id)
);
create index idx_ajuste_items_producto on public.ajuste_items (empresa_id, producto_id);

create trigger trg_ajustes_inmutables
  before update or delete on public.ajustes
  for each row execute function public.bloquear_modificacion();
create trigger trg_ajuste_items_inmutables
  before update or delete on public.ajuste_items
  for each row execute function public.bloquear_modificacion();

alter table public.ajustes      enable row level security;
alter table public.ajuste_items enable row level security;
revoke all on public.ajustes, public.ajuste_items from anon;
revoke insert, update, delete on public.ajustes, public.ajuste_items from authenticated;

create policy ajustes_select on public.ajustes for select to authenticated
  using (private.es_miembro(empresa_id));
create policy ajuste_items_select on public.ajuste_items for select to authenticated
  using (private.es_miembro(empresa_id));

-- RPC: registrar ajuste ----------------------------------------------------
-- p_items: [{ "producto_id": uuid, "modo": "diferencia" | "conteo", "cantidad": number }]
--   modo diferencia → cantidad con signo (+ entra, − sale)
--   modo conteo     → cantidad contada; la diferencia la calcula la BD con el stock al momento
create or replace function public.registrar_ajuste(
  p_empresa        uuid,
  p_motivo         public.motivo_ajuste,
  p_items          jsonb,
  p_observaciones  text default null
)
returns public.ajustes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ajuste    public.ajustes;
  v_item      jsonb;
  v_prod      public.productos;
  v_modo      text;
  v_cant      numeric;
  v_dif       numeric;
  v_decimales boolean;
  v_con_mov   integer := 0;
begin
  if not private.tiene_rol(p_empresa, array['admin','encargado']::public.rol_empresa[]) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El ajuste no tiene productos';
  end if;
  if jsonb_array_length(p_items) > 500 then
    raise exception 'Máximo 500 productos por ajuste';
  end if;
  if (select count(distinct e ->> 'producto_id') from jsonb_array_elements(p_items) e) <> jsonb_array_length(p_items) then
    raise exception 'Hay productos repetidos en el ajuste';
  end if;
  if p_motivo = 'otro' and coalesce(trim(p_observaciones), '') = '' then
    raise exception 'Con motivo "otro" las observaciones son obligatorias';
  end if;

  insert into public.ajustes (empresa_id, numero, motivo, observaciones)
  values (p_empresa, private.siguiente_numero(p_empresa, 'ajuste'), p_motivo, nullif(trim(p_observaciones), ''))
  returning * into v_ajuste;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_modo := coalesce(v_item ->> 'modo', 'diferencia');
    v_cant := (v_item ->> 'cantidad')::numeric;

    select * into v_prod
    from public.productos
    where id = (v_item ->> 'producto_id')::uuid and empresa_id = p_empresa
    for update;

    if not found then
      raise exception 'Producto inexistente en la empresa';
    end if;
    if not v_prod.controla_stock then
      raise exception 'El producto "%" no controla stock', v_prod.nombre;
    end if;
    if v_cant is null then
      raise exception 'Falta la cantidad de "%"', v_prod.nombre;
    end if;

    select u.permite_decimales into v_decimales from public.unidades_medida u where u.codigo = v_prod.unidad_codigo;
    if not v_decimales and v_cant <> trunc(v_cant) then
      raise exception '"%" se mide en % y no admite decimales', v_prod.nombre, v_prod.unidad_codigo;
    end if;

    if v_modo = 'conteo' then
      if v_cant < 0 then
        raise exception 'La cantidad contada de "%" no puede ser negativa', v_prod.nombre;
      end if;
      v_dif := v_cant - v_prod.stock_actual;
    elsif v_modo = 'diferencia' then
      if v_cant = 0 then
        raise exception 'La cantidad a ajustar de "%" no puede ser 0', v_prod.nombre;
      end if;
      v_dif := v_cant;
    else
      raise exception 'Modo de ajuste inválido: %', v_modo;
    end if;

    insert into public.ajuste_items (empresa_id, ajuste_id, producto_id, stock_anterior, cantidad_contada, diferencia)
    values (p_empresa, v_ajuste.id, v_prod.id, v_prod.stock_actual,
            case when v_modo = 'conteo' then v_cant end, v_dif);

    if v_dif <> 0 then
      insert into public.movimientos_stock (empresa_id, producto_id, tipo, cantidad, referencia_tipo, referencia_id, observaciones)
      values (p_empresa, v_prod.id, 'ajuste', v_dif, 'ajuste', v_ajuste.id,
              'Ajuste #' || v_ajuste.numero || ' · ' || replace(p_motivo::text, '_', ' '));
      v_con_mov := v_con_mov + 1;
    end if;
  end loop;

  if v_con_mov = 0 and p_motivo <> 'conteo_fisico' then
    raise exception 'El ajuste no modifica ningún stock';
  end if;

  return v_ajuste;
end;
$$;
revoke execute on function public.registrar_ajuste(uuid, public.motivo_ajuste, jsonb, text) from public, anon;
grant execute on function public.registrar_ajuste(uuid, public.motivo_ajuste, jsonb, text) to authenticated;
