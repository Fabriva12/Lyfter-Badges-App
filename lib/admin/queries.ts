// Admin data access. These queries are scoped to one organizer or one partner
// and must NOT be cached: `unstable_cache` would share one actor's payload with
// every other actor. Only the public gamification queries are cached.

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  bucketScansByHour,
  type HourBucket,
} from "./metrics";

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
}

/** Companies this administrator belongs to through `CompanyMember`. */
export async function getAdminCompanies(
  userId: string,
): Promise<AdminCompany[]> {
  const memberships = await prisma.companyMember.findMany({
    where: { userId },
    orderBy: { company: { name: "asc" } },
    select: {
      company: { select: { id: true, name: true, slug: true } },
    },
  });

  return memberships.map((membership) => membership.company);
}

export interface SuperAdminMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SuperAdminCompany extends AdminCompany {
  members: SuperAdminMember[];
  events: number;
}

/** Every company on the platform with its administrators. */
export async function getAllCompanies(): Promise<SuperAdminCompany[]> {
  return prisma.company
    .findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        members: {
          orderBy: { user: { name: "asc" } },
          select: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        _count: { select: { events: true } },
      },
    })
    .then((companies) =>
      companies.map((company) => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        members: company.members.map((membership) => membership.user),
        events: company._count.events,
      })),
    );
}

export interface CompanyEventSummary {
  id: string;
  name: string;
  slug: string;
  companyId: string | null;
  companyName: string | null;
  location: string | null;
  country: string | null;
  mode: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  badges: number;
  attendees: number;
  scans: number;
}

/** Events owned by any of the given companies, newest first. */
export async function getCompanyEventSummaries(
  companyIds: string[],
): Promise<CompanyEventSummary[]> {
  if (companyIds.length === 0) {
    return [];
  }

  return prisma.event
    .findMany({
      where: { companyId: { in: companyIds } },
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        companyId: true,
        company: { select: { name: true } },
        location: true,
        country: true,
        mode: true,
        status: true,
        startsAt: true,
        endsAt: true,
        _count: {
          select: { badges: true, registrations: true, scans: true },
        },
      },
    })
    .then((events) =>
      events.map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        companyId: event.companyId,
        companyName: event.company?.name ?? null,
        location: event.location,
        country: event.country,
        mode: event.mode,
        status: event.status,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        badges: event._count.badges,
        attendees: event._count.registrations,
        scans: event._count.scans,
      })),
    );
}

/** Every event on the platform, for the super admin overview. */
export async function getAllEventSummaries(): Promise<CompanyEventSummary[]> {
  return prisma.event
    .findMany({
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        companyId: true,
        company: { select: { name: true } },
        location: true,
        country: true,
        mode: true,
        status: true,
        startsAt: true,
        endsAt: true,
        _count: {
          select: { badges: true, registrations: true, scans: true },
        },
      },
    })
    .then((events) =>
      events.map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        companyId: event.companyId,
        companyName: event.company?.name ?? null,
        location: event.location,
        country: event.country,
        mode: event.mode,
        status: event.status,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        badges: event._count.badges,
        attendees: event._count.registrations,
        scans: event._count.scans,
      })),
    );
}

export interface StandSummary {
  id: string;
  room: string | null;
  badgeName: string;
  xpValue: number;
  eventName: string;
  eventSlug: string;
  startsAt: Date;
  endsAt: Date;
  scans: number;
  visitors: number;
}

/** Stands assigned to one administrator, newest event first. */
export async function getStandSummaries(
  partnerId: string,
): Promise<StandSummary[]> {
  const stands = await prisma.eventBadge.findMany({
    where: { partnerId },
    orderBy: { event: { startsAt: "desc" } },
    select: {
      id: true,
      room: true,
      badge: { select: { name: true, xpValue: true } },
      event: {
        select: { name: true, slug: true, startsAt: true, endsAt: true },
      },
      _count: { select: { qrTokens: true } },
    },
  });

  return Promise.all(
    stands.map(async (stand) => {
      const [scans, visitors] = await Promise.all([
        prisma.scan.count({ where: { eventBadgeId: stand.id } }),
        prisma.scan.groupBy({
          by: ["userId"],
          where: { eventBadgeId: stand.id },
        }),
      ]);

      return {
        id: stand.id,
        room: stand.room,
        badgeName: stand.badge.name,
        xpValue: stand.badge.xpValue,
        eventName: stand.event.name,
        eventSlug: stand.event.slug,
        startsAt: stand.event.startsAt,
        endsAt: stand.event.endsAt,
        scans,
        visitors: visitors.length,
      } satisfies StandSummary;
    }),
  );
}

export interface EventMetrics {
  badges: number;
  attendees: number;
  scans: number;
  activeTokens: number;
  xpAwarded: number;
}

/** Headline counters for the organizer overview of one event. */
export async function getEventMetrics(eventId: string): Promise<EventMetrics> {
  const [badges, attendees, scans, activeTokens, xp] = await Promise.all([
    prisma.eventBadge.count({ where: { eventId } }),
    prisma.registration.count({ where: { eventId } }),
    prisma.scan.count({ where: { eventId } }),
    prisma.qrToken.count({ where: { eventId, active: true } }),
    prisma.scan.aggregate({
      where: { eventId },
      _sum: { xpAwarded: true },
    }),
  ]);

  return {
    badges,
    attendees,
    scans,
    activeTokens,
    xpAwarded: xp._sum.xpAwarded ?? 0,
  };
}

export interface BadgeVisit {
  eventBadgeId: string;
  name: string;
  type: string;
  rarity: string;
  iconKey: string | null;
  room: string | null;
  scans: number;
}

export interface EventMetricsDetail {
  totalScans: number;
  attendees: number;
  attendeesWithScans: number;
  badges: number;
  xpAwarded: number;
  hourly: HourBucket[];
  topBadges: BadgeVisit[];
  byType: Record<string, number>;
}

/**
 * Event dashboard data: most visited badges, hourly traffic and the headline
 * counters. Grouping happens in the database; the hour bucketing is the pure
 * part in `metrics.ts`.
 */
export async function getEventMetricsDetail(
  eventId: string,
): Promise<EventMetricsDetail> {
  const [grouped, eventBadges, timestamps, attendees, scans, badges, xp] =
    await Promise.all([
      prisma.scan.groupBy({
        by: ["eventBadgeId"],
        where: { eventId },
        _count: { _all: true },
      }),
      prisma.eventBadge.findMany({
        where: { eventId },
        select: {
          id: true,
          room: true,
          badge: {
            select: { name: true, type: true, rarity: true, iconKey: true },
          },
        },
      }),
      prisma.scan.findMany({
        where: { eventId },
        select: { scannedAt: true },
      }),
      prisma.registration.count({ where: { eventId } }),
      prisma.scan.count({ where: { eventId } }),
      prisma.eventBadge.count({ where: { eventId } }),
      prisma.scan.aggregate({
        where: { eventId },
        _sum: { xpAwarded: true },
      }),
    ]);

  const scanCountByBadge = new Map(
    grouped.map((group) => [group.eventBadgeId, group._count._all]),
  );

  const topBadges: BadgeVisit[] = eventBadges
    .map((eventBadge) => ({
      eventBadgeId: eventBadge.id,
      name: eventBadge.badge.name,
      type: eventBadge.badge.type,
      rarity: eventBadge.badge.rarity,
      iconKey: eventBadge.badge.iconKey,
      room: eventBadge.room,
      scans: scanCountByBadge.get(eventBadge.id) ?? 0,
    }))
    .sort((a, b) => b.scans - a.scans);

  const byType: Record<string, number> = {};

  for (const badge of topBadges) {
    byType[badge.type] = (byType[badge.type] ?? 0) + badge.scans;
  }

  const attendeesWithScans = await prisma.scan
    .groupBy({ by: ["userId"], where: { eventId } })
    .then((rows) => rows.length);

  return {
    totalScans: scans,
    attendees,
    attendeesWithScans,
    badges,
    xpAwarded: xp._sum.xpAwarded ?? 0,
    hourly: bucketScansByHour(timestamps.map((row) => row.scannedAt)),
    topBadges,
    byType,
  };
}

export interface EventAuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  actorName: string;
  actorRole: string | null;
  createdAt: Date;
}

/** Audit trail of one event, newest first. */
export async function getEventAuditLogs(
  eventId: string,
  take = 200,
): Promise<EventAuditRow[]> {
  return prisma.auditLog.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      summary: true,
      actorName: true,
      actorRole: true,
      createdAt: true,
    },
  });
}

export interface RecentScan {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  badgeName: string;
  xpAwarded: number;
  scannedAt: Date;
}

/** Last scans of one event, newest first. */
export async function getRecentEventScans(
  eventId: string,
  take = 10,
): Promise<RecentScan[]> {
  const scans = await prisma.scan.findMany({
    where: { eventId },
    orderBy: { scannedAt: "desc" },
    take,
    select: {
      id: true,
      xpAwarded: true,
      scannedAt: true,
      user: { select: { name: true, email: true } },
      eventBadge: {
        select: { badge: { select: { name: true } } },
      },
    },
  });

  return scans.map((scan) => ({
    id: scan.id,
    attendeeName: scan.user.name,
    attendeeEmail: scan.user.email,
    badgeName: scan.eventBadge.badge.name,
    xpAwarded: scan.xpAwarded,
    scannedAt: scan.scannedAt,
  }));
}

export interface EventScanPage {
  rows: RecentScan[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}

/** Paginated scan log, optionally filtered by attendee or badge name. */
export async function getEventScans(
  eventId: string,
  options: { page?: number; pageSize?: number; query?: string } = {},
): Promise<EventScanPage> {
  const pageSize = Math.min(Math.max(options.pageSize ?? 25, 1), 100);
  const query = options.query?.trim() ?? "";
  const requestedPage = Math.max(options.page ?? 1, 1);

  const where: Prisma.ScanWhereInput = {
    eventId,
    ...(query
      ? {
          OR: [
            { user: { name: { contains: query, mode: "insensitive" } } },
            { user: { email: { contains: query, mode: "insensitive" } } },
            {
              eventBadge: {
                badge: { name: { contains: query, mode: "insensitive" } },
              },
            },
          ],
        }
      : {}),
  };

  const total = await prisma.scan.count({ where });
  const maxPage = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(requestedPage, maxPage);

  const scans = await prisma.scan.findMany({
    where,
    orderBy: { scannedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      xpAwarded: true,
      scannedAt: true,
      user: { select: { name: true, email: true } },
      eventBadge: {
        select: { badge: { select: { name: true } } },
      },
    },
  });

  return {
    rows: scans.map((scan) => ({
      id: scan.id,
      attendeeName: scan.user.name,
      attendeeEmail: scan.user.email,
      badgeName: scan.eventBadge.badge.name,
      xpAwarded: scan.xpAwarded,
      scannedAt: scan.scannedAt,
    })),
    total,
    page,
    pageSize,
    query,
  };
}

export interface AttendeeBadge {
  eventBadgeId: string;
  name: string;
  xpValue: number;
  scannedAt: Date;
}

export interface EventAttendee {
  userId: string;
  name: string;
  email: string;
  registeredAt: Date;
  badges: AttendeeBadge[];
  xpEarned: number;
}

/** Every registered attendee of one event plus the badges they redeemed. */
export async function getEventAttendees(
  eventId: string,
): Promise<EventAttendee[]> {
  const [registrations, scans] = await Promise.all([
    prisma.registration.findMany({
      where: { eventId },
      orderBy: { user: { name: "asc" } },
      select: {
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.scan.findMany({
      where: { eventId },
      orderBy: { scannedAt: "asc" },
      select: {
        userId: true,
        eventBadgeId: true,
        xpAwarded: true,
        scannedAt: true,
        eventBadge: {
          select: { badge: { select: { name: true, xpValue: true } } },
        },
      },
    }),
  ]);

  const scansByUser = new Map<string, AttendeeBadge[]>();

  for (const scan of scans) {
    const list = scansByUser.get(scan.userId) ?? [];

    list.push({
      eventBadgeId: scan.eventBadgeId,
      name: scan.eventBadge.badge.name,
      xpValue: scan.eventBadge.badge.xpValue,
      scannedAt: scan.scannedAt,
    });

    scansByUser.set(scan.userId, list);
  }

  return registrations.map((registration) => {
    const badges = scansByUser.get(registration.user.id) ?? [];

    return {
      userId: registration.user.id,
      name: registration.user.name,
      email: registration.user.email,
      registeredAt: registration.createdAt,
      badges,
      xpEarned: badges.reduce((total, badge) => total + badge.xpValue, 0),
    };
  });
}

export interface AdminToken {
  id: string;
  token: string;
  kind: "WELCOME" | "BADGE";
  active: boolean;
  maxScans: number | null;
  scans: number;
}

export interface AdminBadge {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  iconKey: string | null;
  type: string;
  rarity: string;
  xpValue: number;
  room: string | null;
  startsAt: Date | null;
  partner: { id: string; name: string; email: string } | null;
  tokens: AdminToken[];
  scans: number;
}

function toAdminTokens(
  tokens: Array<{
    id: string;
    token: string;
    kind: "WELCOME" | "BADGE";
    active: boolean;
    maxScans: number | null;
    _count: { scans: number };
  }>,
): AdminToken[] {
  return tokens.map((token) => ({
    id: token.id,
    token: token.token,
    kind: token.kind,
    active: token.active,
    maxScans: token.maxScans,
    scans: token._count.scans,
  }));
}

/** Badges enabled for one event, with their partner and physical QR tokens. */
export async function getEventBadgesAdmin(
  eventId: string,
): Promise<AdminBadge[]> {
  const badges = await prisma.eventBadge.findMany({
    where: { eventId },
    orderBy: { badge: { name: "asc" } },
    select: {
      id: true,
      room: true,
      startsAt: true,
      badge: {
        select: {
          name: true,
          description: true,
          imageUrl: true,
          iconKey: true,
          type: true,
          rarity: true,
          xpValue: true,
        },
      },
      partner: { select: { id: true, name: true, email: true } },
      qrTokens: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          token: true,
          kind: true,
          active: true,
          maxScans: true,
          _count: { select: { scans: true } },
        },
      },
    },
  });

  return badges.map((eventBadge) => {
    const tokens = toAdminTokens(eventBadge.qrTokens);

    return {
      id: eventBadge.id,
      name: eventBadge.badge.name,
      description: eventBadge.badge.description,
      imageUrl: eventBadge.badge.imageUrl,
      iconKey: eventBadge.badge.iconKey,
      type: eventBadge.badge.type,
      rarity: eventBadge.badge.rarity,
      xpValue: eventBadge.badge.xpValue,
      room: eventBadge.room,
      startsAt: eventBadge.startsAt,
      partner: eventBadge.partner,
      tokens,
      scans: tokens.reduce((total, token) => total + token.scans, 0),
    } satisfies AdminBadge;
  });
}

/** Welcome QR tokens of one event. They check in, they do not award XP. */
export async function getWelcomeTokens(eventId: string): Promise<AdminToken[]> {
  const tokens = await prisma.qrToken.findMany({
    where: { eventId, kind: "WELCOME" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      token: true,
      kind: true,
      active: true,
      maxScans: true,
      _count: { select: { scans: true } },
    },
  });

  return toAdminTokens(tokens);
}

/** Names already in the badge catalog, so the organizer can reuse them. */
export async function getBadgeCatalog() {
  return prisma.badge.findMany({
    orderBy: { name: "asc" },
    select: { name: true, xpValue: true },
  });
}

/** Admin accounts that can be assigned to a stand. */
export async function getStandPartnerOptions() {
  return prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

export interface AdminPrize {
  name: string;
  description: string | null;
  imageUrl: string | null;
  requiredBadgesCount: number;
  revealedAt: Date | null;
}

/** Prize of one event plus the number of badges the requirement is checked
 * against. Admin-only: unlike the attendee payload, there is no secrecy here. */
export async function getPrizeAdmin(eventId: string) {
  const [prize, badgeCount] = await Promise.all([
    prisma.prize.findUnique({
      where: { eventId },
      select: {
        name: true,
        description: true,
        imageUrl: true,
        requiredBadgesCount: true,
        revealedAt: true,
      },
    }),
    prisma.eventBadge.count({ where: { eventId } }),
  ]);

  return { prize, badgeCount };
}

export interface StandVisit {
  id: string;
  attendeeName: string;
  scannedAt: Date;
}

export interface StandDetail {
  id: string;
  room: string | null;
  startsAt: Date | null;
  badge: {
    name: string;
    description: string | null;
    imageUrl: string | null;
    xpValue: number;
  };
  event: {
    name: string;
    slug: string;
    location: string | null;
    startsAt: Date;
    endsAt: Date;
  };
  tokens: AdminToken[];
  scans: number;
  visitors: number;
  lastScanAt: Date | null;
  visits: StandVisit[];
}

/**
 * Everything a partner may see about their own stand. No attendee emails and
 * no data from the rest of the event: the guard decided the partner owns this
 * badge, and this query stays inside it.
 */
export async function getStandDetail(
  eventBadgeId: string,
): Promise<StandDetail | null> {
  const stand = await prisma.eventBadge.findUnique({
    where: { id: eventBadgeId },
    select: {
      id: true,
      room: true,
      startsAt: true,
      badge: {
        select: {
          name: true,
          description: true,
          imageUrl: true,
          xpValue: true,
        },
      },
      event: {
        select: {
          name: true,
          slug: true,
          location: true,
          startsAt: true,
          endsAt: true,
        },
      },
      qrTokens: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          token: true,
          kind: true,
          active: true,
          maxScans: true,
          _count: { select: { scans: true } },
        },
      },
    },
  });

  if (!stand) {
    return null;
  }

  const standScans = { eventBadgeId: stand.id };

  const [scans, visitors, visits] = await Promise.all([
    prisma.scan.count({ where: standScans }),
    prisma.scan.groupBy({ by: ["userId"], where: standScans }),
    prisma.scan.findMany({
      where: standScans,
      orderBy: { scannedAt: "desc" },
      take: 10,
      select: {
        id: true,
        scannedAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  const tokens = toAdminTokens(stand.qrTokens);

  return {
    id: stand.id,
    room: stand.room,
    startsAt: stand.startsAt,
    badge: stand.badge,
    event: stand.event,
    tokens,
    scans,
    visitors: visitors.length,
    lastScanAt: visits[0]?.scannedAt ?? null,
    visits: visits.map((visit) => ({
      id: visit.id,
      attendeeName: visit.user.name,
      scannedAt: visit.scannedAt,
    })),
  } satisfies StandDetail;
}


