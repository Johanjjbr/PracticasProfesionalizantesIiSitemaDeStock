-- =====================================================================
-- 0006 · Compras a proveedores
--   registrar_compra: suma stock, actualiza el costo (último costo) y
--   guarda lote/vencimiento por ítem. anular_compra: revierte el stock.
--   El egreso de caja (pagada_desde_caja) se conecta en la Fase 6.
-- =====================================================================

create type public.estado_compra as enum ('confirmada', 'anulada');

create table public.compras (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid not null references public.empresas (id) on delete cascade,
  numero              integer not null,
  fecha               timestamptz not null default now(),
  proveedor_id        uuid not null,
  tipo_comprobante    text,
  nro_comprobante     text,
  fecha_comprobante   date,
  total               numeric(14,2) not null check (total >= 0),
  pagada_desde_caja   boolean not null default false,
  actualizo_costos    boolean not null default true,
  estado              public.estado_compra not null default 'confirmada',
  observaciones       text,
  usuario_id          uuid default auth.uid() references public.perfiles (id) on delete set null,
  anulada_por         uuid references public.perfiles (id) on delete set null,
  anulada_at          timestamptz,
  motivo_anulacion    text,
  created_at          timestamptz not null default now(),
  unique (empresa_id, numero),
  unique (empresa_id, id),
  foreign key (empresa_id, proveedor_id) references public.proveedores (empresa_id, id)
);
create index idx_compras_empresa_fecha on public.compras (empresa_id, fecha desc);
create index idx_compras_proveedor on public.compras (empresa_id, proveedor_id, fecha desc);
create index idx_compras_usuario on public.compras (usuario_id);
create index idx_compras_anulada_por on public.compras (anulada_por);
-- Evita cargar dos veces el mismo comprobante del mismo proveedor
create unique index uq_compras_comprobante
  on public.compras (empresa_id, proveedor_id, coalesce(tipo_comprobante, ''), nro_comprobante)
  where nro_comprobante is not null and estado = 'confirmada';

create table public.compra_items (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null,
  compra_id       uuid not null,
  producto_id     uuid not null,
  cantidad        numeric(14,3) not null check (cantidad > 0),
  costo_unitario  numeric(14,2) not null check (costo_unitario >= 0),
  subtotal        numeric(14,2) not null,
  costo_anterior  numeric(14,2),
  lote            text,
  vencimiento     date,
  foreign key (empresa_id, compra_id)   references public.compras (empresa_id, id) on delete cascade,
  foreign key (empresa_id, producto_id) references public.productos (empresa_id, id)
);
create index idx_compra_items_compra on public.compra_items (empresa_id, compra_id);
create index idx_compra_items_producto on public.compra_items (empresa_id, producto_id);

create trigger trg_compra_items_inmutables
  before update or delete on public.compra_items
  for each row execute function public.bloquear_modificacion();

alter table public.compras      enable row level security;
alter table public.compra_items enable row level security;
revoke all on public.compras, public.compra_items from anon;
revoke insert, update, delete on public.compras, public.compra_items from authenticated;

-- Las compras las ven admin, encargado y consulta (el vendedor no ve costos de compra)
create policy compras_select on public.compras for select to authenticated
  using (private.tiene_rol(empresa_id, array['admin','encargado','consulta']::public.rol_empresa[]));
create policy compra_items_select on public.compra_items for select to authenticated
  using (private.tiene_rol(empresa_id, array['admin','encargado','consulta']::public.rol_empresa[]));

-- ---------------------------------------------------------------------
-- RPC registrar_compra
-- p_items: [{ producto_id, cantidad, costo_unitario, lote?, vencimiento? (yyyy-mm-dd) }]
-- ---------------------------------------------------------------------
create or replace function public.registrar_compra(
  p_empresa            uuid,
  p_proveedor          uuid,
  p_items              jsonb,
  p_tipo_comprobante   text default null,
  p_nro_comprobante    text default null,
  p_fecha_comprobante  date default null,
  p_observaciones      text default null,
  p_actualizar_costos  boolean default true,
  p_pagada_desde_caja  boolean default false
)
returns public.compras
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_compra    public.compras;
  v_item      jsonb;
  v_prod      public.productos;
  v_cant      numeric;
  v_costo     numeric;
  v_venc      date;
  v_decimales boolean;
  v_total     numeric := 0;
begin
  if not private.tiene_rol(p_empresa, array['admin','encargado']::public.rol_empresa[]) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.proveedores where id = p_proveedor and empresa_id = p_empresa and activo) then
    raise exception 'Proveedor inexistente o inactivo';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La compra no tiene productos';
  end if;
  if jsonb_array_length(p_items) > 300 then
    raise exception 'Máximo 300 productos por compra';
  end if;
  if (select count(distinct (e ->> 'producto_id') || coalesce(e ->> 'lote', '')) from jsonb_array_elements(p_items) e)
     <> jsonb_array_length(p_items) then
    raise exception 'Hay productos repetidos (con el mismo lote) en la compra';
  end if;
  if p_fecha_comprobante is not null and p_fecha_comprobante > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    raise exception 'La fecha del comprobante no puede ser futura';
  end if;

  insert into public.compras (empresa_id, numero, proveedor_id, tipo_comprobante, nro_comprobante, fecha_comprobante,
                              total, pagada_desde_caja, actualizo_costos, observaciones)
  values (p_empresa, private.siguiente_numero(p_empresa, 'compra'), p_proveedor,
          nullif(trim(p_tipo_comprobante), ''), nullif(trim(p_nro_comprobante), ''), p_fecha_comprobante,
          0, coalesce(p_pagada_desde_caja, false), coalesce(p_actualizar_costos, true), nullif(trim(p_observaciones), ''))
  returning * into v_compra;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_cant  := (v_item ->> 'cantidad')::numeric;
    v_costo := (v_item ->> 'costo_unitario')::numeric;
    v_venc  := nullif(v_item ->> 'vencimiento', '')::date;

    select * into v_prod from public.productos
    where id = (v_item ->> 'producto_id')::uuid and empresa_id = p_empresa
    for update;

    if not found then
      raise exception 'Producto inexistente en la empresa';
    end if;
    if not v_prod.activo then
      raise exception 'El producto "%" está inactivo', v_prod.nombre;
    end if;
    if v_cant is null or v_cant <= 0 then
      raise exception 'La cantidad de "%" debe ser mayor a 0', v_prod.nombre;
    end if;
    if v_costo is null or v_costo < 0 then
      raise exception 'El costo de "%" es inválido', v_prod.nombre;
    end if;
    select u.permite_decimales into v_decimales from public.unidades_medida u where u.codigo = v_prod.unidad_codigo;
    if not v_decimales and v_cant <> trunc(v_cant) then
      raise exception '"%" se mide en % y no admite decimales', v_prod.nombre, v_prod.unidad_codigo;
    end if;

    insert into public.compra_items (empresa_id, compra_id, producto_id, cantidad, costo_unitario, subtotal,
                                     costo_anterior, lote, vencimiento)
    values (p_empresa, v_compra.id, v_prod.id, v_cant, round(v_costo, 2), round(v_cant * v_costo, 2),
            v_prod.precio_costo, nullif(trim(v_item ->> 'lote'), ''), v_venc);

    v_total := v_total + round(v_cant * v_costo, 2);

    if v_prod.controla_stock then
      insert into public.movimientos_stock (empresa_id, producto_id, tipo, cantidad, referencia_tipo, referencia_id, observaciones)
      values (p_empresa, v_prod.id, 'compra', v_cant, 'compra', v_compra.id, 'Compra #' || v_compra.numero);
    end if;

    if coalesce(p_actualizar_costos, true) and round(v_costo, 2) <> v_prod.precio_costo then
      update public.productos set precio_costo = round(v_costo, 2) where id = v_prod.id;
    end if;
  end loop;

  update public.compras set total = v_total where id = v_compra.id returning * into v_compra;
  return v_compra;
end;
$$;
revoke execute on function public.registrar_compra(uuid, uuid, jsonb, text, text, date, text, boolean, boolean) from public, anon;
grant execute on function public.registrar_compra(uuid, uuid, jsonb, text, text, date, text, boolean, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- RPC anular_compra: revierte el stock. Los costos NO se revierten.
-- ---------------------------------------------------------------------
create or replace function public.anular_compra(p_compra uuid, p_motivo text)
returns public.compras
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_compra public.compras;
  v_item   record;
begin
  select * into v_compra from public.compras where id = p_compra for update;
  if not found then
    raise exception 'Compra inexistente';
  end if;
  if not private.tiene_rol(v_compra.empresa_id, array['admin','encargado']::public.rol_empresa[]) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if v_compra.estado = 'anulada' then
    raise exception 'La compra #% ya está anulada', v_compra.numero;
  end if;
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'Indicá el motivo de la anulación';
  end if;

  for v_item in
    -- Se revierten exactamente los movimientos que generó la compra
    select m.producto_id, m.cantidad
    from public.movimientos_stock m
    where m.referencia_tipo = 'compra' and m.referencia_id = v_compra.id and m.tipo = 'compra'
  loop
    insert into public.movimientos_stock (empresa_id, producto_id, tipo, cantidad, referencia_tipo, referencia_id, observaciones)
    values (v_compra.empresa_id, v_item.producto_id, 'anulacion_compra', -v_item.cantidad, 'compra', v_compra.id,
            'Anulación compra #' || v_compra.numero);
  end loop;

  update public.compras
     set estado = 'anulada', anulada_por = auth.uid(), anulada_at = now(), motivo_anulacion = trim(p_motivo)
   where id = v_compra.id
  returning * into v_compra;

  return v_compra;
end;
$$;
revoke execute on function public.anular_compra(uuid, text) from public, anon;
grant execute on function public.anular_compra(uuid, text) to authenticated;
