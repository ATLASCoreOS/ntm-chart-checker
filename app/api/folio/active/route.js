import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folioId } = await request.json();

  const folio = await prisma.chartFolio.findFirst({
    where: { id: folioId, userId: session.user.id },
  });
  if (!folio) {
    return NextResponse.json({ error: "Folio not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeFolioId: folioId },
  });

  return NextResponse.json({ activeFolioId: folioId });
}
