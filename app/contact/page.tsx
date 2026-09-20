import type { Metadata } from "next";
import {
  Clock3,
  Globe2,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact CrownRoute Logistics",
  description:
    "Contact CrownRoute Logistics for parcel delivery, international freight, express shipping and shipment support.",
};

const supportItems = [
  {
    title: "Shipment planning",
    description:
      "Speak with our team about your shipment route, service mode and expected delivery schedule.",
    Icon: Globe2,
  },
  {
    title: "Tracking support",
    description:
      "Get assistance with tracking numbers, shipment progress and operational notifications.",
    Icon: MapPin,
  },
  {
    title: "Protected information",
    description:
      "Customer enquiries and shipment information are handled through secured systems.",
    Icon: ShieldCheck,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white">
      <SiteHeader />

      <section
        className="relative flex min-h-[500px] items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=2000&q=85')",
        }}
      >
        <div className="absolute inset-0 bg-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24 lg:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a72c]/40 bg-[#d4a72c]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#efc95d]">
              <MessageSquareText size={15} />
              Contact CrownRoute
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Let&apos;s plan your{" "}
              <span className="text-[#d4a72c]">
                next route.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              Send us your shipment requirements and our team
              will help identify the right logistics service
              and route structure.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-6 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
              Contact information
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">
              Start a conversation.
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/45">
              Provide as much information as possible about
              the parcel or cargo, origin, destination and
              required delivery schedule.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href={`mailto:${brand.contact.email}`}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#111111] p-5 transition hover:border-[#d4a72c]/40"
              >
                <Mail
                  size={21}
                  className="mt-0.5 shrink-0 text-[#e6bd4f]"
                />

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/30">
                    Email
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    {brand.contact.email}
                  </p>
                </div>
              </a>

              <a
                href={`tel:${brand.contact.phone}`}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#111111] p-5 transition hover:border-[#d4a72c]/40"
              >
                <Phone
                  size={21}
                  className="mt-0.5 shrink-0 text-[#e6bd4f]"
                />

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/30">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    {brand.contact.phone}
                  </p>
                </div>
              </a>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#111111] p-5">
                <Clock3
                  size={21}
                  className="mt-0.5 shrink-0 text-[#e6bd4f]"
                />

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/30">
                    Support
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    24/7 global assistance
                  </p>
                </div>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0c0c0c] px-5 py-20 lg:px-6">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {supportItems.map(
            ({
              title,
              description,
              Icon,
            }) => (
              <article
                key={title}
                className="rounded-3xl border border-white/10 bg-[#111111] p-7"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
                  <Icon size={22} />
                </span>

                <h3 className="mt-5 text-lg font-black">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-white/40">
                  {description}
                </p>
              </article>
            ),
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}