-- =====================================================================
-- 0004 · Reglas de integridad de productos
--   - No se puede dejar de controlar stock si el producto tiene stock ≠ 0.
--   - No se puede pasar a una unidad sin decimales si el stock tiene decimales.
-- =====================================================================

create or replace function public.validar_cambio_producto()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_decimales boolean;
begin
  if old.controla_stock and not new.controla_stock and old.stock_actual <> 0 then
    raise exception 'No se puede desactivar el control de stock de "%" porque tiene stock (%). Ajustalo a 0 primero.',
      old.nombre, old.stock_actual
      using errcode = 'P0001';
  end if;

  if new.unidad_codigo is distinct from old.unidad_codigo then
    select u.permite_decimales into v_decimales
    from public.unidades_medida u where u.codigo = new.unidad_codigo;
    if not v_decimales and new.stock_actual <> trunc(new.stock_actual) then
      raise exception 'La unidad "%" no admite decimales y el stock actual es %', new.unidad_codigo, new.stock_actual
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_productos_validar_cambio
  before update on public.productos
  for each row execute function public.validar_cambio_producto();
