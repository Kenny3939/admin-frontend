# Admin Panel (Vite + React + TS + Supabase)

Panel administrativo para “Secretaría Virtual”.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Tema (Light/Dark/System)

- **Provider**: `src/providers/theme.tsx`
- **Preferencia**: se guarda en `localStorage` bajo `sv-theme` con valores `light | dark | system`.
- **Tokens**: `src/index.css` define variables CSS y `src/theme.ts` las consume.

## Toasts (mensajes no intrusivos)

- **Provider**: `src/providers/toast.tsx`
- Uso:

```ts
import { useToast } from './providers/toast';
// ...
const { toast } = useToast();
toast('Guardado correctamente', { type: 'success' });
```
