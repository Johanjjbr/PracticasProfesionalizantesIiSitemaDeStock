-- =====================================================================
-- 0007 · registrar_compra: el costo se redondea a 2 decimales antes de
--        calcular el subtotal (subtotal = cantidad × costo guardado).
-- =====================================================================

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
    v_costo := round((v_item ->> 'costo_unitario')::numeric, 2);
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
