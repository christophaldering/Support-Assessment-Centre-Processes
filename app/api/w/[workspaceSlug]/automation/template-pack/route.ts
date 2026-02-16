import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasAnyPermission } from "@/lib/rbac";
import { getUploadUrl, getSignedDownloadUrl } from "@/lib/object-storage";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageBreak,
  SectionType,
} from "docx";

interface RouteContext {
  params: { workspaceSlug: string };
}

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
}

interface BrandRules {
  colors?: BrandColors;
  typography?: { headingFont?: string; bodyFont?: string; headingSize?: string; bodySize?: string };
  documentRules?: { coverPage?: boolean; headerFooter?: string; confidentialityNote?: string; pageNumbers?: boolean; watermark?: string };
  logoPlacement?: { position?: string; maxHeight?: string };
}

interface ExerciseContent {
  title: string;
  exerciseType: string;
  scenario?: string;
  instructions?: string;
  evaluationCriteria?: string[];
  observerSheet?: string;
  candidateInstructions?: string;
  duration?: number;
  difficulty?: string;
}

function hexColor(color?: string): string | undefined {
  return color?.replace("#", "") || undefined;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function buildExerciseDocx(
  exercises: ExerciseContent[],
  brandRules: BrandRules | null,
  workspaceName: string,
  packTitle: string,
  includeObserverSheets: boolean,
  includeCandidateInstructions: boolean
): Document {
  const colors = brandRules?.colors;
  const primaryColor = hexColor(colors?.primary) || "1a365d";
  const secondaryColor = hexColor(colors?.secondary) || primaryColor;
  const accentColor = hexColor(colors?.accent) || "3182ce";

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: accentColor,
  };
  const cellBorders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const sectionHeaders: Record<string, unknown> = {};
  const sectionFooters: Record<string, unknown> = {};

  if (brandRules?.documentRules?.headerFooter) {
    sectionHeaders["default"] = new Header({
      children: [
        new Paragraph({
          children: [new TextRun({ text: brandRules.documentRules.headerFooter, size: 16, italics: true, color: primaryColor })],
          alignment: AlignmentType.RIGHT,
        }),
      ],
    });
  }

  if (brandRules?.documentRules?.confidentialityNote) {
    sectionFooters["default"] = new Footer({
      children: [
        new Paragraph({
          children: [new TextRun({ text: brandRules.documentRules.confidentialityNote, size: 14, italics: true, color: "999999" })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });
  }

  const docSections: Array<Record<string, unknown>> = [];

  const coverChildren: Paragraph[] = [
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [new TextRun({ text: packTitle, bold: true, size: 52, color: primaryColor })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [new TextRun({ text: "Übungsmaterialien", size: 36, color: secondaryColor })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [new TextRun({ text: workspaceName, size: 24 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: formatDate(new Date()), size: 24 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: `${exercises.length} Übungen enthalten`, size: 20, italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
    }),
  ];

  if (brandRules?.typography?.headingFont) {
    coverChildren.push(
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [new TextRun({ text: `Schriftart: ${brandRules.typography.headingFont}`, size: 16, italics: true, color: "AAAAAA" })],
        alignment: AlignmentType.CENTER,
      })
    );
  }

  docSections.push({
    properties: { type: SectionType.NEXT_PAGE },
    headers: sectionHeaders,
    footers: sectionFooters,
    children: coverChildren,
  });

  for (const exercise of exercises) {
    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        children: [new TextRun({ text: exercise.title, bold: true, size: 32, color: primaryColor })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
      })
    );

    const metaLine = [
      exercise.exerciseType && `Typ: ${exercise.exerciseType}`,
      exercise.duration && `Dauer: ${exercise.duration} Min.`,
      exercise.difficulty && `Schwierigkeit: ${exercise.difficulty}`,
    ].filter(Boolean).join(" | ");

    if (metaLine) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: metaLine, size: 18, italics: true, color: "666666" })],
        })
      );
    }
    children.push(new Paragraph({ text: "" }));

    if (exercise.scenario) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Szenario", bold: true, size: 24, color: secondaryColor })],
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ children: [new TextRun({ text: exercise.scenario, size: 20 })] }),
        new Paragraph({ text: "" })
      );
    }

    if (exercise.instructions && includeCandidateInstructions) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Anweisungen", bold: true, size: 24, color: secondaryColor })],
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ children: [new TextRun({ text: exercise.instructions, size: 20 })] }),
        new Paragraph({ text: "" })
      );
    }

    if (exercise.candidateInstructions && includeCandidateInstructions) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Kandidaten-Anweisungen", bold: true, size: 24, color: secondaryColor })],
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ children: [new TextRun({ text: exercise.candidateInstructions, size: 20 })] }),
        new Paragraph({ text: "" })
      );
    }

    if (exercise.evaluationCriteria && exercise.evaluationCriteria.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Bewertungskriterien", bold: true, size: 24, color: secondaryColor })],
          heading: HeadingLevel.HEADING_2,
        })
      );

      const criteriaRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true, size: 18, color: "FFFFFF" })] })],
              borders: cellBorders,
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { fill: primaryColor },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Kriterium", bold: true, size: 18, color: "FFFFFF" })] })],
              borders: cellBorders,
              width: { size: 90, type: WidthType.PERCENTAGE },
              shading: { fill: primaryColor },
            }),
          ],
        }),
        ...exercise.evaluationCriteria.map((criterion, idx) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${idx + 1}`, size: 18 })] })],
                borders: cellBorders,
                width: { size: 10, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: criterion, size: 18 })] })],
                borders: cellBorders,
                width: { size: 90, type: WidthType.PERCENTAGE },
              }),
            ],
          })
        ),
      ];

      children.push(
        new Table({
          rows: criteriaRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
      children.push(new Paragraph({ text: "" }));
    }

    if (exercise.observerSheet && includeObserverSheets) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Beobachtungsbogen", bold: true, size: 24, color: secondaryColor })],
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ children: [new TextRun({ text: exercise.observerSheet, size: 20 })] }),
        new Paragraph({ text: "" })
      );

      const ratingTable = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Kompetenz", bold: true, size: 18, color: "FFFFFF" })] })],
                borders: cellBorders,
                width: { size: 40, type: WidthType.PERCENTAGE },
                shading: { fill: primaryColor },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Bewertung", bold: true, size: 18, color: "FFFFFF" })] })],
                borders: cellBorders,
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { fill: primaryColor },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Beobachtungen / Evidenz", bold: true, size: 18, color: "FFFFFF" })] })],
                borders: cellBorders,
                width: { size: 40, type: WidthType.PERCENTAGE },
                shading: { fill: primaryColor },
              }),
            ],
          }),
          ...Array.from({ length: 5 }, () =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "", size: 18 })] })],
                  borders: cellBorders,
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "", size: 18 })] })],
                  borders: cellBorders,
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "", size: 18 })] })],
                  borders: cellBorders,
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
              ],
            })
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });
      children.push(ratingTable);
      children.push(new Paragraph({ text: "" }));
    }

    docSections.push({
      properties: { type: SectionType.NEXT_PAGE },
      headers: sectionHeaders,
      footers: sectionFooters,
      children,
    });
  }

  return new Document({
    sections: docSections as any,
  });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasAnyPermission(session.roles, ["exerciselibrary.manage", "assessments.read"])) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const body = await req.json();
    const {
      assessmentId,
      exerciseItemIds,
      brandRuleSetId,
      format = "docx",
      includeObserverSheets = true,
      includeCandidateInstructions = true,
    } = body;

    if (format !== "docx") {
      return NextResponse.json({ error: "Nur DOCX-Format wird unterstützt" }, { status: 400 });
    }

    if (!assessmentId && (!exerciseItemIds || exerciseItemIds.length === 0)) {
      return NextResponse.json(
        { error: "assessmentId oder exerciseItemIds sind erforderlich" },
        { status: 400 }
      );
    }

    let brandRuleSet = null;
    if (brandRuleSetId) {
      brandRuleSet = await prisma.brandRuleSet.findFirst({
        where: { id: brandRuleSetId, workspaceId: workspace.id },
      });
    } else {
      brandRuleSet = await prisma.brandRuleSet.findFirst({
        where: { workspaceId: workspace.id, status: "active" },
        orderBy: { updatedAt: "desc" },
      });
    }

    const brandRules: BrandRules | null = brandRuleSet
      ? (brandRuleSet.rulesJson as BrandRules)
      : null;

    const exerciseContents: ExerciseContent[] = [];

    if (assessmentId) {
      const assessment = await prisma.assessment.findFirst({
        where: { id: assessmentId, workspaceId: workspace.id },
        include: { exercises: { orderBy: { sortOrder: "asc" } } },
      });

      if (!assessment) {
        return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
      }

      for (const exercise of assessment.exercises) {
        exerciseContents.push({
          title: exercise.name,
          exerciseType: exercise.type,
          instructions: exercise.instructions || undefined,
          duration: exercise.duration || undefined,
          difficulty: exercise.difficultyLevel || undefined,
        });
      }
    } else if (exerciseItemIds && exerciseItemIds.length > 0) {
      const libraryItems = await prisma.exerciseLibraryItem.findMany({
        where: {
          id: { in: exerciseItemIds },
          workspaceId: workspace.id,
        },
        include: {
          variants: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      for (const item of libraryItems) {
        const adaptedVariant = item.variants.find((v) => v.variantType === "cd_adapted");
        const originalVariant = item.variants.find((v) => v.variantType === "original");
        const bestVariant = adaptedVariant || originalVariant || item.variants[0];

        const content = bestVariant?.contentJson as Record<string, unknown> | null;

        exerciseContents.push({
          title: item.title,
          exerciseType: item.exerciseType,
          scenario: (content?.scenario as string) || undefined,
          instructions: (content?.instructions as string) || undefined,
          evaluationCriteria: (content?.evaluationCriteria as string[]) || undefined,
          observerSheet: (content?.observerSheet as string) || undefined,
          candidateInstructions: (content?.candidateInstructions as string) || undefined,
          duration: (content?.duration as number) || undefined,
          difficulty: (content?.difficulty as string) || undefined,
        });
      }
    }

    if (exerciseContents.length === 0) {
      return NextResponse.json({ error: "Keine Übungen gefunden" }, { status: 404 });
    }

    const packTitle = assessmentId
      ? `Übungspaket`
      : `Übungsmaterialien (${exerciseContents.length} Übungen)`;

    const doc = buildExerciseDocx(
      exerciseContents,
      brandRules,
      workspace.name,
      packTitle,
      includeObserverSheets,
      includeCandidateInstructions
    );

    const buffer = await Packer.toBuffer(doc);
    const fileBuffer = Buffer.from(buffer);

    const { uploadURL, objectPath } = await getUploadUrl();

    await fetch(uploadURL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      body: fileBuffer,
    });

    const downloadUrl = await getSignedDownloadUrl(objectPath);

    const generatedAt = new Date().toISOString();

    return NextResponse.json({
      downloadUrl,
      objectPath,
      exerciseCount: exerciseContents.length,
      format: "docx",
      brandApplied: !!brandRuleSet,
      generatedAt,
    });
  } catch (err) {
    console.error("Template pack generation failed:", err);
    return NextResponse.json(
      { error: "Materialpaket-Erstellung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
