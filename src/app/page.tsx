import { CTAButton } from "@/components/ui/button";
import { PremiumCard } from "@/components/ui/card";
import { EmptyStateInline } from "@/components/ui/empty-state";
import { EventCard, FeatureCard, SermonCard, StatCard } from "@/components/ui/content-cards";
import { ClosingCta, HeroSection, Section } from "@/components/ui/layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

type SermonPreview = {
  id: string;
  title: string;
  speaker: string | null;
  series: string | null;
  preached_at: string | null;
  tags: string[] | null;
};

type EventPreview = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
};

function sortUpcoming(events: EventPreview[]) {
  const now = Date.now();

  return events
    .filter((event) => new Date(event.starts_at).getTime() >= now)
    .sort(
      (left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
    );
}

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: sermonData }, { data: eventData }] = await Promise.all([
    supabase
      .from("sermons")
      .select("id, title, speaker, series, preached_at, tags")
      .eq("is_published", true)
      .order("preached_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("events")
      .select("id, title, description, location, starts_at")
      .eq("is_published", true)
      .order("starts_at", { ascending: true })
      .limit(6),
  ]);

  const latestSermon = ((sermonData ?? []) as SermonPreview[])[0];
  const upcomingEvents = sortUpcoming((eventData ?? []) as EventPreview[]).slice(0, 3);

  return (
    <div className="space-y-8 sm:space-y-10">
      <HeroSection className="bg-[linear-gradient(135deg,rgba(14,36,71,0.98),rgba(35,74,138,0.88)_52%,rgba(211,166,74,0.68))] text-white shadow-[0_32px_90px_rgba(14,36,71,0.28)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.22),transparent_18rem),radial-gradient(circle_at_92%_10%,rgba(211,166,74,0.30),transparent_18rem)]" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.12fr_0.88fr] lg:p-10">
          <div className="flex min-h-[31rem] flex-col justify-end py-4 sm:py-8">
            <StatusBadge tone="gold" className="w-fit bg-white/14 text-gold ring-white/20">
              Covenant Ways Church
            </StatusBadge>
            <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.95] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              Encounter God. Find family. Live purpose.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              A warm spiritual home for worship, discipleship and everyday church life. Join us as
              we gather around Jesus, grow together, and serve our city with faith and care.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CTAButton href="/new-here" variant="gold" size="lg">
                Plan Your Visit
              </CTAButton>
              <CTAButton href="/sermons" variant="secondary" size="lg">
                Watch Latest Message
              </CTAButton>
              <CTAButton
                href="/give"
                variant="outline"
                size="lg"
                className="border border-white/30 text-white ring-white/30 hover:bg-white hover:text-primary"
              >
                Give
              </CTAButton>
            </div>
          </div>

          <div className="grid content-end gap-4">
            <PremiumCard className="bg-white/92 text-ink backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-deep">
                Sunday gathering
              </p>
              <h2 className="mt-3 font-display text-3xl">Worship, Word and family.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Come as you are. Expect worship, biblical teaching, prayer and space to meet people
                before and after the service.
              </p>
              <div className="mt-5 grid gap-3 text-sm text-primary sm:grid-cols-2">
                <div className="rounded-2xl bg-ivory-strong p-4">
                  <p className="font-bold">Main gathering</p>
                  <p className="mt-1 text-muted-foreground">Sundays</p>
                </div>
                <div className="rounded-2xl bg-ivory-strong p-4">
                  <p className="font-bold">First visit?</p>
                  <p className="mt-1 text-muted-foreground">We&apos;ll help you settle in.</p>
                </div>
              </div>
            </PremiumCard>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard value="Gather" label="Worship" />
              <StatCard value="Grow" label="Discipleship" />
              <StatCard value="Go" label="Purpose" />
            </div>
          </div>
        </div>
      </HeroSection>

      <Section
        eyebrow="This week"
        title="Start with worship, then take a next step."
        description="The homepage now surfaces the parts of church life people look for first: messages, events, visit planning and giving."
      >
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          {latestSermon ? (
            <SermonCard
              title={latestSermon.title}
              href={`/sermons/${latestSermon.id}`}
              speaker={latestSermon.speaker}
              meta={[
                latestSermon.series,
                latestSermon.preached_at ? formatDate(latestSermon.preached_at) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              tags={latestSermon.tags}
            />
          ) : (
            <EmptyStateInline>Publish a sermon to show the latest message here.</EmptyStateInline>
          )}

          <div className="grid gap-4">
            {upcomingEvents.length ? (
              upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  href={`/events/${event.id}`}
                  startsAt={formatDateTime(event.starts_at)}
                  location={event.location}
                  description={event.description}
                />
              ))
            ) : (
              <EmptyStateInline>
                Publish upcoming events to show the church calendar here.
              </EmptyStateInline>
            )}
          </div>
        </div>
      </Section>

      <Section eyebrow="Next steps" title="A clear path into church life.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            title="I'm New"
            description="Tell us a little about yourself and we'll help you feel at home."
            href="/new-here"
            label="Start here"
          />
          <FeatureCard
            title="Watch Sermons"
            description="Catch up on messages and keep growing through the week."
            href="/sermons"
            label="Browse sermons"
          />
          <FeatureCard
            title="Register for Events"
            description="Find gatherings, courses and community moments coming up soon."
            href="/events"
            label="See events"
          />
          <FeatureCard
            title="Give Securely"
            description="Support the ministry through a protected giving flow."
            href="/give"
            label="Give now"
          />
        </div>
      </Section>

      <Section className="py-4">
        <PremiumCard className="grid gap-8 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(246,238,222,0.72))] p-6 sm:p-8 md:grid-cols-[0.85fr_1.15fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-deep">
              Our mission
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-ink">
              A church family shaped by presence, formation and purpose.
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Covenant Ways Church exists to make the life of the church easier to discover, join
              and steward. The app brings together public sermons, event registration, giving and
              member resources in one calm, trustworthy experience.
            </p>
            <p>
              Every workflow should feel human-reviewed and pastorally aware: clear enough for a
              first-time visitor, structured enough for teams, and warm enough to feel like home.
            </p>
          </div>
        </PremiumCard>
      </Section>

      <ClosingCta />
    </div>
  );
}
