// Generado desde Supabase (proyecto bgrbbpviaoozrpbpoywu). No editar a mano:
// regenerar después de cada migración.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ajuste_items: {
        Row: {
          ajuste_id: string
          cantidad_contada: number | null
          diferencia: number
          empresa_id: string
          id: string
          producto_id: string
          stock_anterior: number
        }
        Insert: {
          ajuste_id: string
          cantidad_contada?: number | null
          diferencia: number
          empresa_id: string
          id?: string
          producto_id: string
          stock_anterior: number
        }
        Update: {
          ajuste_id?: string
          cantidad_contada?: number | null
          diferencia?: number
          empresa_id?: string
          id?: string
          producto_id?: string
          stock_anterior?: number
        }
        Relationships: [
          {
            foreignKeyName: "ajuste_items_empresa_id_ajuste_id_fkey"
            columns: ["empresa_id", "ajuste_id"]
            isOneToOne: false
            referencedRelation: "ajustes"
            referencedColumns: ["empresa_id", "id"]
          },
          {
            foreignKeyName: "ajuste_items_empresa_id_producto_id_fkey"
            columns: ["empresa_id", "producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["empresa_id", "id"]
          },
        ]
      }
      ajustes: {
        Row: {
          created_at: string
          empresa_id: string
          fecha: string
          id: string
          motivo: Database["public"]["Enums"]["motivo_ajuste"]
          numero: number
          observaciones: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          fecha?: string
          id?: string
          motivo: Database["public"]["Enums"]["motivo_ajuste"]
          numero: number
          observaciones?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          fecha?: string
          id?: string
          motivo?: Database["public"]["Enums"]["motivo_ajuste"]
          numero?: number
          observaciones?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caja_movimientos: {
        Row: {
          caja_sesion_id: string
          concepto: string
          empresa_id: string
          fecha: string
          id: string
          medio_pago: Database["public"]["Enums"]["medio_pago"]
          monto: number
          origen: Database["public"]["Enums"]["origen_mov_caja"]
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: Database["public"]["Enums"]["tipo_mov_caja"]
          usuario_id: string | null
        }
        Insert: {
          caja_sesion_id: string
          concepto: string
          empresa_id: string
          fecha?: string
          id?: string
          medio_pago?: Database["public"]["Enums"]["medio_pago"]
          monto: number
          origen: Database["public"]["Enums"]["origen_mov_caja"]
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: Database["public"]["Enums"]["tipo_mov_caja"]
          usuario_id?: string | null
        }
        Update: {
          caja_sesion_id?: string
          concepto?: string
          empresa_id?: string
          fecha?: string
          id?: string
          medio_pago?: Database["public"]["Enums"]["medio_pago"]
          monto?: number
          origen?: Database["public"]["Enums"]["origen_mov_caja"]
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_mov_caja"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caja_movimientos_empresa_id_caja_sesion_id_fkey"
            columns: ["empresa_id", "caja_sesion_id"]
            isOneToOne: false
            referencedRelation: "caja_sesiones"
            referencedColumns: ["empresa_id", "id"]
          },
          {
            foreignKeyName: "caja_movimientos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caja_sesiones: {
        Row: {
          apertura_at: string
          cerrada_por: string | null
          cierre_at: string | null
          diferencia: number | null
          efectivo_contado: number | null
          efectivo_esperado: number | null
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_caja"]
          id: string
          monto_inicial: number
          numero: number
          obs_apertura: string | null
          obs_cierre: string | null
          usuario_id: string
        }
        Insert: {
          apertura_at?: string
          cerrada_por?: string | null
          cierre_at?: string | null
          diferencia?: number | null
          efectivo_contado?: number | null
          efectivo_esperado?: number | null
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_caja"]
          id?: string
          monto_inicial: number
          numero: number
          obs_apertura?: string | null
          obs_cierre?: string | null
          usuario_id: string
        }
        Update: {
          apertura_at?: string
          cerrada_por?: string | null
          cierre_at?: string | null
          diferencia?: number | null
          efectivo_contado?: number | null
          efectivo_esperado?: number | null
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_caja"]
          id?: string
          monto_inicial?: number
          numero?: number
          obs_apertura?: string | null
          obs_cierre?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caja_sesiones_cerrada_por_fkey"
            columns: ["cerrada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_sesiones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_sesiones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          activa: boolean
          created_at: string
          empresa_id: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      compra_items: {
        Row: {
          cantidad: number
          compra_id: string
          costo_anterior: number | null
          costo_unitario: number
          empresa_id: string
          id: string
          lote: string | null
          producto_id: string
          subtotal: number
          vencimiento: string | null
        }
        Insert: {
          cantidad: number
          compra_id: string
          costo_anterior?: number | null
          costo_unitario: number
          empresa_id: string
          id?: string
          lote?: string | null
          producto_id: string
          subtotal: number
          vencimiento?: string | null
        }
        Update: {
          cantidad?: number
          compra_id?: string
          costo_anterior?: number | null
          costo_unitario?: number
          empresa_id?: string
          id?: string
          lote?: string | null
          producto_id?: string
          subtotal?: number
          vencimiento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compra_items_empresa_id_compra_id_fkey"
            columns: ["empresa_id", "compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["empresa_id", "id"]
          },
          {
            foreignKeyName: "compra_items_empresa_id_producto_id_fkey"
            columns: ["empresa_id", "producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["empresa_id", "id"]
          },
        ]
      }
      compras: {
        Row: {
          actualizo_costos: boolean
          anulada_at: string | null
          anulada_por: string | null
          caja_sesion_id: string | null
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_compra"]
          fecha: string
          fecha_comprobante: string | null
          id: string
          motivo_anulacion: string | null
          nro_comprobante: string | null
          numero: number
          observaciones: string | null
          pagada_desde_caja: boolean
          proveedor_id: string
          tipo_comprobante: string | null
          total: number
          usuario_id: string | null
        }
        Insert: {
          actualizo_costos?: boolean
          anulada_at?: string | null
          anulada_por?: string | null
          caja_sesion_id?: string | null
          created_at?: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_compra"]
          fecha?: string
          fecha_comprobante?: string | null
          id?: string
          motivo_anulacion?: string | null
          nro_comprobante?: string | null
          numero: number
          observaciones?: string | null
          pagada_desde_caja?: boolean
          proveedor_id: string
          tipo_comprobante?: string | null
          total: number
          usuario_id?: string | null
        }
        Update: {
          actualizo_costos?: boolean
          anulada_at?: string | null
          anulada_por?: string | null
          caja_sesion_id?: string | null
          created_at?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_compra"]
          fecha?: string
          fecha_comprobante?: string | null
          id?: string
          motivo_anulacion?: string | null
          nro_comprobante?: string | null
          numero?: number
          observaciones?: string | null
          pagada_desde_caja?: boolean
          proveedor_id?: string
          tipo_comprobante?: string | null
          total?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_anulada_por_fkey"
            columns: ["anulada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_caja_sesion_fkey"
            columns: ["empresa_id", "caja_sesion_id"]
            isOneToOne: false
            referencedRelation: "caja_sesiones"
            referencedColumns: ["empresa_id", "id"]
          },
          {
            foreignKeyName: "compras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_empresa_id_proveedor_id_fkey"
            columns: ["empresa_id", "proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["empresa_id", "id"]
          },
          {
            foreignKeyName: "compras_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contadores: {
        Row: {
          clave: string
          empresa_id: string
          ultimo: number
        }
        Insert: {
          clave: string
          empresa_id: string
          ultimo?: number
        }
        Update: {
          clave?: string
          empresa_id?: string
          ultimo?: number
        }
        Relationships: [
          {
            foreignKeyName: "contadores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_usuarios: {
        Row: {
          activo: boolean
          created_at: string
          empresa_id: string
          rol: Database["public"]["Enums"]["rol_empresa"]
          updated_at: string
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          empresa_id: string
          rol?: Database["public"]["Enums"]["rol_empresa"]
          updated_at?: string
          usuario_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          empresa_id?: string
          rol?: Database["public"]["Enums"]["rol_empresa"]
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_usuarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          activa: boolean
          config: Json
          created_at: string
          cuit: string | null
          direccion: string | null
          email: string | null
          id: string
          logo_url: string | null
          nombre: string
          rubro: Database["public"]["Enums"]["rubro_empresa"]
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activa?: boolean
          config?: Json
          created_at?: string
          cuit?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre: string
          rubro?: Database["public"]["Enums"]["rubro_empresa"]
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activa?: boolean
          config?: Json
          created_at?: string
          cuit?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string
          rubro?: Database["public"]["Enums"]["rubro_empresa"]
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      movimientos_stock: {
        Row: {
          cantidad: number
          created_at: string
          empresa_id: string
          fecha: string
          id: string
          observaciones: string | null
          producto_id: string
          referencia_id: string | null
          referencia_tipo: string | null
          stock_resultante: number | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          empresa_id: string
          fecha?: string
          id?: string
          observaciones?: string | null
          producto_id: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          stock_resultante?: number | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          empresa_id?: string
          fecha?: string
          id?: string
          observaciones?: string | null
          producto_id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          stock_resultante?: number | null
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_stock_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stock_empresa_id_producto_id_fkey"
            columns: ["empresa_id", "producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["empresa_id", "id"]
          },
          {
            foreignKeyName: "movimientos_stock_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nombre: string | null
          superadmin: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nombre?: string | null
          superadmin?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string | null
          superadmin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean
          atributos: Json
          categoria_id: string | null
          codigo: string
          codigo_barras: string | null
          controla_stock: boolean
          created_at: string
          created_by: string | null
          descripcion: string | null
          empresa_id: string
          id: string
          imagen_url: string | null
          nombre: string
          precio_costo: number
          precio_venta: number
          stock_actual: number
          stock_minimo: number
          tipo: Database["public"]["Enums"]["tipo_producto"]
          unidad_codigo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          atributos?: Json
          categoria_id?: string | null
          codigo: string
          codigo_barras?: string | null
          controla_stock?: boolean
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          empresa_id: string
          id?: string
          imagen_url?: string | null
          nombre: string
          precio_costo?: number
          precio_venta?: number
          stock_actual?: number
          stock_minimo?: number
          tipo?: Database["public"]["Enums"]["tipo_producto"]
          unidad_codigo?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          atributos?: Json
          categoria_id?: string | null
          codigo?: string
          codigo_barras?: string | null
          controla_stock?: boolean
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          empresa_id?: string
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio_costo?: number
          precio_venta?: number
          stock_actual?: number
          stock_minimo?: number
          tipo?: Database["public"]["Enums"]["tipo_producto"]
          unidad_codigo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_empresa_id_categoria_id_fkey"
            columns: ["empresa_id", "categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["empresa_id", "id"]
          },
          {
            foreignKeyName: "productos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_unidad_codigo_fkey"
            columns: ["unidad_codigo"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["codigo"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean
          alias_cbu: string | null
          ciudad: string | null
          condicion_iva: string | null
          condicion_pago: string | null
          contacto: string | null
          created_at: string
          cuit: string | null
          direccion: string | null
          email: string | null
          empresa_id: string
          id: string
          nombre_fantasia: string | null
          observaciones: string | null
          razon_social: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          alias_cbu?: string | null
          ciudad?: string | null
          condicion_iva?: string | null
          condicion_pago?: string | null
          contacto?: string | null
          created_at?: string
          cuit?: string | null
          direccion?: string | null
          email?: string | null
          empresa_id: string
          id?: string
          nombre_fantasia?: string | null
          observaciones?: string | null
          razon_social: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          alias_cbu?: string | null
          ciudad?: string | null
          condicion_iva?: string | null
          condicion_pago?: string | null
          contacto?: string | null
          created_at?: string
          cuit?: string | null
          direccion?: string | null
          email?: string | null
          empresa_id?: string
          id?: string
          nombre_fantasia?: string | null
          observaciones?: string | null
          razon_social?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_medida: {
        Row: {
          codigo: string
          nombre: string
          orden: number
          permite_decimales: boolean
        }
        Insert: {
          codigo: string
          nombre: string
          orden?: number
          permite_decimales?: boolean
        }
        Update: {
          codigo?: string
          nombre?: string
          orden?: number
          permite_decimales?: boolean
        }
        Relationships: []
      }
      venta_items: {
        Row: {
          cantidad: number
          costo_unitario: number
          empresa_id: string
          id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          costo_unitario?: number
          empresa_id: string
          id?: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          costo_unitario?: number
          empresa_id?: string
          id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_items_empresa_id_producto_id_fkey"
            columns: ["empresa_id", "producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["empresa_id", "id"]
          },
          {
            foreignKeyName: "venta_items_empresa_id_venta_id_fkey"
            columns: ["empresa_id", "venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["empresa_id", "id"]
          },
        ]
      }
      venta_pagos: {
        Row: {
          empresa_id: string
          id: string
          medio_pago: Database["public"]["Enums"]["medio_pago"]
          monto: number
          venta_id: string
        }
        Insert: {
          empresa_id: string
          id?: string
          medio_pago: Database["public"]["Enums"]["medio_pago"]
          monto: number
          venta_id: string
        }
        Update: {
          empresa_id?: string
          id?: string
          medio_pago?: Database["public"]["Enums"]["medio_pago"]
          monto?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_pagos_empresa_id_venta_id_fkey"
            columns: ["empresa_id", "venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["empresa_id", "id"]
          },
        ]
      }
      ventas: {
        Row: {
          anulada_at: string | null
          anulada_por: string | null
          caja_sesion_id: string
          cliente_nombre: string | null
          descuento: number
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_venta"]
          fecha: string
          id: string
          motivo_anulacion: string | null
          numero: number
          observaciones: string | null
          pago_recibido: number
          subtotal: number
          total: number
          usuario_id: string | null
          vuelto: number
        }
        Insert: {
          anulada_at?: string | null
          anulada_por?: string | null
          caja_sesion_id: string
          cliente_nombre?: string | null
          descuento?: number
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_venta"]
          fecha?: string
          id?: string
          motivo_anulacion?: string | null
          numero: number
          observaciones?: string | null
          pago_recibido?: number
          subtotal: number
          total: number
          usuario_id?: string | null
          vuelto?: number
        }
        Update: {
          anulada_at?: string | null
          anulada_por?: string | null
          caja_sesion_id?: string
          cliente_nombre?: string | null
          descuento?: number
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_venta"]
          fecha?: string
          id?: string
          motivo_anulacion?: string | null
          numero?: number
          observaciones?: string | null
          pago_recibido?: number
          subtotal?: number
          total?: number
          usuario_id?: string | null
          vuelto?: number
        }
        Relationships: [
          {
            foreignKeyName: "ventas_anulada_por_fkey"
            columns: ["anulada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_empresa_id_caja_sesion_id_fkey"
            columns: ["empresa_id", "caja_sesion_id"]
            isOneToOne: false
            referencedRelation: "caja_sesiones"
            referencedColumns: ["empresa_id", "id"]
          },
          {
            foreignKeyName: "ventas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      abrir_caja: {
        Args: { p_empresa: string; p_monto_inicial: number; p_observaciones?: string }
        Returns: {
          apertura_at: string
          cerrada_por: string | null
          cierre_at: string | null
          diferencia: number | null
          efectivo_contado: number | null
          efectivo_esperado: number | null
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_caja"]
          id: string
          monto_inicial: number
          numero: number
          obs_apertura: string | null
          obs_cierre: string | null
          usuario_id: string
        }
        SetofOptions: {
          from: "*"
          to: "caja_sesiones"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      anular_compra: {
        Args: { p_compra: string; p_motivo: string }
        Returns: {
          actualizo_costos: boolean
          anulada_at: string | null
          anulada_por: string | null
          caja_sesion_id: string | null
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_compra"]
          fecha: string
          fecha_comprobante: string | null
          id: string
          motivo_anulacion: string | null
          nro_comprobante: string | null
          numero: number
          observaciones: string | null
          pagada_desde_caja: boolean
          proveedor_id: string
          tipo_comprobante: string | null
          total: number
          usuario_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "compras"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      anular_venta: {
        Args: { p_motivo: string; p_venta: string }
        Returns: {
          anulada_at: string | null
          anulada_por: string | null
          caja_sesion_id: string
          cliente_nombre: string | null
          descuento: number
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_venta"]
          fecha: string
          id: string
          motivo_anulacion: string | null
          numero: number
          observaciones: string | null
          pago_recibido: number
          subtotal: number
          total: number
          usuario_id: string | null
          vuelto: number
        }
        SetofOptions: {
          from: "*"
          to: "ventas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      asignar_usuario_empresa: {
        Args: {
          p_email: string
          p_empresa: string
          p_rol?: Database["public"]["Enums"]["rol_empresa"]
        }
        Returns: undefined
      }
      cerrar_caja: {
        Args: { p_efectivo_contado: number; p_observaciones?: string; p_sesion: string }
        Returns: {
          apertura_at: string
          cerrada_por: string | null
          cierre_at: string | null
          diferencia: number | null
          efectivo_contado: number | null
          efectivo_esperado: number | null
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_caja"]
          id: string
          monto_inicial: number
          numero: number
          obs_apertura: string | null
          obs_cierre: string | null
          usuario_id: string
        }
        SetofOptions: {
          from: "*"
          to: "caja_sesiones"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crear_empresa: {
        Args: {
          p_admin_email?: string
          p_nombre: string
          p_rubro?: Database["public"]["Enums"]["rubro_empresa"]
        }
        Returns: string
      }
      movimiento_caja_manual: {
        Args: {
          p_concepto: string
          p_medio?: Database["public"]["Enums"]["medio_pago"]
          p_monto: number
          p_sesion: string
          p_tipo: Database["public"]["Enums"]["tipo_mov_caja"]
        }
        Returns: {
          caja_sesion_id: string
          concepto: string
          empresa_id: string
          fecha: string
          id: string
          medio_pago: Database["public"]["Enums"]["medio_pago"]
          monto: number
          origen: Database["public"]["Enums"]["origen_mov_caja"]
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: Database["public"]["Enums"]["tipo_mov_caja"]
          usuario_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "caja_movimientos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reporte_compras_por_proveedor: {
        Args: { p_desde: string; p_empresa: string; p_hasta: string }
        Returns: {
          cantidad: number
          proveedor: string
          proveedor_id: string
          total: number
        }[]
      }
      reporte_reposicion: {
        Args: { p_dias?: number; p_empresa: string }
        Returns: {
          categoria: string
          codigo: string
          costo_estimado: number
          nombre: string
          producto_id: string
          stock_actual: number
          stock_minimo: number
          sugerido: number
          tipo: Database["public"]["Enums"]["tipo_producto"]
          unidad: string
          vendido: number
        }[]
      }
      reporte_ventas_por_dia: {
        Args: { p_desde: string; p_empresa: string; p_hasta: string }
        Returns: {
          cantidad: number
          dia: string
          total: number
        }[]
      }
      reporte_ventas_por_medio: {
        Args: { p_desde: string; p_empresa: string; p_hasta: string }
        Returns: {
          cantidad: number
          medio_pago: Database["public"]["Enums"]["medio_pago"]
          total: number
        }[]
      }
      reporte_ventas_por_producto: {
        Args: { p_desde: string; p_empresa: string; p_hasta: string }
        Returns: {
          cantidad: number
          categoria: string
          codigo: string
          costo: number
          ganancia: number
          nombre: string
          producto_id: string
          total: number
          unidad: string
          ventas: number
        }[]
      }
      reporte_ventas_por_usuario: {
        Args: { p_desde: string; p_empresa: string; p_hasta: string }
        Returns: {
          cantidad: number
          total: number
          usuario: string
          usuario_id: string
        }[]
      }
      reporte_ventas_resumen: {
        Args: { p_desde: string; p_empresa: string; p_hasta: string }
        Returns: {
          anuladas: number
          cantidad: number
          costo: number
          descuentos: number
          ganancia: number
          ticket_promedio: number
          total: number
          total_anulado: number
        }[]
      }
      registrar_ajuste: {
        Args: {
          p_empresa: string
          p_items: Json
          p_motivo: Database["public"]["Enums"]["motivo_ajuste"]
          p_observaciones?: string
        }
        Returns: {
          created_at: string
          empresa_id: string
          fecha: string
          id: string
          motivo: Database["public"]["Enums"]["motivo_ajuste"]
          numero: number
          observaciones: string | null
          usuario_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "ajustes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_compra: {
        Args: {
          p_actualizar_costos?: boolean
          p_empresa: string
          p_fecha_comprobante?: string
          p_items: Json
          p_nro_comprobante?: string
          p_observaciones?: string
          p_pagada_desde_caja?: boolean
          p_proveedor: string
          p_tipo_comprobante?: string
        }
        Returns: {
          actualizo_costos: boolean
          anulada_at: string | null
          anulada_por: string | null
          caja_sesion_id: string | null
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_compra"]
          fecha: string
          fecha_comprobante: string | null
          id: string
          motivo_anulacion: string | null
          nro_comprobante: string | null
          numero: number
          observaciones: string | null
          pagada_desde_caja: boolean
          proveedor_id: string
          tipo_comprobante: string | null
          total: number
          usuario_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "compras"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_stock_inicial: {
        Args: { p_cantidad: number; p_obs?: string; p_producto: string }
        Returns: {
          cantidad: number
          created_at: string
          empresa_id: string
          fecha: string
          id: string
          observaciones: string | null
          producto_id: string
          referencia_id: string | null
          referencia_tipo: string | null
          stock_resultante: number | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "movimientos_stock"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_venta: {
        Args: {
          p_cliente?: string
          p_descuento?: number
          p_empresa: string
          p_items: Json
          p_observaciones?: string
          p_pagos: Json
        }
        Returns: {
          anulada_at: string | null
          anulada_por: string | null
          caja_sesion_id: string
          cliente_nombre: string | null
          descuento: number
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_venta"]
          fecha: string
          id: string
          motivo_anulacion: string | null
          numero: number
          observaciones: string | null
          pago_recibido: number
          subtotal: number
          total: number
          usuario_id: string | null
          vuelto: number
        }
        SetofOptions: {
          from: "*"
          to: "ventas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      estado_caja: "abierta" | "cerrada"
      estado_compra: "confirmada" | "anulada"
      estado_venta: "confirmada" | "anulada"
      medio_pago:
        | "efectivo"
        | "debito"
        | "credito"
        | "transferencia"
        | "billetera"
        | "otro"
      motivo_ajuste:
        | "conteo_fisico"
        | "rotura"
        | "vencimiento"
        | "merma"
        | "consumo_interno"
        | "produccion"
        | "error_carga"
        | "devolucion"
        | "otro"
      origen_mov_caja:
        | "venta"
        | "compra"
        | "manual"
        | "anulacion_venta"
        | "anulacion_compra"
      rol_empresa: "admin" | "encargado" | "vendedor" | "consulta"
      rubro_empresa: "reposteria" | "kiosco" | "repuestos" | "general"
      tipo_mov_caja: "ingreso" | "egreso"
      tipo_movimiento:
        | "inicial"
        | "compra"
        | "venta"
        | "ajuste"
        | "anulacion_venta"
        | "anulacion_compra"
        | "produccion"
      tipo_producto: "insumo" | "reventa" | "elaborado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_caja: ["abierta", "cerrada"],
      estado_compra: ["confirmada", "anulada"],
      estado_venta: ["confirmada", "anulada"],
      medio_pago: ["efectivo", "debito", "credito", "transferencia", "billetera", "otro"],
      motivo_ajuste: [
        "conteo_fisico",
        "rotura",
        "vencimiento",
        "merma",
        "consumo_interno",
        "produccion",
        "error_carga",
        "devolucion",
        "otro",
      ],
      origen_mov_caja: ["venta", "compra", "manual", "anulacion_venta", "anulacion_compra"],
      rol_empresa: ["admin", "encargado", "vendedor", "consulta"],
      rubro_empresa: ["reposteria", "kiosco", "repuestos", "general"],
      tipo_mov_caja: ["ingreso", "egreso"],
      tipo_movimiento: [
        "inicial",
        "compra",
        "venta",
        "ajuste",
        "anulacion_venta",
        "anulacion_compra",
        "produccion",
      ],
      tipo_producto: ["insumo", "reventa", "elaborado"],
    },
  },
} as const
