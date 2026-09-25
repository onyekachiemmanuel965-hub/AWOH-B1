import { Container } from "@/components/layout/primitives";
import { whyPoints } from "@/lib/home-content";

export function WhyAwoh() {
  return (
    <section
      aria-labelledby="why-heading"
      className="bg-primary py-16 text-text-inverse md:py-24"
    >
      <Container width="wide">
        <div className="mb-12 max-w-2xl space-y-4 md:mb-16">
          <p className="type-caption uppercase tracking-[0.16em] text-accent">
            Why AWOH-B
          </p>
          <h2 id="why-heading" className="type-h2 text-text-inverse">
            Built around quality, clarity, and care
          </h2>
          <p className="type-body text-text-inverse/70">
            A straightforward approach to architectural materials — without
            inflated claims. What we emphasize is what we can stand behind.
          </p>
        </div>

        <ol className="grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {whyPoints.map((point, index) => (
            <li key={point.title} className="flex flex-col gap-3 border-t border-white/15 pt-6">
              <span className="type-caption text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-brand-display text-2xl text-text-inverse">
                {point.title}
              </h3>
              <p className="type-body-sm text-text-inverse/70">{point.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
