This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## IA y propuestas compartibles

El análisis básico sigue funcionando sin credenciales. Para activar la interpretación de contenido con Gemini y crear enlaces de propuesta que puedan abrirse desde otros dispositivos:

1. Crea una clave de Gemini en Google AI Studio y un proyecto de Supabase.
2. Ejecuta [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de Supabase.
3. Configura estas variables en `.env.local` para desarrollo y en **Vercel → Settings → Environment Variables** para producción:

```dotenv
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

La clave `SUPABASE_SERVICE_ROLE_KEY` solo se usa en el servidor; no la renombres con el prefijo `NEXT_PUBLIC_` ni la incluyas en el navegador. Si falta Gemini, se usa el diseño determinista. Si falta Supabase, la propuesta se conserva solo en el navegador que la creó y no tendrá enlace compartible.
