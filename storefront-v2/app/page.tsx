import { HeroCarousel } from "@/components/home/hero-carousel"
import { HotPicks } from "@/components/home/flash-sale"
import { FeaturedCuban } from "@/components/home/featured-cuban"
import { LimitedEditions } from "@/components/home/limited-editions"
import { BeginnerSection } from "@/components/home/beginner-section"
import { BrandSpotlight } from "@/components/home/brand-spotlight"
import { ServiceBar } from "@/components/home/service-bar"
import { BlogPreview } from "@/components/home/blog-preview"
import { RegisterCTA } from "@/components/home/register-cta"

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <HotPicks />
      <FeaturedCuban />
      <LimitedEditions />
      <BeginnerSection />
      <BrandSpotlight />
      <ServiceBar />
      <BlogPreview />
      <RegisterCTA />
    </>
  )
}
