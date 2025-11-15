import React from "react";
import { Mail, ArrowRight } from "lucide-react";

interface ContactSectionProps {
  email: string;
  setEmail: (value: string) => void;
  onSubmit: () => void;
}

const ContactSection: React.FC<ContactSectionProps> = ({ email, setEmail, onSubmit }) => {
  return (
    <section
      id="contact"
      className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
    >
      <div className="space-y-3 max-w-xl">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Start with TerraViT
        </h2>
        <p className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          Bring climate-grade vision models into your workflows.
        </p>
        <p className="text-sm md:text-base text-muted-foreground">
          Tell us about your geospatial stack, and well share a tailored demo using TerraViT
          on your region of interest.
        </p>
      </div>
      <div className="w-full md:w-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex w-full flex-col sm:flex-row gap-3"
        >
          <div className="flex-1">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-muted-foreground"
          >
            Request early access
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactSection;
