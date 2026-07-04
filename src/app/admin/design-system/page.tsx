import { BrandMark } from "@/components/brand-mark";
import { Button, CTAButton } from "@/components/ui/button";
import { Card, PremiumCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  EventCard,
  FeatureCard,
  FundCard,
  SermonCard,
  StatCard,
} from "@/components/ui/content-cards";
import { Input } from "@/components/ui/input";
import { PageHeader, Section } from "@/components/ui/layout";
import { StatusBadge } from "@/components/ui/status-badge";

const swatches = [
  { name: "Navy", className: "bg-primary", value: "#0E2447" },
  { name: "Royal", className: "bg-royal", value: "#234A8A" },
  { name: "Gold", className: "bg-gold", value: "#D3A64A" },
  { name: "Ivory", className: "bg-ivory", value: "#FFF9EC" },
  { name: "Success", className: "bg-success", value: "#13795B" },
  { name: "Warning", className: "bg-warning", value: "#A56205" },
  { name: "Danger", className: "bg-danger", value: "#B42318" },
];

export default function AdminDesignSystemPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Covenant Radiance"
        title="Design-system preview"
        description="A protected review surface for brand tokens, typography, buttons, cards, badges and first-pass content patterns before wider page redesigns."
        actions={
          <>
            <CTAButton href="/" variant="gold">
              View homepage
            </CTAButton>
            <CTAButton href="/admin" variant="secondary">
              Back to admin
            </CTAButton>
          </>
        }
      />

      <Section eyebrow="Identity" title="Brand and typography">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <PremiumCard>
            <BrandMark />
            <p className="mt-6 text-sm leading-6 text-muted-foreground">
              The mark is intentionally simple: a compact illuminated initial, strong enough for the
              app header without becoming a fake logo system.
            </p>
          </PremiumCard>
          <PremiumCard>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">Display</p>
            <h2 className="mt-3 font-display text-5xl leading-none text-ink">
              Encounter God. Find family.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Manrope carries the operational UI; DM Serif Display gives public pages warmth and a
              church-specific voice.
            </p>
          </PremiumCard>
        </div>
      </Section>

      <Section eyebrow="Tokens" title="Radiance palette">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {swatches.map((swatch) => (
            <Card key={swatch.name} className="overflow-hidden" padding="none">
              <div className={`${swatch.className} h-24`} />
              <div className="p-4">
                <p className="font-bold text-ink">{swatch.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{swatch.value}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Actions" title="Buttons, fields and badges">
        <PremiumCard className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="gold">Gold</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Warm, accessible input" />
            <Input placeholder="Visible focus state" />
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="gold">Featured</StatusBadge>
            <StatusBadge tone="blue">Upcoming</StatusBadge>
            <StatusBadge tone="success">Open</StatusBadge>
            <StatusBadge tone="warning">Full</StatusBadge>
            <StatusBadge tone="danger">Attention</StatusBadge>
            <StatusBadge>Draft</StatusBadge>
          </div>
        </PremiumCard>
      </Section>

      <Section eyebrow="Cards" title="Public and operational patterns">
        <div className="grid gap-4 lg:grid-cols-3">
          <SermonCard
            title="The Way of Covenant Faith"
            href="/sermons"
            speaker="Pastor Example"
            meta="Kingdom Life · 4 Jul 2026"
            tags={["faith", "family", "purpose"]}
          />
          <EventCard
            title="Welcome Lunch"
            href="/events"
            startsAt="Sunday, 12:30"
            location="Church hall"
            description="A simple next step for new people to meet leaders, ask questions and find community."
          />
          <FundCard
            title="Missions"
            description="Support outreach and practical ministry through secure giving."
            amount="£25"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard value="Gather" label="Worship" />
          <StatCard value="Grow" label="Formation" />
          <StatCard value="Go" label="Mission" />
        </div>
      </Section>

      <Section eyebrow="Empty states" title="Helpful first-run states">
        <EmptyState
          title="No events published yet"
          description="When content is missing, empty states should guide admins and members toward the next useful action without looking broken."
          actionHref="/admin/events"
          actionLabel="Manage events"
        />
      </Section>

      <Section eyebrow="Next steps" title="Reusable feature cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            title="I'm New"
            description="A welcoming route for first-time visitors."
            href="/new-here"
          />
          <FeatureCard
            title="Sermons"
            description="A content path for teaching and discipleship."
            href="/sermons"
          />
          <FeatureCard
            title="Events"
            description="Registration-ready community gatherings."
            href="/events"
          />
          <FeatureCard
            title="Giving"
            description="Secure support for ministry and mission."
            href="/give"
          />
        </div>
      </Section>
    </div>
  );
}
