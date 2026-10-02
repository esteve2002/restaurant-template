import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "El enlace de propuesta no es válido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "La carga de propuestas compartidas aún no está configurada." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("restaurant_proposals")
    .select("restaurant, design, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("No se pudo cargar la propuesta:", error.code);
    return NextResponse.json({ error: "No se pudo cargar la propuesta." }, { status: 502 });
  }
  if (!data) {
    return NextResponse.json({ error: "Esta propuesta no existe o ya no está disponible." }, { status: 404 });
  }

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}