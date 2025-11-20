import React from "react";
import { Mail, ArrowRight } from "lucide-react";

interface ContactSectionProps {
  email: string;
  setEmail: (value: string) => void;
  onSubmit: () => void;
}

const ContactSection: React.FC<ContactSectionProps> = ({
  email,
  setEmail,
  onSubmit,
}) => {
  return (
    <section
      id="contact"
      className="relative w-full py-20 mt-32"
    >
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent blur-2xl pointer-events-none"></div>

      <div className="relative max-w-6xl mx-auto px-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-10">

        {/* LEFT TEXT */}
        <div className="space-y-4 max-w-xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
            Start with TerraViT
          </h2>

          <p className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
            Bring climate-grade vision models into your workflows.
          </p>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Tell us about your geospatial stack, and we'll create a tailored demo
            using TerraViT on your region of interest.
          </p>
        </div>

        {/* RIGHT FORM */}
        <div className="w-full md:w-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="flex w-full flex-col sm:flex-row gap-4"
          >
            {/* Email Input */}
            <div className="flex-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Work email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm
                             text-white placeholder:text-slate-400 backdrop-blur-lg shadow-inner
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl
                         bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold
                         text-white shadow-lg transition-all hover:shadow-blue-500/20 hover:brightness-110"
            >
              Request early access
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
