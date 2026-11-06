export type LoginFormState = {
  error: string | null;
};

export type ScanFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "checked-in"; eventName: string; alreadyCheckedIn: boolean }
  | {
      status: "collected";
      alreadyCollected: boolean;
      eventName: string;
      badge: {
        eventBadgeId: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        room: string | null;
        xpAwarded: number;
      };
      /** Filled when this scan took the attendee to a new global level. */
      levelUp?: {
        level: number;
        name: string;
        minXp: number;
      };
    };
