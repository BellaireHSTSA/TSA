
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, CalendarCheck } from "lucide-react";
import roomMap from "@assets/Dr Pichot Room Map.png";
import settingsData from "@/data/settings.json";

interface AgendaItem {
  date: string;
  time: string;
  topic: string;
  type: string;
}

const DEFAULTS = {
  meetings_general_desc:
    "Our general meetings are held bi-weekly to discuss chapter business, upcoming events, and competition preparation. Attendance is highly encouraged for all members.",
  meetings_general_schedule: "Every other Tuesday, second half of lunch",
  meetings_general_location: "Room 2607 (Dr. Pichot's Room)",
  meetings_officer_desc:
    "Leadership meetings focus on strategic planning, event logistics, and chapter management. Open to elected officers and committee heads.",
  meetings_officer_schedule: "Mondays, 7:30 AM - 8:15 AM",
  meetings_officer_location: "Room 2607 (Dr. Pichot's Room)",
  meetings_agenda: JSON.stringify([
    { date: "Aug 20, 2026", topic: "Interest Meeting", type: "General" },
    { date: "Sep 1, 2026", topic: "Events Meeting", type: "General" },
    { date: "Feb 12, 2027", topic: "Regional Conference", type: "Conference" },
  ]),
};

const settings = settingsData as Record<string, string>;

export default function Meetings() {
  const get = (key: keyof typeof DEFAULTS) => settings[key] ?? DEFAULTS[key];

  let agendaItems: AgendaItem[] = [];
  try {
    agendaItems = JSON.parse(get("meetings_agenda"));
  } catch {}

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Chapter Meetings"
        description="Join us to collaborate, plan, and prepare for competitions."
      />

      <div className="w-full mt-12 px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-l-4 border-l-primary shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <CalendarCheck className="h-6 w-6 text-primary" />
                General Meetings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {get("meetings_general_desc")}
              </p>
              <div className="space-y-2 rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium">
                    {get("meetings_general_schedule")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium">
                    {get("meetings_general_location")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <img
              src={roomMap}
              alt="Dr. Pichot Room Map"
              className="w-full h-full object-cover"
            />
          </Card>
          
        </div>

        <div className="mt-12">
          <h2 className="mb-6 font-serif text-2xl font-bold">
            Upcoming Agendas
          </h2>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {agendaItems.length === 0 ? (
              <p className="px-6 py-8 text-center text-muted-foreground">
                No upcoming meetings scheduled.
              </p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-secondary text-sm font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Time</th>
                    <th className="px-6 py-4">Topic</th>
                    <th className="px-6 py-4 hidden md:table-cell">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agendaItems.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{item.date}</td>
                      <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">{item.time}</td>
                      <td className="px-6 py-4">{item.topic}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                        {item.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
