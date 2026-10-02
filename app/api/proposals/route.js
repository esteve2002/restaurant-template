import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_PROPOSAL_SIZE = 400_000;

export async function POST(request) {
  let proposal;
  try {
    proposal = await request.json();
  } catch {
    return NextResponse.json({ error: "El contenido de la propuesta no es válido." }, { status: 400 });
  }

  if (!proposal?.restaurant || typeof proposal.restaurant.name !== "string" || !proposal?.design) {
    return NextResponse.json({ error: "La propuesta necesita un restaurante y un diseño." }, { status: 400 });
  }
  if (JSON.stringify(proposal).length > MAX_PROPOSAL_SIZE) {
    return NextResponse.json({ error: "La propuesta es demasiado grande para compartirla." }, { status: 413 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "El enlace compartible aún no está configurado. Puedes seguir usando la vista guardada en este navegador." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("restaurant_proposals")
    .insert({ restaurant: proposal.restaurant, design: proposal.design })
    .select("id")
    .single();

  if (error) {
    console.error("No se pudo guardar la propuesta:", error.code);
    return NextResponse.json({ error: "No se pudo guardar la propuesta. Comprueba la configuración de Supabase." }, { status: 502 });
  }

  return NextResponse.json({ id: data.id }, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}