"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import {
  Container,
  Section,
  Stack,
  Cluster,
  Grid,
} from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox, Radio, Switch } from "@/components/ui/checkbox";
import { SearchInput, QuantitySelector } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductCard } from "@/components/product/product-card";
import {
  Alert,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  Skeleton,
} from "@/components/feedback/feedback";
import { Modal, Tooltip } from "@/components/feedback/modal";
import { ToastProvider, useToast } from "@/components/feedback/toast";

function ShowcaseInner() {
  const { push } = useToast();
  const [qty, setQty] = useState(2);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Section className="border-b border-border bg-[linear-gradient(180deg,var(--color-background)_0%,var(--color-surface-muted)_100%)]">
          <Container>
            <Stack gap="lg" className="motion-fade-in max-w-3xl">
              <p className="type-caption uppercase tracking-[0.16em] text-accent">
                Stage 02 · Design System
              </p>
              <h1 className="type-display text-primary">
                AWOH-B visual foundation
              </h1>
              <p className="type-body-lg text-text-muted">
                Development showcase for brand tokens, typography, and reusable
                UI primitives. This is not the storefront homepage (Stage 03).
              </p>
            </Stack>
          </Container>
        </Section>

        <Section>
          <Container className="space-y-16">
            <Stack gap="md">
              <h2 className="type-h2">Color</h2>
              <p className="type-body text-text-muted">
                Midnight navy, champagne gold (accent only), warm ivory, soft
                sand, deep graphite.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Primary", "bg-primary"],
                  ["Accent", "bg-accent"],
                  ["Background", "bg-background border border-border"],
                  ["Surface", "bg-surface border border-border"],
                  ["Sand", "bg-surface-muted"],
                  ["Text", "bg-text"],
                ].map(([label, cls]) => (
                  <div key={label} className="flex flex-col gap-2">
                    <div className={`h-16 rounded-md ${cls}`} />
                    <span className="type-caption text-text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </Stack>

            <Stack gap="md">
              <h2 className="type-h2">Typography</h2>
              <div className="space-y-4 rounded-md border border-border bg-surface p-6">
                <p className="type-display">Display · Cormorant Garamond</p>
                <p className="type-h1">Heading 1</p>
                <p className="type-h2">Heading 2</p>
                <p className="type-h3">Heading 3</p>
                <p className="type-h4">Heading 4</p>
                <p className="type-body-lg">
                  Body large — Manrope for UI readability.
                </p>
                <p className="type-body">
                  Body — Architectural materials deserve calm, confident type.
                </p>
                <p className="type-body-sm text-text-muted">Body small · muted</p>
                <p className="type-caption uppercase tracking-[0.12em]">
                  Caption label
                </p>
                <p className="type-label">Form label</p>
                <p className="type-button">Button text</p>
              </div>
            </Stack>

            <Stack gap="md">
              <h2 className="type-h2">Buttons</h2>
              <Cluster>
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </Cluster>
            </Stack>

            <Stack gap="md">
              <h2 className="type-h2">Forms</h2>
              <Grid cols={2} className="items-start">
                <Input
                  id="demo-name"
                  label="Full name"
                  placeholder="Jane Architect"
                  hint="Used for order contact"
                />
                <Input
                  id="demo-email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  error="Enter a valid email"
                />
                <Select
                  id="demo-city"
                  label="City"
                  placeholder="Select city"
                  defaultValue=""
                  options={[
                    { value: "lagos", label: "Example City A" },
                    { value: "abuja", label: "Example City B" },
                  ]}
                />
                <SearchInput id="demo-search" placeholder="Search tiles…" />
                <Textarea
                  id="demo-notes"
                  label="Notes"
                  placeholder="Delivery notes…"
                  className="sm:col-span-2"
                />
                <QuantitySelector id="demo-qty" value={qty} onChange={setQty} />
                <Stack gap="sm">
                  <Checkbox id="demo-terms" label="Agree to terms (demo)" />
                  <Radio
                    id="demo-pay-1"
                    name="pay"
                    label="Online payment"
                    defaultChecked
                  />
                  <Radio id="demo-pay-2" name="pay" label="Offline / cash" />
                  <Switch id="demo-switch" label="Save details" />
                </Stack>
              </Grid>
            </Stack>

            <Stack gap="md">
              <h2 className="type-h2">Badges</h2>
              <Cluster>
                {(
                  [
                    "new",
                    "featured",
                    "available",
                    "low-stock",
                    "out-of-stock",
                    "pending",
                    "paid",
                    "failed",
                    "processing",
                    "completed",
                  ] as const
                ).map((v) => (
                  <Badge key={v} variant={v} />
                ))}
              </Cluster>
            </Stack>

            <Stack gap="md">
              <h2 className="type-h2">Product card foundation</h2>
              <Grid cols={3}>
                <ProductCard
                  name="Porcelain Sample A"
                  category="Tiles"
                  subcategory="Porcelain"
                  priceLabel="₦ — PLACEHOLDER"
                  badge="featured"
                  availability="available"
                  onQuickAction={() => push({ title: "Demo action", tone: "info" })}
                />
                <ProductCard
                  name="Marble Sample B"
                  category="Tiles"
                  subcategory="Marble look"
                  priceLabel="₦ — PLACEHOLDER"
                  availability="low-stock"
                  badge="new"
                />
                <ProductCard
                  name="Ceramic Sample C"
                  category="Tiles"
                  subcategory="Ceramic"
                  priceLabel="₦ — PLACEHOLDER"
                  availability="out-of-stock"
                />
              </Grid>
            </Stack>

            <Stack gap="md">
              <h2 className="type-h2">Feedback</h2>
              <Grid cols={2}>
                <Alert variant="info" title="Info">
                  Delivery fee will be confirmed server-side.
                </Alert>
                <Alert variant="success" title="Success">
                  Design tokens loaded.
                </Alert>
                <Alert variant="warning" title="Warning">
                  Gold accent used sparingly.
                </Alert>
                <Alert variant="error" title="Error">
                  Example validation message.
                </Alert>
              </Grid>
              <Cluster>
                <Button
                  variant="secondary"
                  onClick={() =>
                    push({
                      title: "Toast example",
                      description: "Subtle premium notification",
                      tone: "success",
                    })
                  }
                >
                  Show toast
                </Button>
                <Button variant="outline" onClick={() => setModalOpen(true)}>
                  Open modal
                </Button>
                <Tooltip content="Refined tooltip">
                  <Button variant="ghost">Hover tooltip</Button>
                </Tooltip>
              </Cluster>
              <LoadingSpinner />
              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <EmptyState
                title="No products yet"
                description="Catalog arrives in Stage 04. This empty state is foundation only."
                action={<Button variant="outline">Browse later</Button>}
              />
              <ErrorState
                action={<Button variant="secondary">Retry</Button>}
              />
            </Stack>

            <Stack gap="md">
              <h2 className="type-h2">Card (interaction container)</h2>
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle>Sample surface</CardTitle>
                  <CardDescription>
                    Thin border, soft shadow, restrained radius — architectural,
                    not SaaS-bubbly.
                  </CardDescription>
                </CardHeader>
                <Button size="sm">Continue</Button>
              </Card>
            </Stack>
          </Container>
        </Section>
      </main>
      <SiteFooter />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm action"
        description="Accessible dialog foundation using the native dialog element."
        confirmLabel="Confirm"
        onConfirm={() => {
          setModalOpen(false);
          push({ title: "Confirmed", tone: "success" });
        }}
      />
    </>
  );
}

export default function DesignSystemPage() {
  return (
    <ToastProvider>
      <ShowcaseInner />
    </ToastProvider>
  );
}
