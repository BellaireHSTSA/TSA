import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ChevronDown, HelpCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Faq } from "@shared/schema";
import faqs from "@/data/faqs.json";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const faqRows = faqs as Faq[];

export default function FAQ() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Frequently Asked Questions"
        description="Common questions about BHS TSA membership, competitions, and events."
      />

      <div className="w-full mt-12 px-4 sm:px-6">
        {faqRows.length === 0 ? (
          <div className="text-center py-20">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-40 mb-4" />
            <p className="text-muted-foreground">No FAQs have been added yet — check back soon!</p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden divide-y">
            {faqRows.map((faq) => (
              <div key={faq.id} data-testid={`faq-item-${faq.id}`}>
                <button
                  onClick={() => toggle(faq.id)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-muted/40 transition-colors"
                  data-testid={`faq-question-${faq.id}`}
                >
                  <span className="font-medium text-foreground leading-snug">{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${openId === faq.id ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openId === faq.id && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pt-1 pb-6 text-muted-foreground leading-relaxed border-t bg-muted/20">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl border bg-primary/5 px-8 py-8 text-center">
          <h2 className="font-serif text-xl font-bold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-5 text-sm">
            Reach out to our officers or fill out the interest form and we'll get back to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/officers">
              <Button variant="outline" className="w-full sm:w-auto">Email Officers</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
