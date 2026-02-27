import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateCharts, DEFAULT_CHARTS } from "@/lib/charts";
import { MAX_CHARTS, MAX_FOLIOS } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activeFolioId: true },
  });

  let folios = await prisma.chartFolio.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  // Create default folio if none exists
  if (folios.length === 0) {
    const newFolio = await prisma.chartFolio.create({
      data: {
        userId: session.user.id,
        vesselName: "My Vessel",
        charts: DEFAULT_CHARTS,
      },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { activeFolioId: newFolio.id },
    });
    folios = [newFolio];
  }

  // Ensure activeFolioId is valid
  let activeFolioId = user?.activeFolioId;
  if (!activeFolioId || !folios.find((f) => f.id === activeFolioId)) {
    activeFolioId = folios[0].id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { activeFolioId },
    });
  }

  return NextResponse.json({
    folios: folios.map((f) => ({
      id: f.id,
      vesselName: f.vesselName,
      charts: f.charts,
      updatedAt: f.updatedAt,
    })),
    activeFolioId,
  });
}

export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folioId, charts, vesselName } = await request.json();

  if (!folioId) {
    return NextResponse.json({ error: "folioId required" }, { status: 400 });
  }

  const existing = await prisma.chartFolio.findFirst({
    where: { id: folioId, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Folio not found" }, { status: 404 });
  }

  const updateData = {};

  if (charts !== undefined) {
    const validated = validateCharts(charts);
    if (validated.length > MAX_CHARTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_CHARTS} charts allowed` },
        { status: 400 }
      );
    }
    updateData.charts = validated;
  }

  if (vesselName !== undefined) {
    const trimmed = vesselName.trim().slice(0, 100);
    if (!trimmed) {
      return NextResponse.json(
        { error: "Vessel name cannot be empty" },
        { status: 400 }
      );
    }
    updateData.vesselName = trimmed;
  }

  const folio = await prisma.chartFolio.update({
    where: { id: folioId },
    data: updateData,
  });

  return NextResponse.json({
    id: folio.id,
    vesselName: folio.vesselName,
    charts: folio.charts,
    updatedAt: folio.updatedAt,
  });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vesselName, charts } = await request.json();

  const count = await prisma.chartFolio.count({
    where: { userId: session.user.id },
  });
  if (count >= MAX_FOLIOS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FOLIOS} vessel folios allowed` },
      { status: 400 }
    );
  }

  const trimmedName = (vesselName || "").trim().slice(0, 100) || "New Vessel";
  const validated = validateCharts(charts || []);

  const folio = await prisma.chartFolio.create({
    data: {
      userId: session.user.id,
      vesselName: trimmedName,
      charts: validated,
    },
  });

  // Auto-switch to the new folio
  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeFolioId: folio.id },
  });

  return NextResponse.json(
    {
      id: folio.id,
      vesselName: folio.vesselName,
      charts: folio.charts,
      updatedAt: folio.updatedAt,
    },
    { status: 201 }
  );
}

export async function DELETE(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folioId } = await request.json();
  if (!folioId) {
    return NextResponse.json({ error: "folioId required" }, { status: 400 });
  }

  const existing = await prisma.chartFolio.findFirst({
    where: { id: folioId, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Folio not found" }, { status: 404 });
  }

  const count = await prisma.chartFolio.count({
    where: { userId: session.user.id },
  });
  if (count <= 1) {
    return NextResponse.json(
      { error: "Cannot delete your only vessel folio" },
      { status: 400 }
    );
  }

  await prisma.chartFolio.delete({ where: { id: folioId } });

  // If the deleted folio was active, switch to another
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activeFolioId: true },
  });
  let newActiveFolioId = user?.activeFolioId;

  if (newActiveFolioId === folioId) {
    const next = await prisma.chartFolio.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
    newActiveFolioId = next.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { activeFolioId: next.id },
    });
  }

  return NextResponse.json({ ok: true, activeFolioId: newActiveFolioId });
}
