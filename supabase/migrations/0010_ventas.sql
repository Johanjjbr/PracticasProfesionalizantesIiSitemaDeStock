-- =====================================================================
-- 0010 · Ventas (punto de venta)
--   registrar_venta: exige caja abierta, descuenta stock, registra los
--   cobros por medio de pago en la caja y calcula el vuelto.
--   anular_venta: devuelve stock y registra el egreso en la caja de quien anula.
-- =====================================================================

create type public.estado_venta as enum ('confirmada', 'anulada');

create table public.ventas (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas (id) on delete cascade,
  numero            integer not null,
  fecha             timestamptz not null default now(),
  caja_sesion_id    uuid not null,
  usuario_id        uuid default auth.uid() references public.perfiles (id) on delete set null,
  cliente_nombre    text,
  subtotal          numeric(14,2) not null check (subtotal >= 0),
  descuento         numeric(14,2) not null default 0 check (descuento >= 0),
  total             numeric(14,2) not null check (total >= 0),
  pago_recibido     numeric(14,2) not null default 0,
  vuelto            numeric(14,2) not null default 0 check (vuelto >= 0),
  estado            public.estado_venta not null default 'confirmada',
  observaciones     text,
  anulada_por       uuid references public.perfiles (id) on delete set null,
  anulada_at        timestamptz,
  motivo_anulacion  text,
  unique (empresa_id, numero),
  unique (empresa_id, id),
  foreign key (empresa_id, caja_sesion_id) references public.caja_sesiones (empresa_id, id)
);
create index idx_ventas_empresa_fecha on public.ventas (empresa_id, fecha desc);
create index idx_ventas_caja on public.ventas (empresa_id, caja_sesion_id);
create index idx_ventas_usuario on public.ventas (usuario_id);
create index idx_ventas_anulada_por on public.ventas (anulada_por);

create table public.venta_items (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null,
  venta_id         uuid not null,
  producto_id      uuid not null,
  cantidad         numeric(14,3) not null check (cantidad > 0),
  precio_unitario  numeric(14,2) not null check (precio_unitario >= 0),
  costo_unitario   numeric(14,2) not null default 0,
  subtotal         numeric(14,2) not null,
  foreign key (empresa_id, venta_id)    references public.ventas (empresa_id, id) on delete cascade,
  foreign key (empresa_id, producto_id) references public.productos (empresa_id, id)
);
create index idx_venta_items_venta on public.venta_items (empresa_id, venta_id);
create index idx_venta_items_producto on public.venta_items (empresa_id, producto_id);

create table public.venta_pagos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null,
  venta_id    uuid not null,
  medio_pago  public.medio_pago not null,
  monto       numeric(14,2) not null check (monto > 0),
  foreign key (empresa_id, venta_id) references public.ventas (empresa_id, id) on delete cascade
);
create index idx_venta_pagos_venta on public.venta_pagos (empresa_id, venta_id);

create trigger trg_venta_items_inmutables before update or delete on public.venta_items
  for each row execute function public.bloquear_modificacion();
create trigger trg_venta_pagos_inmutables before update or delete on public.venta_pagos
  for each row execute function public.bloquear_modificacion();

alter table public.ventas      enable row level security;
alter table public.venta_items enable row level security;
alter table public.venta_pagos enable row level security;
revoke all on public.ventas, public.venta_items, public.venta_pagos from anon;
revoke insert, update, delete on public.ventas, public.venta_items, public.venta_pagos from authenticated;

-- admin/encargado/consulta ven todas; el vendedor solo las propias
create policy ventas_select on public.ventas for select to authenticated
  using (
    private.tiene_rol(empresa_id, array['admin','encargado','consulta']::public.rol_empresa[])
    or (usuario_id = (select auth.uid()) and private.es_miembro(empresa_id))
  );
create policy venta_items_select on public.venta_items for select to authenticated
  using (
    private.tiene_rol(empresa_id, array['admin','encargado','consulta']::public.rol_empresa[])
    or exists (select 1 from public.ventas v where v.id = venta_items.venta_id and v.usuario_id = (select auth.uid()))
  );
create policy venta_pagos_select on public.venta_pagos for select to authenticated
  using (
    private.tiene_rol(empresa_id, array['admin','encargado','consulta']::public.rol_empresa[])
    or exists (select 1 from public.ventas v where v.id = venta_pagos.venta_id and v.usuario_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------
-- RPC registrar_venta
-- p_items: [{ producto_id, cantidad, precio_unitario? }]
--   precio_unitario distinto al de lista solo para admin/encargado.
-- p_pagos: [{ medio, monto }] — solo el efectivo puede superar el total (vuelto).
-- ---------------------------------------------------------------------
create or replace function public.registrar_venta(
  p_empresa        uuid,
  p_items          jsonb,
  p_pagos          jsonb,
  p_descuento      numeric default 0,
  p_cliente        text default null,
  p_observaciones  text default null
)
returns public.ventas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_venta       public.ventas;
  v_caja        uuid;
  v_item        jsonb;
  v_pago        jsonb;
  v_prod        public.productos;
  v_cant        numeric;
  v_precio      numeric;
  v_decimales   boolean;
  v_puede_precio boolean;
  v_subtotal    numeric := 0;
  v_descuento   numeric := round(coalesce(p_descuento, 0), 2);
  v_total       numeric;
  v_efectivo    numeric := 0;
  v_otros       numeric := 0;
  v_vuelto      numeric;
  v_medio       public.medio_pago;
  v_monto       numeric;
begin
  if not private.tiene_rol(p_empresa, array['admin','encargado','vendedor']::public.rol_empresa[]) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  v_puede_precio := private.tiene_rol(p_empresa, array['admin','encargado']::public.rol_empresa[]);

  v_caja := private.caja_abierta_actual(p_empresa);
  if v_caja is null then
    raise exception 'Abrí una caja antes de vender';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene productos';
  end if;
  if jsonb_array_length(p_items) > 200 then
    raise exception 'Máximo 200 productos por venta';
  end if;
  if (select count(distinct e ->> 'producto_id') from jsonb_array_elements(p_items) e) <> jsonb_array_length(p_items) then
    raise exception 'Hay productos repetidos en la venta';
  end if;
  if p_pagos is null or jsonb_typeof(p_pagos) <> 'array' or jsonb_array_length(p_pagos) = 0 then
    raise exception 'Indicá cómo se pagó la venta';
  end if;
  if v_descuento < 0 then
    raise exception 'El descuento no puede ser negativo';
  end if;

  insert into public.ventas (empresa_id, numero, caja_sesion_id, cliente_nombre, subtotal, descuento, total, observaciones)
  values (p_empresa, private.siguiente_numero(p_empresa, 'venta'), v_caja, nullif(trim(p_cliente), ''),
          0, 0, 0, nullif(trim(p_observaciones), ''))
  returning * into v_venta;

  -- Ítems + stock
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_cant := (v_item ->> 'cantidad')::numeric;

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
    select u.permite_decimales into v_decimales from public.unidades_medida u where u.codigo = v_prod.unidad_codigo;
    if not v_decimales and v_cant <> trunc(v_cant) then
      raise exception '"%" se vende por % y no admite decimales', v_prod.nombre, v_prod.unidad_codigo;
    end if;

    v_precio := coalesce(round((v_item ->> 'precio_unitario')::numeric, 2), v_prod.precio_venta);
    if v_precio < 0 then
      raise exception 'El precio de "%" es inválido', v_prod.nombre;
    end if;
    if v_precio <> v_prod.precio_venta and not v_puede_precio then
      raise exception 'No tenés permiso para modificar el precio de "%"', v_prod.nombre using errcode = '42501';
    end if;

    insert into public.venta_items (empresa_id, venta_id, producto_id, cantidad, precio_unitario, costo_unitario, subtotal)
    values (p_empresa, v_venta.id, v_prod.id, v_cant, v_precio, v_prod.precio_costo, round(v_cant * v_precio, 2));
    v_subtotal := v_subtotal + round(v_cant * v_precio, 2);

    if v_prod.controla_stock then
      insert into public.movimientos_stock (empresa_id, producto_id, tipo, cantidad, referencia_tipo, referencia_id, observaciones)
      values (p_empresa, v_prod.id, 'venta', -v_cant, 'venta', v_venta.id, 'Venta #' || v_venta.numero);
    end if;
  end loop;

  if v_descuento > v_subtotal then
    raise exception 'El descuento no puede superar el subtotal';
  end if;
  v_total := v_subtotal - v_descuento;

  -- Pagos: se agrupan por medio
  for v_pago in select * from jsonb_array_elements(p_pagos) loop
    v_medio := (v_pago ->> 'medio')::public.medio_pago;
    v_monto := round((v_pago ->> 'monto')::numeric, 2);
    if v_monto is null or v_monto <= 0 then
      raise exception 'Los montos de pago deben ser mayores a 0';
    end if;
    if v_medio = 'efectivo' then v_efectivo := v_efectivo + v_monto; else v_otros := v_otros + v_monto; end if;
  end loop;

  if v_otros > v_total then
    raise exception 'Los pagos con medios distintos al efectivo no pueden superar el total (no se da vuelto)';
  end if;
  if v_efectivo + v_otros < v_total then
    raise exception 'Falta cobrar %', v_total - (v_efectivo + v_otros);
  end if;
  v_vuelto := v_efectivo + v_otros - v_total;

  -- Se guardan los pagos netos (el efectivo descontando el vuelto) y se registran en la caja
  for v_medio, v_monto in
    select (e ->> 'medio')::public.medio_pago, sum(round((e ->> 'monto')::numeric, 2))
    from jsonb_array_elements(p_pagos) e group by 1
  loop
    if v_medio = 'efectivo' then v_monto := v_monto - v_vuelto; end if;
    if v_monto > 0 then
      insert into public.venta_pagos (empresa_id, venta_id, medio_pago, monto) values (p_empresa, v_venta.id, v_medio, v_monto);
      insert into public.caja_movimientos (empresa_id, caja_sesion_id, tipo, origen, medio_pago, monto, concepto, referencia_tipo, referencia_id)
      values (p_empresa, v_caja, 'ingreso', 'venta', v_medio, v_monto, 'Venta #' || v_venta.numero, 'venta', v_venta.id);
    end if;
  end loop;

  update public.ventas
     set subtotal = v_subtotal, descuento = v_descuento, total = v_total,
         pago_recibido = v_efectivo + v_otros, vuelto = v_vuelto
   where id = v_venta.id
  returning * into v_venta;

  return v_venta;
end;
$$;
revoke execute on function public.registrar_venta(uuid, jsonb, jsonb, numeric, text, text) from public, anon;
grant execute on function public.registrar_venta(uuid, jsonb, jsonb, numeric, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- RPC anular_venta (admin/encargado)
-- ---------------------------------------------------------------------
create or replace function public.anular_venta(p_venta uuid, p_motivo text)
returns public.ventas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_venta public.ventas;
  v_caja  uuid;
  v_mov   record;
  v_pago  record;
  v_efectivo numeric;
begin
  select * into v_venta from public.ventas where id = p_venta for update;
  if not found then
    raise exception 'Venta inexistente';
  end if;
  if not private.tiene_rol(v_venta.empresa_id, array['admin','encargado']::public.rol_empresa[]) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if v_venta.estado = 'anulada' then
    raise exception 'La venta #% ya está anulada', v_venta.numero;
  end if;
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'Indicá el motivo de la anulación';
  end if;

  v_caja := private.caja_abierta_actual(v_venta.empresa_id);
  if v_caja is null then
    raise exception 'Abrí una caja para registrar la devolución del dinero';
  end if;
  select coalesce(sum(monto), 0) into v_efectivo from public.venta_pagos where venta_id = v_venta.id and medio_pago = 'efectivo';
  if v_efectivo > private.efectivo_en_caja(v_caja) then
    raise exception 'No hay suficiente efectivo en tu caja para devolver % ', v_efectivo;
  end if;

  -- Devuelve el stock que salió con la venta
  for v_mov in
    select producto_id, cantidad from public.movimientos_stock
    where referencia_tipo = 'venta' and referencia_id = v_venta.id and tipo = 'venta'
  loop
    insert into public.movimientos_stock (empresa_id, producto_id, tipo, cantidad, referencia_tipo, referencia_id, observaciones)
    values (v_venta.empresa_id, v_mov.producto_id, 'anulacion_venta', -v_mov.cantidad, 'venta', v_venta.id,
            'Anulación venta #' || v_venta.numero);
  end loop;

  -- Devuelve el dinero por el mismo medio
  for v_pago in select medio_pago, monto from public.venta_pagos where venta_id = v_venta.id loop
    insert into public.caja_movimientos (empresa_id, caja_sesion_id, tipo, origen, medio_pago, monto, concepto, referencia_tipo, referencia_id)
    values (v_venta.empresa_id, v_caja, 'egreso', 'anulacion_venta', v_pago.medio_pago, v_pago.monto,
            'Anulación venta #' || v_venta.numero, 'venta', v_venta.id);
  end loop;

  update public.ventas
     set estado = 'anulada', anulada_por = auth.uid(), anulada_at = now(), motivo_anulacion = trim(p_motivo)
   where id = v_venta.id
  returning * into v_venta;
  return v_venta;
end;
$$;
revoke execute on function public.anular_venta(uuid, text) from public, anon;
grant execute on function public.anular_venta(uuid, text) to authenticated;
