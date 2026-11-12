import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { signJwtToken } from "@/lib/jwt-auth";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(1, "A senha é obrigatória."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues?.[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        tenant: true,
        accessGroup: true,
      },
    });

    let senhaValida = false;

    if (user && user.active && !user.deletedAt) {
      senhaValida = await bcrypt.compare(password, user.password);
    } else {
      // Mitigação de timing attacks: hash dummy
      await bcrypt.compare(
        password,
        "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa"
      );
    }

    if (!user || !senhaValida) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // Assina token JWT
    const token = await signJwtToken({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      scope: "user",
    });

    const userContextData = {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      accessGroup: user.accessGroup?.name ?? null,
      permissions: (user.accessGroup?.permissions as Record<string, string[]>) ?? {},
    };

    const userContextBase64 = Buffer.from(
      JSON.stringify(userContextData)
    ).toString("base64");

    const cookieStore = await cookies();

    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    cookieStore.set("user_context", userContextBase64, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar o login. Tente novamente." },
      { status: 500 }
    );
  }
}
