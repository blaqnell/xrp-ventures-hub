import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, PageHero } from "@/components/site/PublicShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQS } from "@/lib/content";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | XRP Ventures" },
      { name: "description", content: "Answers about market data, user-reported holdings, P/L calculations, privacy and what XRP Ventures does not do." },
      { property: "og:title", content: "XRP Ventures FAQ" },
      { property: "og:description", content: "Common questions about the XRP Ventures tracking platform." },
    ],
  }),
  component: () => (
    <PublicShell>
      <PageHero eyebrow="FAQ" title="Frequently asked questions" />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Accordion type="multiple">
          {FAQS.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </PublicShell>
  ),
});
