-- =====================================================================
-- 0003 · crear_empresa: autoriza superadmin o conexiones sin JWT
--        (SQL editor / service_role). Nueva RPC asignar_usuario_empresa.
-- =====================================================================

create or replace function public.crear_empresa(
  p_nombre       text,
  p_rubro        public.rubro_empresa default 'general',
  p_admin_email  text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empresa  uuid;
  v_config   jsonb;
  v_admin    uuid;
  v_cat      text;
  v_cats     text[];
begin
  if not (private.es_superadmin() or (select auth.uid()) is null) then
    raise exception 'Solo el superadmin puede crear empresas' using errcode = '42501';
  end if;

  v_config := jsonb_build_object(
    'usa_vencimientos',       p_rubro in ('reposteria'),
    'usa_codigo_barras',      p_rubro in ('kiosco', 'repuestos'),
    'permite_stock_negativo', p_rubro in ('kiosco'),
    'usa_recetas',            false,
    'medios_pago',            jsonb_build_array('efectivo', 'debito', 'credito', 'transferencia')
  );

  insert into public.empresas (nombre, rubro, config)
  values (p_nombre, p_rubro, v_config)
  returning id into v_empresa;

  v_cats := case p_rubro
    when 'reposteria' then array['Tortas', 'Tartas', 'Masas y facturas', 'Panificados', 'Postres', 'Bebidas', 'Insumos', 'Descartables']
    when 'kiosco'     then array['Golosinas', 'Bebidas', 'Cigarrillos', 'Almacén', 'Limpieza', 'Varios']
    when 'repuestos'  then array['Motor', 'Frenos', 'Suspensión', 'Eléctrico', 'Filtros', 'Lubricantes', 'Accesorios']
    else array['General']
  end;

  foreach v_cat in array v_cats loop
    insert into public.categorias (empresa_id, nombre) values (v_empresa, v_cat);
  end loop;

  if p_admin_email is not null then
    select id into v_admin from public.perfiles where lower(email) = lower(p_admin_email);
    if v_admin is null then
      raise exception 'No existe un usuario registrado con email %', p_admin_email;
    end if;
    insert into public.empresa_usuarios (empresa_id, usuario_id, rol)
    values (v_empresa, v_admin, 'admin');
  end if;

  return v_empresa;
end;
$$;

create or replace function public.asignar_usuario_empresa(
  p_empresa  uuid,
  p_email    text,
  p_rol      public.rol_empresa default 'vendedor'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid;
begin
  if not (private.tiene_rol(p_empresa, array['admin']::public.rol_empresa[]) or (select auth.uid()) is null) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  select id into v_usuario from public.perfiles where lower(email) = lower(p_email);
  if v_usuario is null then
    raise exception 'No existe un usuario registrado con email %', p_email;
  end if;
  insert into public.empresa_usuarios (empresa_id, usuario_id, rol)
  values (p_empresa, v_usuario, p_rol)
  on conflict (empresa_id, usuario_id) do update set rol = excluded.rol, activo = true;
end;
$$;
revoke execute on function public.asignar_usuario_empresa(uuid, text, public.rol_empresa) from public, anon;
grant execute on function public.asignar_usuario_empresa(uuid, text, public.rol_empresa) to authenticated;
