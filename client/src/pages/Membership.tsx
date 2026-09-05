import { PageHeader } from "@/components/PageHeader";
import { UserPlus, Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import settingsData from "@/data/settings.json";

const DEFAULTS = {
  members_status_title: "Registration is Currently Closed",
  members_status_desc: "We are not accepting new members at this time for the 2026-2027 season. However, you can still access public resources and prepare for next year.",
  members_registration_open: "false",
  members_competitions_text: "Compete in over 30 STEM events ranging from coding and engineering to photography and debate at regional, state, and national levels.",
  members_leadership_text: "Develop soft skills through leadership workshops, officer positions, and team management experiences that colleges value.",
  members_resources_text: "Access exclusive study materials, past projects, and mentorship from alumni to help you succeed in your chosen events.",
};

const settings = settingsData as Record<string, string>;

export default function Members() {
  const get = (key: keyof typeof DEFAULTS) => settings[key] ?? DEFAULTS[key];
  const isOpen = get("members_registration_open") === "true";

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Membership"
        description="Join a community of innovators. Access resources, competitions, and leadership opportunities."
      />

      <div className="w-full mt-12 px-4 sm:px-6">
        <div className="mb-12 rounded-2xl bg-primary px-8 py-10 text-center text-primary-foreground shadow-lg md:px-16 md:py-16">
          <h2 className="mb-4 font-serif text-3xl font-bold">{get("members_status_title")}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
            {get("members_status_desc")}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            {isOpen ? (
              <Link href="/join">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold">
                  Join Now
                </Button>
              </Link>
            ) : (
              <Link href="/join">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold">
                  Join Waiting List
                </Button>
              </Link>
            )}
            <a href="mailto:s1873392@online.houstonisd.org?subject=BHS%20TSA%20Inquiry&body=Hi%20there%2C%0A%0A">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Contact Officers
              </Button>
            </a>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent-foreground">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-serif text-xl font-bold">Competitions</h3>
            <p className="text-muted-foreground">{get("members_competitions_text")}</p>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-serif text-xl font-bold">Leadership</h3>
            <p className="text-muted-foreground">{get("members_leadership_text")}</p>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-serif text-xl font-bold">Resources</h3>
            <p className="text-muted-foreground">{get("members_resources_text")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
