import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { NtMReport } from "@/lib/pdf-report";

export const maxDuration = 30;

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let result;

    if (body.checkId) {
      const check = await prisma.check.findUnique({
        where: { id: body.checkId },
      });
      if (!check || check.userId !== session.user.id) {
        return Response.json({ error: "Check not found" }, { status: 404 });
      }
      result = check.results;
    } else if (body.result) {
      result = body.result;
    } else {
      return Response.json({ error: "No result data provided" }, { status: 400 });
    }

    const buffer = await renderToBuffer(
      NtMReport({
        result,
        userName: session.user.name || session.user.email,
        generatedAt: new Date().toISOString(),
      })
    );

    const week = String(result.weekInfo?.week || 0).padStart(2, "0");
    const year = result.weekInfo?.year || "unknown";

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="NtM-Report-Wk${week}-${year}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return Response.json(
      { error: "PDF generation failed", message: error.message },
      { status: 500 }
    );
  }
}
