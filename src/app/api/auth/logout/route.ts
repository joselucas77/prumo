import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("token");
    cookieStore.delete("user_context");

    return NextResponse.json({ success: true, message: "Sessão encerrada com sucesso." });
  } catch (error) {
    console.error("Erro no logout:", error);
    return NextResponse.json({ error: "Erro ao encerrar sessão." }, { status: 500 });
  }
}
