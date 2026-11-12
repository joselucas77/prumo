import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { signJwtToken } from "@/lib/jwt-auth";

const registerSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues?.[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Verifica se já existe um usuário com o mesmo e-mail
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail." },
        { status: 409 }
      );
    }

    // Criptografa a senha com bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria Workspace/Tenant pessoal e o Usuário de forma atômica
    const tenant = await prisma.tenant.create({
      data: {
        name: `Espaço de ${name}`,
      },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        tenantId: tenant.id,
      },
      include: {
        tenant: true,
      },
    });

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
      accessGroup: null,
      permissions: {},
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

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro na criação de conta:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao criar a conta. Tente novamente." },
      { status: 500 }
    );
  }
}
