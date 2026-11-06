export interface ShareTarget {
  x: string;
  whatsapp: string;
  facebook: string;
}

export function buildShareText(input: {
  badgeName: string;
  eventName: string;
  xp: number;
}): string {
  return `I collected the ${input.badgeName} badge at ${input.eventName} (+${input.xp} XP) with Lyfter Badges.`;
}

export function buildShareUrls(input: {
  url: string;
  text: string;
}): ShareTarget {
  const encodedUrl = encodeURIComponent(input.url);
  const encodedText = encodeURIComponent(input.text);

  return {
    x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${input.text} ${input.url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };
}
