-- =====================================================================
-- Seed de demostración: Repostería "Dulce Horno" (empresa ficticia)
-- Ejecutar con una conexión directa (SQL editor / MCP). Es idempotente
-- a nivel de empresa: si ya existe "Dulce Horno" no hace nada.
-- =====================================================================
do $$
declare
  v_emp uuid;
  r     record;
begin
  if exists (select 1 from public.empresas where nombre = 'Dulce Horno') then
    raise notice 'Seed ya aplicado';
    return;
  end if;

  v_emp := public.crear_empresa('Dulce Horno', 'reposteria');

  update public.empresas
     set cuit = '30-71234567-1', direccion = 'Av. Siempre Viva 742, CABA',
         telefono = '11 4555-0101', email = 'hola@dulcehorno.test'
   where id = v_emp;

  -- Proveedores
  insert into public.proveedores (empresa_id, razon_social, nombre_fantasia, cuit, condicion_iva, contacto, telefono, email, direccion, ciudad, condicion_pago) values
    (v_emp, 'Molinos del Sur S.A.',       'Harinas del Sur',  '30-50000001-1', 'Responsable Inscripto', 'Laura Gómez',  '11 4000-1111', 'ventas@harinasdelsur.test', 'Ruta 3 km 45',        'Cañuelas',     '30 días'),
    (v_emp, 'Lácteos La Pradera S.R.L.',  'La Pradera',       '30-50000002-9', 'Responsable Inscripto', 'Martín Díaz',  '11 4000-2222', 'pedidos@lapradera.test',   'Calle 12 n° 345',     'Luján',        '15 días'),
    (v_emp, 'Distribuidora Dulzura',      'Dulzura',          '20-30000003-8', 'Monotributista',        'Sofía Ruiz',   '11 4000-3333', 'sofia@dulzura.test',       'Av. Rivadavia 5000',  'CABA',         'Contado'),
    (v_emp, 'Descartables Norte',         null,               '27-30000004-0', 'Monotributista',        'Pablo Torres', '11 4000-4444', 'pablo@descnorte.test',     'Av. Maipú 1200',      'Vicente López','Contado');

  -- Productos: (codigo, nombre, categoria, unidad, tipo, costo, venta, stock_inicial, minimo)
  for r in
    select * from (values
      ('INS-001', 'Harina 0000',               'Insumos',          'kg',   'insumo',     900,     0,    50,   20),
      ('INS-002', 'Azúcar común',              'Insumos',          'kg',   'insumo',    1100,     0,    40,   15),
      ('INS-003', 'Manteca',                   'Insumos',          'kg',   'insumo',    7800,     0,    12,    5),
      ('INS-004', 'Huevos',                    'Insumos',          'doc',  'insumo',    2600,     0,    20,   10),
      ('INS-005', 'Dulce de leche repostero',  'Insumos',          'kg',   'insumo',    4500,     0,    10,    5),
      ('INS-006', 'Chocolate cobertura',       'Insumos',          'kg',   'insumo',   12000,     0,     3,    4),
      ('INS-007', 'Crema de leche',            'Insumos',          'l',    'insumo',    5200,     0,     8,    4),
      ('DES-001', 'Caja para torta 30cm',      'Descartables',     'un',   'insumo',     650,     0,    60,   30),
      ('DES-002', 'Bandeja cartón x12',        'Descartables',     'un',   'insumo',     180,     0,    25,   50),
      ('TOR-001', 'Torta Chocotorta',          'Tortas',           'un',   'elaborado', 9500, 22000,     4,    2),
      ('TOR-002', 'Torta Selva Negra',         'Tortas',           'un',   'elaborado',11000, 26000,     2,    2),
      ('TOR-003', 'Porción Rogel',             'Tortas',           'porc', 'elaborado',  900,  2800,    16,    8),
      ('TAR-001', 'Lemon Pie',                 'Tartas',           'un',   'elaborado', 6000, 15000,     3,    2),
      ('TAR-002', 'Tarta de frutillas',        'Tartas',           'un',   'elaborado', 7500, 18000,     1,    2),
      ('MAS-001', 'Medialunas de manteca',     'Masas y facturas', 'doc',  'elaborado', 2400,  6500,    10,    5),
      ('MAS-002', 'Masas secas surtidas',      'Masas y facturas', 'kg',   'elaborado', 8000, 19000,     3,    2),
      ('PAN-001', 'Pan dulce artesanal',       'Panificados',      'un',   'elaborado', 4200,  9800,     8,    3),
      ('POS-001', 'Tiramisú individual',       'Postres',          'un',   'elaborado', 1500,  4200,    12,    6),
      ('BEB-001', 'Agua mineral 500ml',        'Bebidas',          'un',   'reventa',    450,  1100,    48,   24),
      ('BEB-002', 'Gaseosa línea cola 500ml',  'Bebidas',          'un',   'reventa',    800,  1800,    36,   24),
      ('BEB-003', 'Café para llevar',          'Bebidas',          'un',   'elaborado',  400,  2200,     0,    0)
    ) as t(codigo, nombre, categoria, unidad, tipo, costo, venta, stock, minimo)
  loop
    insert into public.productos (empresa_id, codigo, nombre, categoria_id, unidad_codigo, tipo,
                                  precio_costo, precio_venta, stock_minimo, controla_stock)
    values (
      v_emp, r.codigo, r.nombre,
      (select c.id from public.categorias c where c.empresa_id = v_emp and c.nombre = r.categoria),
      r.unidad, r.tipo::public.tipo_producto, r.costo, r.venta, r.minimo,
      r.codigo <> 'BEB-003'   -- el café se prepara al momento: no controla stock
    );

    if r.stock > 0 then
      insert into public.movimientos_stock (empresa_id, producto_id, tipo, cantidad, referencia_tipo, observaciones)
      select v_emp, p.id, 'inicial', r.stock, 'stock_inicial', 'Stock inicial (seed)'
      from public.productos p where p.empresa_id = v_emp and p.codigo = r.codigo;
    end if;
  end loop;
end $$;
