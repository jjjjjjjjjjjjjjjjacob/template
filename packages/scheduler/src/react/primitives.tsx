import * as React from 'react';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Button({
  className,
  variant = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost';
}) {
  return (
    <button
      className={cn(
        'focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-light transition focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' &&
          'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'outline' &&
          'border-border text-primary/80 hover:bg-accent/20 border bg-transparent',
        variant === 'destructive' &&
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'outline' | 'secondary';
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md px-2 text-xs font-light',
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'outline' && 'border-border border bg-transparent',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        className
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-[border-color,box-shadow] focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-sm leading-none font-light', className)}
      {...props}
    />
  );
}
