import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ studyId: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { studyId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID unavailable" },
        { status: 401 }
      );
    }

    const study = await prisma.study.findFirst({
      where: {
        id: studyId,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!study) {
      return NextResponse.json(
        { error: "Study not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Require confirmation of the exact study name.
    if (body.confirmStudyName !== study.name) {
      return NextResponse.json(
        { error: "Study confirmation does not match" },
        { status: 400 }
      );
    }

    // Cascade deletes related categories,
    // card placements, and action logs.
    const result = await prisma.participantSession.deleteMany({
      where: { studyId },
    });

    return NextResponse.json({
      success: true,
      deletedResponses: result.count,
      studyId,
    });
  } catch (error) {
    console.error("Reset responses error:", error);

    return NextResponse.json(
      { error: "Failed to reset responses" },
      { status: 500 }
    );
  }
}
