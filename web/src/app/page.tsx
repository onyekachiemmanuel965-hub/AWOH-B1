import { createPageMetadata, siteConfig } from "@/lib/metadata";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { HomeHero } from "@/components/home/home-hero";
import { BrandIntro } from "@/components/home/brand-intro";
import { CategoryDiscovery } from "@/components/home/category-discovery";
import { FeaturedCollection } from "@/components/home/featured-collection";
import { WhyAwoh } from "@/components/home/why-awoh";
import { InspirationGallery } from "@/components/home/inspiration-gallery";
import { HomeCta } from "@/components/home/home-cta";

export const metadata = createPageMetadata({
  title: `${siteConfig.name} | Premium Architectural Tiles & Materials`,
  description:
    "AWOH-B THE GREAT TILES VENTURE — premium tiles and architectural finishing materials for homeowners, architects, contractors, and refined spaces.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <HomeHero />
        <BrandIntro />
        <CategoryDiscovery />
        <FeaturedCollection />
        <WhyAwoh />
        <InspirationGallery />
        <HomeCta />
      </main>
      <SiteFooter />
    </>
  );
}
