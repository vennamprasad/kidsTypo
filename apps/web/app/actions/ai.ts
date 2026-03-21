// "use server"; // Removed to support static export
// import { db } from "@/lib/firebase-admin"; // Unused 
import wordBank from "@/data/word_bank.json";

/**
 * Premium Word Service: Uses a curated local bank (Zero Cost)
 * with an optional fallback to Gemini 1.5 Flash (Free Tier) for variety.
 */
export async function getPremiumWords(
  category: string, 
  difficulty: 'easy' | 'medium' | 'hard' = 'easy',
  useAI: boolean = false
): Promise<string[]> {
  if (useAI) {
    console.log(`[AI] Premium AI generation enabled for ${category} (${difficulty})`);
    // Placeholder for future Gemini 1.5 Flash call
  }

  const bank = wordBank as Record<string, Record<string, string[]>>;
  const tier = bank[category] || {};
  const curated = tier[difficulty] || [];
  
  // We prioritize curated words for 100% Kid Safety & Performance.
  if (curated.length > 0) {
    return curated;
  }

  // Fallback / AI Expansion (e.g. Gemini 1.5 Flash Free Tier)
  // return await fetchGeminiWords(category);
  
  return ["KIDDLR", "HAPPY", "LEARN"];
}

export async function getRhymeHints(root: string): Promise<string[]> {
  const stock: Record<string, string[]> = {
    CAT: ["BAT", "HAT", "MAT", "PAT", "RAT", "SAT", "VAT", "FAT"],
    BUG: ["HUG", "JUG", "MUG", "RUG", "TUG", "PUG", "LUG", "DUG"],
    SUN: ["BUN", "FUN", "RUN", "PUN", "BUN", "GUN"],
    PIG: ["BIG", "DIG", "FIG", "JIG", "WIG", "ZIG"],
    NET: ["PET", "WET", "JET", "SET", "VET", "MET"],
    DOG: ["LOG", "FOG", "JOG", "HOG"],
    HAT: ["CAT", "MAT", "BAT", "RAT", "FAT", "SAT", "VAT", "PAT"],
    PEN: ["HEN", "MEN", "TEN", "DEN", "ZEN"],
    CAR: ["STAR", "FAR", "TAR", "JAR"],
    BED: ["RED", "FED", "LED", "WED"]
  };
  return stock[root] || [];
}
