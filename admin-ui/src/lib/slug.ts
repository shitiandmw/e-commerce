import { pinyin } from "pinyin-pro"

const HAS_CJK = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff]/

/**
 * Generate a URL-friendly slug from text.
 * Chinese/Japanese characters are transliterated to pinyin;
 * other non-alphanumeric characters become hyphens.
 */
export function toSlug(text: string): string {
  let input = text.trim()

  if (HAS_CJK.test(input)) {
    // Convert CJK to pinyin, space-separated
    input = pinyin(input, { toneType: "none", type: "array" }).join(" ")
  }

  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
