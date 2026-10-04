-- =====================================================================
-- 0012 · Usuarios y configuración
--   - Una empresa nunca se queda sin un administrador activo.
--   - La configuración de la empresa (jsonb) se valida en la BD.
-- =====================================================================

create or replace function public.proteger_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quedan integer;
begin
  -- Solo importa si la fila era un admin activo y deja de serlo
  if old.rol <> 'admin' or not old.activo then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' and new.rol = 'admin' and new.activo then
    return new;
  end if;
  -- Borrado en cascada de la empresa completa: permitido
  if tg_op = 'DELETE' and not exists (select 1 from public.empresas where id = old.empresa_id) then
    return old;
  end if;

  select count(*) into v_quedan
  from public.empresa_usuarios
  where empresa_id = old.empresa_id and rol = 'admin' and activo and usuario_id <> old.usuario_id;

  if v_quedan = 0 then
    raise exception 'La empresa tiene que tener al menos un administrador activo' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;
revoke execute on function public.proteger_ultimo_admin() from public, anon, authenticated;

create trigger trg_empresa_usuarios_ultimo_admin
  before update or delete on public.empresa_usuarios
  for each row execute function public.proteger_ultimo_admin();

create or replace function public.validar_config_empresa()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_clave text;
  v_medios jsonb;
begin
  if jsonb_typeof(new.config) <> 'object' then
    raise exception 'La configuración debe ser un objeto';
  end if;
  foreach v_clave in array array['usa_vencimientos', 'usa_codigo_barras', 'permite_stock_negativo', 'usa_recetas'] loop
    if new.config ? v_clave and jsonb_typeof(new.config -> v_clave) <> 'boolean' then
      raise exception 'La opción % debe ser verdadero o falso', v_clave;
    end if;
  end loop;

  v_medios := new.config -> 'medios_pago';
  if v_medios is not null then
    if jsonb_typeof(v_medios) <> 'array' then
      raise exception 'medios_pago debe ser una lista';
    end if;
    if exists (
      select 1 from jsonb_array_elements_text(v_medios) m
      where m not in (select unnest(enum_range(null::public.medio_pago))::text)
    ) then
      raise exception 'Hay medios de pago inválidos';
    end if;
    if not v_medios ? 'efectivo' then
      raise exception 'El efectivo tiene que estar siempre habilitado';
    end if;
  end if;

  if new.cuit is not null and new.cuit !~ '^\d{2}-\d{8}-\d$' then
    raise exception 'El CUIT debe tener el formato XX-XXXXXXXX-X';
  end if;
  return new;
end;
$$;

create trigger trg_empresas_validar_config
  before insert or update on public.empresas
  for each row execute function public.validar_config_empresa();
