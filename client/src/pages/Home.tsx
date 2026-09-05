import { PageHeader } from "@/components/PageHeader";
import { ResourceCard } from "@/components/ResourceCard";
import { CalendarDays, Users, Trophy, BookOpen, HelpCircle, FileText } from "lucide-react";
import { motion } from "framer-motion";
import Homebg from "../../../attached_assets/Homebg.png";

const resources = [
  {
    title: "General Resources",
    description: "Access study guides, rule books, and preparation materials for all competitions.",
    href: "/resources",
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    title: "Champions",
    description: "Celebrate our winners and see the hall of fame from past conferences.",
    href: "/champions",
    icon: <Trophy className="h-6 w-6" />,
  },
  {
    title: "Academic Events",
    description: "Learn about the events you can compete in at various levels of conferences.",
    href: "/events",
    icon: <FileText className="h-6 w-6" />,
  },
  {
    title: "Officer Team",
    description: "Meet the student leaders dedicated to making this year a success.",
    href: "/officers",
    icon: <Users className="h-6 w-6" />,
  },
  {
    title: "Meeting Schedule",
    description: "Find out when and where our next general and chapter meetings are held.",
    href: "/meetings",
    icon: <FileText className="h-6 w-6" />,
  },
  {
    title: "FAQs",
    description: "Have questions? Find answers to common inquiries about membership and events.",
    href: "/faqs",
    icon: <HelpCircle className="h-6 w-6" />,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section - tech circuit background style */}
      <PageHeader
        title="BHS Technology Student Association"
        description="Learning to lead in a technical world. We foster personal growth, leadership, and opportunities in STEM."
        backgroundImage= "/Homebg.png"
        className="text-center bg-transparent"
        
      />

      {/* Intro Content */}
      <div className="w-full mt-16 px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-serif font-bold text-primary mb-6">Welcome to Our Chapter</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The Technology Student Association (TSA) is a national organization that focuses on encouraging students to participate in various STEM-related competitions and events at three different levels: regionals, state, and nationals. As a TSA member at Bellaire High School, you develop communication, presentation, and teamwork skills while working with others in a fun and engaging atmosphere. No prior knowledge is required.
          </p>
        </motion.div>
      </div>

      {/* Resources Grid */}
      <div className="w-full mt-20 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-foreground">Chapter Resources</h2>
          <div className="h-px flex-1 bg-border ml-6 hidden sm:block"></div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <ResourceCard {...resource} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
