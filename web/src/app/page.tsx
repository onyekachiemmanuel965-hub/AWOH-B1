import { createPageMetadata, siteConfig } from "@/lib/metadata";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { HomeHero } from "@/components/home/home-hero";
import { BrandIntro } from "@/components/home/brand-intro";
import { CategoryDiscovery } from "@/components/home/category-discovery";
import { WhyAwoh } from "@/components/home/why-awoh";
import { InspirationGallery } from "@/components/home/inspiration-gallery";
import { HomeCta } from "@/components/home/home-cta";
import { fetchStorefrontImages, storefrontImageMap } from "@/lib/api";

export const metadata = createPageMetadata({
  title: `${siteConfig.name} | Premium Architectural Tiles & Materials`,
  description:
    "AWOH-B THE GREAT TILES VENTURE — premium tiles and architectural finishing materials for homeowners, architects, contractors, and refined spaces.",
  path: "/",
});

export default async function HomePage() {
  const images = await fetchStorefrontImages("home");
  const map = storefrontImageMap(images);
  const hero = map.get("home.hero");

  return (
    <StorefrontShell atmosphere="interior">
      <HomeHero imageSrc={hero?.url} imageAlt={hero?.altText} />
      <BrandIntro />
      <CategoryDiscovery />
      <WhyAwoh />
      <InspirationGallery images={images} />
      <HomeCta />
    </StorefrontShell>
  );
}
