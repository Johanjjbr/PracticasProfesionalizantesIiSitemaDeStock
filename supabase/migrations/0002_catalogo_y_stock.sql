-- =====================================================================
-- 0002 · Catálogo (unidades, categorías, productos, proveedores),
--        libro de movimientos de stock y alta de empresas
-- =====================================================================

-- Unidades de medida (globales, solo lectura para usuarios) ------------
create table public.unidades_medida (
  codigo             text primary key,
  nombre             text not null,
  permite_decimales  boolean not null default false,
  orden              smallint not null default 0
);
alter table public.unidades_medida enable row level security;
revoke all on public.unidades_medida from anon;
revoke insert, update, delete on public.unidades_medida from authenticated;
create policy unidades_select on public.unidades_medida
  for select to authenticated using (true);

insert into public.unidades_medida (codigo, nombre, permite_decimales, orden) values
  ('un',   'Unidad',     false, 1),
  ('kg',   'Kilogramo',  true,  2),
  ('g',    'Gramo',      true,  3),
  ('l',    'Litro',      true,  4),
  ('ml',   'Mililitro',  true,  5),
  ('doc',  'Docena',     true,  6),
  ('porc', 'Porción',    false, 7),
  ('m',    'Metro',      true,  8),
  ('caja', 'Caja',       false, 9),
  ('paq',  'Paquete',    false, 10);

-- Categorías -----------------------------------------------------------
create table public.categorias (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  nombre      text not null check (length(trim(nombre)) > 0),
  activa      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (empresa_id, id)
);
create unique index uq_categorias_nombre on public.categorias (empresa_id, lower(nombre));
create trigger trg_categorias_updated_at before update on public.categorias
  for each row execute function public.set_updated_at();

-- Productos ------------------------------------------------------------
create type public.tipo_producto as enum ('insumo', 'reventa', 'elaborado');

create table public.productos (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas (id) on delete cascade,
  codigo          text not null check (length(trim(codigo)) > 0),
  codigo_barras   text,
  nombre          text not null check (length(trim(nombre)) > 0),
  descripcion     text,
  categoria_id    uuid,
  unidad_codigo   text not null default 'un' references public.unidades_medida (codigo),
  tipo            public.tipo_producto not null default 'reventa',
  precio_costo    numeric(14,2) not null default 0 check (precio_costo >= 0),
  precio_venta    numeric(14,2) not null default 0 check (precio_venta >= 0),
  stock_actual    numeric(14,3) not null default 0,
  stock_minimo    numeric(14,3) not null default 0 check (stock_minimo >= 0),
  controla_stock  boolean not null default true,
  atributos       jsonb not null default '{}'::jsonb,
  imagen_url      text,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid default auth.uid() references public.perfiles (id) on delete set null,
  unique (empresa_id, id),
  foreign key (empresa_id, categoria_id) references public.categorias (empresa_id, id)
);
comment on column public.productos.stock_actual is 'Cacheado. Solo lo modifica el trigger de movimientos_stock.';
comment on column public.productos.atributos is 'Campos propios del rubro (ej. repuestos: marca, codigo_fabricante, compatibilidad).';

create unique index uq_productos_codigo        on public.productos (empresa_id, lower(codigo));
create unique index uq_productos_codigo_barras on public.productos (empresa_id, codigo_barras) where codigo_barras is not null;
create index idx_productos_categoria           on public.productos (empresa_id, categoria_id);
create index idx_productos_nombre              on public.productos (empresa_id, lower(nombre));
create index idx_productos_created_by          on public.productos (created_by);
create index idx_productos_unidad              on public.productos (unidad_codigo);

create trigger trg_productos_updated_at before update on public.productos
  for each row execute function public.set_updated_at();

-- Proveedores ----------------------------------------------------------
create table public.proveedores (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas (id) on delete cascade,
  razon_social      text not null check (length(trim(razon_social)) > 0),
  nombre_fantasia   text,
  cuit              text,
  condicion_iva     text,
  contacto          text,
  telefono          text,
  email             text,
  direccion         text,
  ciudad            text,
  condicion_pago    text,
  alias_cbu         text,
  observaciones     text,
  activo            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (empresa_id, id)
);
create index idx_proveedores_empresa on public.proveedores (empresa_id, lower(razon_social));
create unique index uq_proveedores_cuit on public.proveedores (empresa_id, cuit) where cuit is not null;
create trigger trg_proveedores_updated_at before update on public.proveedores
  for each row execute function public.set_updated_at();

-- Movimientos de stock (libro mayor, solo inserción) --------------------
create type public.tipo_movimiento as enum (
  'inicial', 'compra', 'venta', 'ajuste',
  'anulacion_venta', 'anulacion_compra', 'produccion'
);

create table public.movimientos_stock (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas (id) on delete cascade,
  producto_id       uuid not null,
  fecha             timestamptz not null default now(),
  tipo              public.tipo_movimiento not null,
  cantidad          numeric(14,3) not null check (cantidad <> 0),
  stock_resultante  numeric(14,3),
  referencia_tipo   text,
  referencia_id     uuid,
  usuario_id        uuid default auth.uid() references public.perfiles (id) on delete set null,
  observaciones     text,
  created_at        timestamptz not null default now(),
  foreign key (empresa_id, producto_id) references public.productos (empresa_id, id)
);
create index idx_mov_producto_fecha on public.movimientos_stock (empresa_id, producto_id, fecha desc);
create index idx_mov_empresa_fecha  on public.movimientos_stock (empresa_id, fecha desc);
create index idx_mov_referencia     on public.movimientos_stock (referencia_tipo, referencia_id);
create index idx_mov_usuario        on public.movimientos_stock (usuario_id);

-- Aplica el movimiento al stock del producto (con bloqueo de fila)
create or replace function public.aplicar_movimiento_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock       numeric(14,3);
  v_controla    boolean;
  v_nombre      text;
  v_permite_neg boolean;
begin
  select p.stock_actual, p.controla_stock, p.nombre
    into v_stock, v_controla, v_nombre
  from public.productos p
  where p.id = new.producto_id and p.empresa_id = new.empresa_id
  for update;

  if not found then
    raise exception 'Producto % inexistente en la empresa', new.producto_id;
  end if;

  if not v_controla then
    raise exception 'El producto "%" no controla stock', v_nombre;
  end if;

  select coalesce((e.config ->> 'permite_stock_negativo')::boolean, false)
    into v_permite_neg
  from public.empresas e where e.id = new.empresa_id;

  new.stock_resultante := v_stock + new.cantidad;

  if new.stock_resultante < 0 and not v_permite_neg then
    raise exception 'Stock insuficiente para "%": disponible %, se requiere %',
      v_nombre, v_stock, abs(new.cantidad)
      using errcode = 'P0001';
  end if;

  update public.productos
     set stock_actual = new.stock_resultante
   where id = new.producto_id;

  return new;
end;
$$;
revoke execute on function public.aplicar_movimiento_stock() from public, anon, authenticated;

create trigger trg_movimientos_aplicar
  before insert on public.movimientos_stock
  for each row execute function public.aplicar_movimiento_stock();

-- Los movimientos son inmutables
create or replace function public.bloquear_modificacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Los registros de % no se pueden modificar ni borrar', tg_table_name;
end;
$$;

create trigger trg_movimientos_inmutables
  before update or delete on public.movimientos_stock
  for each row execute function public.bloquear_modificacion();

-- RLS del catálogo -----------------------------------------------------
alter table public.categorias        enable row level security;
alter table public.productos         enable row level security;
alter table public.proveedores       enable row level security;
alter table public.movimientos_stock enable row level security;

revoke all on public.categorias, public.productos, public.proveedores, public.movimientos_stock from anon;

-- categorías
create policy categorias_select on public.categorias for select to authenticated
  using (private.es_miembro(empresa_id));
create policy categorias_insert on public.categorias for insert to authenticated
  with check (private.tiene_rol(empresa_id, array['admin','encargado']::public.rol_empresa[]));
create policy categorias_update on public.categorias for update to authenticated
  using (private.tiene_rol(empresa_id, array['admin','encargado']::public.rol_empresa[]))
  with check (private.tiene_rol(empresa_id, array['admin','encargado']::public.rol_empresa[]));
revoke delete, update on public.categorias from authenticated;
grant update (nombre, activa) on public.categorias to authenticated;

-- productos (stock_actual no se puede escribir directamente)
create policy productos_select on public.productos for select to authenticated
  using (private.es_miembro(empresa_id));
create policy productos_insert on public.productos for insert to authenticated
  with check (private.tiene_rol(empresa_id, array['admin','encargado']::public.rol_empresa[]));
create policy productos_update on public.productos for update to authenticated
  using (private.tiene_rol(empresa_id, array['admin','encargado']::public.rol_empresa[]))
  with check (private.tiene_rol(empresa_id, array['admin','encargado']::public.rol_empresa[]));
revoke insert, update, delete on public.productos from authenticated;
grant insert (empresa_id, codigo, codigo_barras, nombre, descripcion, categoria_id, unidad_codigo, tipo,
              precio_costo, precio_venta, stock_minimo, controla_stock, atributos, imagen_url, activo)
  on public.productos to authenticated;
grant update (codigo, codigo_barras, nombre, descripcion, categoria_id, unidad_codigo, tipo,
              precio_costo, precio_venta, stock_minimo, controla_stock, atributos, imagen_url, activo)
  on public.productos to authenticated;

-- proveedores
create policy proveedores_select on public.proveedores for select to authenticated
  using (private.es_miembro(empresa_id));
create policy proveedores_insert on public.proveedores for insert to authenticated
  with check (private.tiene_rol(empresa_id, array['admin','encargado']::public.rol_empresa[]));
create policy proveedores_update on public.proveedores for update to authenticated
  using (private.tiene_rol(empresa_id, array['admin','encargado']::public.rol_empresa[]))
  with check (private.tiene_rol(empresa_id, array['admin','encargado']::public.rol_empresa[]));
revoke delete, update on public.proveedores from authenticated;
grant update (razon_social, nombre_fantasia, cuit, condicion_iva, contacto, telefono, email, direccion,
              ciudad, condicion_pago, alias_cbu, observaciones, activo)
  on public.proveedores to authenticated;

-- movimientos: solo lectura desde la API (se insertan vía RPC)
create policy movimientos_select on public.movimientos_stock for select to authenticated
  using (private.es_miembro(empresa_id));
revoke insert, update, delete on public.movimientos_stock from authenticated;

-- RPC: alta de empresa (solo superadmin o conexión directa a la BD) -----
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
  if not (private.es_superadmin() or session_user <> 'authenticator') then
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
revoke execute on function public.crear_empresa(text, public.rubro_empresa, text) from public, anon;
grant execute on function public.crear_empresa(text, public.rubro_empresa, text) to authenticated;

-- RPC: carga de stock inicial (admin/encargado) ------------------------
create or replace function public.registrar_stock_inicial(
  p_producto  uuid,
  p_cantidad  numeric,
  p_obs       text default null
)
returns public.movimientos_stock
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empresa uuid;
  v_mov     public.movimientos_stock;
begin
  select empresa_id into v_empresa from public.productos where id = p_producto;
  if v_empresa is null then
    raise exception 'Producto inexistente';
  end if;
  if not private.tiene_rol(v_empresa, array['admin','encargado']::public.rol_empresa[]) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if exists (select 1 from public.movimientos_stock where producto_id = p_producto) then
    raise exception 'El producto ya tiene movimientos; use un ajuste de inventario';
  end if;
  if p_cantidad <= 0 then
    raise exception 'La cantidad inicial debe ser mayor a cero';
  end if;

  insert into public.movimientos_stock (empresa_id, producto_id, tipo, cantidad, referencia_tipo, observaciones)
  values (v_empresa, p_producto, 'inicial', p_cantidad, 'stock_inicial', coalesce(p_obs, 'Stock inicial'))
  returning * into v_mov;

  return v_mov;
end;
$$;
revoke execute on function public.registrar_stock_inicial(uuid, numeric, text) from public, anon;
grant execute on function public.registrar_stock_inicial(uuid, numeric, text) to authenticated;
