-- =====================================================================
-- 0011 · Funciones de reportes (security invoker: respetan RLS, así el
--        vendedor solo ve sus ventas). Fechas en hora de Buenos Aires.
-- =====================================================================

-- Resumen de ventas confirmadas en un período
create or replace function public.reporte_ventas_resumen(p_empresa uuid, p_desde date, p_hasta date)
returns table (
  cantidad        bigint,
  total           numeric,
  descuentos      numeric,
  ticket_promedio numeric,
  costo           numeric,
  ganancia        numeric,
  anuladas        bigint,
  total_anulado   numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with v as (
    select * from public.ventas
    where empresa_id = p_empresa
      and (fecha at time zone 'America/Argentina/Buenos_Aires')::date between p_desde and p_hasta
  ),
  c as (
    select coalesce(sum(round(i.cantidad * i.costo_unitario, 2)), 0) as costo
    from public.venta_items i join v on v.id = i.venta_id
    where v.estado = 'confirmada'
  )
  select
    count(*) filter (where v.estado = 'confirmada'),
    coalesce(sum(v.total) filter (where v.estado = 'confirmada'), 0),
    coalesce(sum(v.descuento) filter (where v.estado = 'confirmada'), 0),
    coalesce(round(avg(v.total) filter (where v.estado = 'confirmada'), 2), 0),
    (select costo from c),
    coalesce(sum(v.total) filter (where v.estado = 'confirmada'), 0) - (select costo from c),
    count(*) filter (where v.estado = 'anulada'),
    coalesce(sum(v.total) filter (where v.estado = 'anulada'), 0)
  from v;
$$;

-- Ventas por día (incluye días sin ventas en 0)
create or replace function public.reporte_ventas_por_dia(p_empresa uuid, p_desde date, p_hasta date)
returns table (dia date, cantidad bigint, total numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select d::date,
         count(v.id),
         coalesce(sum(v.total), 0)
  from generate_series(p_desde, p_hasta, interval '1 day') d
  left join public.ventas v
    on v.empresa_id = p_empresa
   and v.estado = 'confirmada'
   and (v.fecha at time zone 'America/Argentina/Buenos_Aires')::date = d::date
  group by d
  order by d;
$$;

-- Cobrado por medio de pago
create or replace function public.reporte_ventas_por_medio(p_empresa uuid, p_desde date, p_hasta date)
returns table (medio_pago public.medio_pago, cantidad bigint, total numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.medio_pago, count(distinct v.id), sum(p.monto)
  from public.ventas v
  join public.venta_pagos p on p.venta_id = v.id
  where v.empresa_id = p_empresa and v.estado = 'confirmada'
    and (v.fecha at time zone 'America/Argentina/Buenos_Aires')::date between p_desde and p_hasta
  group by p.medio_pago
  order by 3 desc;
$$;

-- Ranking de productos vendidos (con costo histórico y ganancia).
-- El total por producto no descuenta el descuento global de la venta.
create or replace function public.reporte_ventas_por_producto(p_empresa uuid, p_desde date, p_hasta date)
returns table (
  producto_id uuid, codigo text, nombre text, categoria text, unidad text,
  cantidad numeric, total numeric, costo numeric, ganancia numeric, ventas bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select pr.id, pr.codigo, pr.nombre, c.nombre, pr.unidad_codigo,
         sum(i.cantidad), sum(i.subtotal),
         sum(round(i.cantidad * i.costo_unitario, 2)),
         sum(i.subtotal) - sum(round(i.cantidad * i.costo_unitario, 2)),
         count(distinct v.id)
  from public.ventas v
  join public.venta_items i on i.venta_id = v.id
  join public.productos pr on pr.id = i.producto_id
  left join public.categorias c on c.id = pr.categoria_id
  where v.empresa_id = p_empresa and v.estado = 'confirmada'
    and (v.fecha at time zone 'America/Argentina/Buenos_Aires')::date between p_desde and p_hasta
  group by pr.id, pr.codigo, pr.nombre, c.nombre, pr.unidad_codigo
  order by 7 desc;
$$;

-- Ventas por vendedor
create or replace function public.reporte_ventas_por_usuario(p_empresa uuid, p_desde date, p_hasta date)
returns table (usuario_id uuid, usuario text, cantidad bigint, total numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select v.usuario_id, coalesce(pf.nombre, pf.email, 'Sin usuario'), count(*), sum(v.total)
  from public.ventas v
  left join public.perfiles pf on pf.id = v.usuario_id
  where v.empresa_id = p_empresa and v.estado = 'confirmada'
    and (v.fecha at time zone 'America/Argentina/Buenos_Aires')::date between p_desde and p_hasta
  group by v.usuario_id, pf.nombre, pf.email
  order by 4 desc;
$$;

-- Compras por proveedor
create or replace function public.reporte_compras_por_proveedor(p_empresa uuid, p_desde date, p_hasta date)
returns table (proveedor_id uuid, proveedor text, cantidad bigint, total numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.proveedor_id, p.razon_social, count(*), sum(c.total)
  from public.compras c
  join public.proveedores p on p.id = c.proveedor_id
  where c.empresa_id = p_empresa and c.estado = 'confirmada'
    and (c.fecha at time zone 'America/Argentina/Buenos_Aires')::date between p_desde and p_hasta
  group by c.proveedor_id, p.razon_social
  order by 4 desc;
$$;

-- Reposición sugerida: productos con stock bajo el mínimo o que no cubren
-- lo vendido en los últimos p_dias días. sugerido = max(mínimo, vendido) − stock.
create or replace function public.reporte_reposicion(p_empresa uuid, p_dias integer default 30)
returns table (
  producto_id uuid, codigo text, nombre text, categoria text, tipo public.tipo_producto, unidad text,
  stock_actual numeric, stock_minimo numeric, vendido numeric, sugerido numeric, costo_estimado numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with vendido as (
    select i.producto_id, sum(i.cantidad) as cant
    from public.ventas v
    join public.venta_items i on i.venta_id = v.id
    where v.empresa_id = p_empresa and v.estado = 'confirmada'
      and v.fecha >= now() - make_interval(days => greatest(p_dias, 1))
    group by i.producto_id
  ),
  base as (
    select p.*, c.nombre as categoria_nombre, u.permite_decimales, coalesce(vd.cant, 0) as vendido,
           greatest(p.stock_minimo, coalesce(vd.cant, 0)) - p.stock_actual as falta
    from public.productos p
    join public.unidades_medida u on u.codigo = p.unidad_codigo
    left join public.categorias c on c.id = p.categoria_id
    left join vendido vd on vd.producto_id = p.id
    where p.empresa_id = p_empresa and p.activo and p.controla_stock
  )
  select id, codigo, nombre, categoria_nombre, tipo, unidad_codigo, stock_actual, stock_minimo, vendido,
         case when permite_decimales then round(falta, 3) else ceil(falta) end,
         round(case when permite_decimales then falta else ceil(falta) end * precio_costo, 2)
  from base
  where falta > 0
  order by (stock_actual / nullif(greatest(stock_minimo, vendido), 0)) asc nulls first, nombre;
$$;

revoke execute on function
  public.reporte_ventas_resumen(uuid, date, date),
  public.reporte_ventas_por_dia(uuid, date, date),
  public.reporte_ventas_por_medio(uuid, date, date),
  public.reporte_ventas_por_producto(uuid, date, date),
  public.reporte_ventas_por_usuario(uuid, date, date),
  public.reporte_compras_por_proveedor(uuid, date, date),
  public.reporte_reposicion(uuid, integer)
from public, anon;
grant execute on function
  public.reporte_ventas_resumen(uuid, date, date),
  public.reporte_ventas_por_dia(uuid, date, date),
  public.reporte_ventas_por_medio(uuid, date, date),
  public.reporte_ventas_por_producto(uuid, date, date),
  public.reporte_ventas_por_usuario(uuid, date, date),
  public.reporte_compras_por_proveedor(uuid, date, date),
  public.reporte_reposicion(uuid, integer)
to authenticated;
