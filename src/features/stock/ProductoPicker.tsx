import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command';
import { cn } from '@/app/components/ui/utils';
import { formatNumero } from '@/lib/format';
import type { ProductoConCategoria } from '@/features/productos/api';

interface Props {
  productos: ProductoConCategoria[];
  /** Producto seleccionado (modo "selector") o undefined (modo "agregar"). */
  valor?: string;
  onSeleccionar: (p: ProductoConCategoria) => void;
  placeholder?: string;
  deshabilitados?: Set<string>;
  className?: string;
  mostrarStock?: boolean;
}

/** Buscador de productos por código o nombre (combobox). */
export function ProductoPicker({
  productos,
  valor,
  onSeleccionar,
  placeholder = 'Buscar producto…',
  deshabilitados,
  className,
  mostrarStock = true,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  // Se incrementa en cada apertura para remontar el buscador y que arranque vacío
  const [apertura, setApertura] = useState(0);
  const seleccionado = valor ? productos.find((p) => p.id === valor) : undefined;

  return (
    <Popover
      open={abierto}
      onOpenChange={(o) => {
        setAbierto(o);
        if (o) setApertura((n) => n + 1);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={abierto}
          className={cn('justify-between font-normal', className)}
        >
          <span className={cn('truncate', !seleccionado && 'text-muted-foreground')}>
            {seleccionado ? `${seleccionado.codigo} · ${seleccionado.nombre}` : placeholder}
          </span>
          <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-80" align="start">
        <Command
          key={apertura}
          filter={(value, search) => {
            const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
            return n(value).includes(n(search)) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Código o nombre…" />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {productos.map((p) => {
                const deshab = deshabilitados?.has(p.id) ?? false;
                return (
                  <CommandItem
                    key={p.id}
                    value={`${p.codigo} ${p.nombre} ${p.codigo_barras ?? ''}`}
                    disabled={deshab}
                    onSelect={() => {
                      onSeleccionar(p);
                      setAbierto(false);
                    }}
                  >
                    <Check className={cn('w-4 h-4', valor === p.id ? 'opacity-100' : 'opacity-0')} />
                    <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">{p.codigo}</span>
                    <span className="flex-1 truncate">{p.nombre}</span>
                    {mostrarStock && p.controla_stock && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatNumero(p.stock_actual)} {p.unidad_codigo}
                      </span>
                    )}
                    {deshab && <span className="text-xs text-muted-foreground">agregado</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
