"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/app/generated/prisma/client";
import { logAudit } from "@/lib/admin/audit";
import type { AdminFormState } from "@/lib/admin/forms";
import { reconcileAdminRole } from "@/lib/admin/roles";
import { requireSuperAdmin } from "@/lib/admin/guards";
import { slugify, withSuffix } from "@/lib/admin/slug";
import { prisma } from "@/lib/db";

const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createCompany(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const session = await requireSuperAdmin();
  const name = text(formData, "name");
  const description = text(formData, "description") || null;

  if (name.length < 2) {
    return { status: "error", message: "The company name is too short." };
  }

  const baseSlug = slugify(name);
  let company: { id: string; name: string; slug: string } | null = null;

  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug =
        attempt === 0 ? baseSlug : withSuffix(baseSlug, attempt + 1);

      try {
        company = await prisma.company.create({
          data: { name, slug, description },
          select: { id: true, name: true, slug: true },
        });
        break;
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  if (!company) {
    return {
      status: "error",
      message: "Could not build a unique URL for this company.",
    };
  }

  await logAudit({
    eventId: null,
    eventName: null,
    companyId: company.id,
    companyName: company.name,
    actor: session.user,
    action: "company.created",
    entityType: "company",
    entityId: company.id,
    summary: `Created the company “${company.name}”.`,
  });

  revalidatePath("/super-admin");

  return { status: "success", message: `Company “${company.name}” created.` };
}

export async function addCompanyAdmin(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const session = await requireSuperAdmin();
  const companyId = text(formData, "companyId");
  const email = text(formData, "email").toLowerCase();

  if (!email) {
    return { status: "error", message: "Enter the account email." };
  }

  const [company, user] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    }),
    prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, role: true },
    }),
  ]);

  if (!company) {
    return { status: "error", message: "That company no longer exists." };
  }

  if (!user) {
    return {
      status: "error",
      message: "No account uses that email. The user must sign up first.",
    };
  }

  const existing = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: { companyId: company.id, userId: user.id },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      status: "error",
      message: `${user.name} already administers ${company.name}.`,
    };
  }

  try {
    if (user.role === "ATTENDEE") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
    }

    await prisma.companyMember.create({
      data: { companyId: company.id, userId: user.id },
    });

    await logAudit({
      eventId: null,
      eventName: null,
      companyId: company.id,
      companyName: company.name,
      actor: session.user,
      action: "company.admin_added",
      entityType: "companyMember",
      entityId: user.id,
      summary: `Added ${user.name} as an admin of ${company.name}.`,
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  revalidatePath("/super-admin");

  return {
    status: "success",
    message: `${user.name} now administers ${company.name}.`,
  };
}

export async function removeCompanyAdmin(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const session = await requireSuperAdmin();
  const companyId = text(formData, "companyId");
  const userId = text(formData, "userId");

  const [company, user, membership] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    }),
    prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId } },
      select: { id: true },
    }),
  ]);

  if (!company || !user || !membership) {
    return { status: "error", message: "That membership no longer exists." };
  }

  try {
    await prisma.companyMember.delete({ where: { id: membership.id } });
    await reconcileAdminRole(user.id);

    await logAudit({
      eventId: null,
      eventName: null,
      companyId: company.id,
      companyName: company.name,
      actor: session.user,
      action: "company.admin_removed",
      entityType: "companyMember",
      entityId: user.id,
      summary: `Removed ${user.name} as an admin of ${company.name}.`,
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  revalidatePath("/super-admin");

  return {
    status: "success",
    message: `${user.name} no longer administers ${company.name}.`,
  };
}
