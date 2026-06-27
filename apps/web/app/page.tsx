"use client";

import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  FileText,
  PenLine,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "../components/auth/logo";
import { PLANS } from "../lib/constants";

const FEATURES = [
  {
    icon: Search,
    title: "Research",
    desc: "Ask in plain English. DeLaw searches Nigerian case law and statutes — every authority verified as good law.",
  },
  {
    icon: PenLine,
    title: "Draft",
    desc: "Court-ready briefs, contracts and opinions with inline AI suggestions and one-click citation insertion.",
  },
  {
    icon: Briefcase,
    title: "Manage",
    desc: "Track matters, deadlines and filings across your chambers with a calendar built for the court diary.",
  },
  {
    icon: Workflow,
    title: "Automate",
    desc: "Turn repetitive filings into reusable workflows — from briefs of argument to demand letters.",
  },
];

const TRUST_LOGOS = [
  "Adeyemi Chambers",
  "Okonkwo & Partners",
  "Balogun Harrison LP",
  "Sterling Law Practice",
  "Eze & Associates",
  "Chukwu Legal",
];

const STATS = [
  { num: "240+", label: "Firms & chambers on DeLaw" },
  { num: "1.2M+", label: "Nigerian cases & statutes indexed" },
  { num: "50k+", label: "Documents drafted" },
  { num: "6 hrs", label: "Saved per lawyer, every week" },
];

const PRACTICE_AREAS = [
  { icon: Scale, name: "Commercial Litigation", desc: "Disputes, injunctions & appeals." },
  { icon: Workflow, name: "Oil & Gas", desc: "Energy & natural resources." },
  { icon: Building2, name: "Corporate / M&A", desc: "Transactions & due diligence." },
  { icon: FileText, name: "Banking & Finance", desc: "Security, recovery & lending." },
  { icon: Users, name: "Employment", desc: "Labour & industrial relations." },
  { icon: Building2, name: "Real Estate", desc: "Land, title & tenancy." },
  { icon: Shield, name: "Intellectual Property", desc: "Trademarks & copyright." },
  { icon: Briefcase, name: "Maritime", desc: "Admiralty & shipping." },
];

const TESTIMONIALS = [
  {
    quote:
      "DeLaw cut my research time in half. The citations are verified, so I stopped second-guessing the AI before a hearing.",
    name: "Ngozi Okonkwo, Esq.",
    role: "Partner · Okonkwo & Partners",
    initials: "NO",
  },
  {
    quote:
      "I was a LawPavilion loyalist for ten years. DeLaw is the first tool that actually understands how we draft and file in Nigeria.",
    name: "Chukwuemeka Eze",
    role: "Principal · Eze & Associates",
    initials: "CE",
  },
  {
    quote:
      "Onboarding my whole chambers took an afternoon. The matter diary alone has saved us two missed deadlines this term.",
    name: "Aisha Bello, SAN",
    role: "Senior Advocate of Nigeria",
    initials: "AB",
  },
];

const SECURITY = [
  { title: "NDPR compliant", desc: "Built to the Nigeria Data Protection Regulation." },
  { title: "Encrypted end-to-end", desc: "AES-256 at rest, TLS 1.3 in transit." },
  { title: "Your data is yours", desc: "Never used to train shared models." },
  { title: "Role-based access", desc: "Granular permissions across the chambers." },
];

const FAQS = [
  {
    q: "Is DeLaw trained on Nigerian law specifically?",
    a: "Yes. DeLaw is grounded in the Nigerian corpus — Supreme Court and Court of Appeal reports, the NWLR, federal and state legislation, and procedural rules — rather than generic global content. Every answer cites a verifiable Nigerian authority.",
  },
  {
    q: "How do you make sure citations are real and good law?",
    a: "Each authority an answer relies on is checked against the law reports for subsequent treatment — whether it has been followed, distinguished or overruled. You see a verification badge and can open the full judgment inline before you rely on it.",
  },
  {
    q: "Can my whole chambers use one account?",
    a: "Yes. On the Firm and Enterprise plans you invite your team, assign matters, and share a template library. Billing is per lawyer, per month, so you only pay for active seats.",
  },
  {
    q: "Is my client data confidential?",
    a: "Always. DeLaw is NDPR-compliant, encrypted in transit and at rest, and your matter data is never used to train shared models. Access is role-based and fully audited.",
  },
  {
    q: "What does it cost and is there a free trial?",
    a: "Every paid plan starts with a 14-day free trial, no card required. Free is free forever, Solo is ₦15,000/month and Professional is ₦35,000/month. You can upgrade, downgrade or cancel at any time.",
  },
];

const PLAN_TAGLINES: Record<string, string> = {
  FREE: "For individual practitioners getting started.",
  SOLO: "For busy solo advocates.",
  PROFESSIONAL: "For small teams & growing practices.",
  FIRM: "For full-service chambers & firms.",
};

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <div className="min-h-screen bg-navy font-sans text-text-body antialiased">
      {/* nav */}
      <nav className="sticky top-0 z-30 flex h-[66px] items-center gap-[14px] border-b border-line-subtle px-6 backdrop-blur-[10px] sm:px-[38px]" style={{ background: "rgba(10,15,30,.82)" }}>
        <Logo href={null} />
        <div className="mx-auto hidden gap-[30px] text-sm font-medium md:flex">
          <a href="#sec-features" className="cursor-pointer text-text-secondary transition hover:text-gold">Features</a>
          <a href="#sec-pricing" className="cursor-pointer text-text-secondary transition hover:text-gold">Pricing</a>
          <a href="#sec-about" className="cursor-pointer text-text-secondary transition hover:text-gold">About</a>
          <a href="#sec-resources" className="cursor-pointer text-text-secondary transition hover:text-gold">Resources</a>
        </div>
        <Link href="/login" className="ml-auto flex h-[38px] items-center rounded-[9px] px-4 text-sm font-semibold text-text-body transition hover:bg-bg-hover md:ml-0">
          Login
        </Link>
        <Link href="/register/step-1" className="flex h-[38px] items-center rounded-[9px] bg-gradient-to-br from-gold-hover to-gold px-[17px] text-sm font-bold text-gold-ink shadow-gold transition hover:brightness-105">
          Get Started
        </Link>
      </nav>

      {/* hero */}
      <section className="relative overflow-hidden px-6 pb-[70px] pt-[78px] sm:px-[38px]">
        <div className="pointer-events-none absolute -top-[160px] left-1/2 h-[520px] w-[900px] -translate-x-1/2" style={{ background: "radial-gradient(ellipse at center, rgba(201,168,76,.10), transparent 62%)" }} />
        <div className="relative mx-auto grid max-w-[1180px] items-center gap-[54px] lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-[22px] inline-flex items-center gap-2 rounded-[30px] border border-gold/30 bg-gold/[.07] px-[13px] py-[6px] text-[12.5px] font-semibold text-gold">
              <span className="h-[6px] w-[6px] rounded-full bg-success" />
              Now live across Nigeria · West Africa next
            </div>
            <h1 className="mb-5 font-serif text-[44px] font-bold leading-[1.05] tracking-[-.025em] text-text-cream sm:text-[54px]">
              African Law.
              <br />
              <span className="text-gold">Intelligently</span> Practiced.
            </h1>
            <p className="mb-[30px] max-w-[480px] text-[17px] leading-[1.6] text-text-muted">
              The AI-native legal platform built for African practice. Research
              Nigerian case law, draft court-ready documents, and run your
              chambers — in one premium workspace.
            </p>
            <div className="flex flex-wrap items-center gap-[13px]">
              <Link href="/register/step-1" className="flex h-12 items-center gap-2 rounded-[11px] bg-gradient-to-br from-gold-hover to-gold px-[22px] text-[15px] font-bold text-gold-ink shadow-gold-lg transition hover:-translate-y-px hover:brightness-105">
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <a href="#sec-resources" className="flex h-12 items-center rounded-[11px] border border-line-accent bg-bg-700 px-[22px] text-[15px] font-semibold text-text-body transition hover:border-line-hover">
                Book a Demo
              </a>
            </div>
            <p className="mt-4 text-[12.5px] text-text-faint">
              14-day trial · No card required · Cancel anytime
            </p>
          </div>

          {/* product mock */}
          <div className="relative">
            <div className="rounded-[16px] border border-line-raised p-[18px] shadow-card" style={{ background: "linear-gradient(165deg,rgba(201,168,76,.06),rgba(201,168,76,0) 50%),#101728" }}>
              <div className="mb-[14px] flex items-center gap-[9px]">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] border border-gold/30 bg-gold/[.12] text-gold">
                  <Sparkles size={16} />
                </span>
                <span className="font-serif text-[14px] font-semibold text-text-cream">DeLaw AI</span>
                <span className="ml-auto rounded-[20px] border border-gold/25 bg-gold/10 px-[7px] py-[2px] text-[9px] font-bold tracking-[.06em] text-gold">GROUNDED</span>
              </div>
              <div className="mb-[7px] text-[12px] text-text-faint">Can the State acquire land for a private purpose?</div>
              <p className="mb-[13px] text-[13.5px] leading-[1.65] text-text-secondary">
                No. Under <span className="text-gold">s.44(1) of the 1999 Constitution</span>, acquisition for a private commercial purpose is <span className="font-semibold text-text-cream">ultra vires</span> and liable to be set aside.
              </p>
              <div className="rounded-[8px] border border-l-2 border-line border-l-gold bg-[#0E1424] px-3 py-[10px] font-mono text-[11.5px] text-gold">
                Bello v. AG Oyo State
                <br />
                <span className="text-text-muted">(1986) 5 NWLR (Pt. 45) 828, SC</span>
                <div className="mt-[6px] flex items-center gap-[5px] font-sans text-[10.5px] font-semibold text-success">
                  <Check size={13} /> Verified · Good law
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* trust bar */}
      <section className="border-y border-line-subtle bg-bg-900 px-6 py-6 sm:px-[38px]">
        <div className="mx-auto max-w-[1180px] text-center">
          <div className="mb-4 text-[12.5px] tracking-[.04em] text-text-faint">
            Trusted by <span className="font-semibold text-gold">240+</span> Nigerian law firms, chambers &amp; in-house teams
          </div>
          <div className="flex flex-wrap items-center justify-center gap-[34px] opacity-[.72]">
            {TRUST_LOGOS.map((t) => (
              <span key={t} className="whitespace-nowrap font-serif text-[17px] font-semibold text-text-muted">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="sec-features" className="mx-auto max-w-[1180px] scroll-mt-20 px-6 py-[74px] sm:px-[38px]">
        <div className="mb-[46px] text-center">
          <div className="mb-3 font-mono text-[12px] tracking-[.1em] text-gold">THE COMPLETE PRACTICE</div>
          <h2 className="mb-3 font-serif text-[30px] font-bold tracking-[-.02em] text-text-cream sm:text-[36px]">Everything a modern chambers needs</h2>
          <p className="mx-auto max-w-[540px] text-[15.5px] leading-[1.6] text-text-muted">Four pillars, one workspace — each grounded in Nigerian law and built for how lawyers actually work.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-[15px] border border-line bg-bg-750 p-6 transition hover:-translate-y-[3px] hover:border-line-accent">
              <div className="mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border border-gold/25 bg-gold/10 text-gold">
                <f.icon size={22} />
              </div>
              <h3 className="mb-2 font-serif text-[18px] font-semibold text-text-cream">{f.title}</h3>
              <p className="text-[13.5px] leading-[1.6] text-text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* stats */}
      <section className="border-y border-line-subtle bg-bg-900">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="border-r border-bg-hover px-6 py-[34px] text-center">
              <div className="font-serif text-[38px] font-bold leading-none tracking-[-.02em] text-gold">{s.num}</div>
              <div className="mt-[9px] text-[13px] leading-[1.4] text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* deep-dive: research */}
      <section id="sec-about" className="mx-auto max-w-[1180px] scroll-mt-20 px-6 pb-[30px] pt-[84px] sm:px-[38px]">
        <div className="grid items-center gap-[54px] lg:grid-cols-[1fr_1.05fr]">
          <div>
            <div className="mb-[14px] font-mono text-[11.5px] tracking-[.1em] text-gold">01 · LEGAL RESEARCH</div>
            <h2 className="mb-4 font-serif text-[32px] font-bold leading-[1.15] tracking-[-.02em] text-text-cream">Research that cites only good law</h2>
            <p className="mb-[22px] text-[15.5px] leading-[1.65] text-text-muted">Ask a question the way you&rsquo;d brief a junior. DeLaw reads the full corpus of Nigerian case law and statute, then answers with authorities it has verified are still good law — never invented, always traceable to the report.</p>
            <div className="flex flex-col gap-3">
              {[
                ["Verified citations", "every authority checked against the NWLR & SC/CA reports for overruling."],
                ["Plain-English answers", "with the ratio, holding and procedural history laid out."],
                ["Jump to source", "open the full judgment inline, no second database."],
              ].map(([b, rest]) => (
                <div key={b} className="flex items-start gap-[11px]">
                  <Check size={13} className="mt-[3px] flex-none text-gold" />
                  <span className="text-sm leading-[1.5] text-text-secondary">
                    <b className="text-text-cream">{b}</b> — {rest}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[16px] border border-line-raised p-[18px] shadow-card" style={{ background: "linear-gradient(165deg,rgba(201,168,76,.05),rgba(201,168,76,0) 50%),#101728" }}>
            <div className="mb-[13px] flex items-center gap-[9px]">
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] border border-gold/30 bg-gold/[.12] text-gold"><Sparkles size={16} /></span>
              <span className="font-serif text-[14px] font-semibold text-text-cream">DeLaw AI</span>
              <span className="ml-auto rounded-[20px] border border-gold/25 bg-gold/10 px-[7px] py-[2px] text-[9px] font-bold tracking-[.06em] text-gold">12 SOURCES</span>
            </div>
            <div className="mb-[9px] text-[12.5px] text-text-faint">Is an oral agreement to transfer land enforceable in Nigeria?</div>
            <p className="mb-[13px] text-[13.5px] leading-[1.65] text-text-secondary">Generally no. By <span className="text-gold">s.4 of the Statute of Frauds</span> and the Land Use Act, a contract for the disposition of land must be evidenced in writing. However, the equitable doctrine of <span className="font-semibold text-text-cream">part-performance</span> may render it enforceable.</p>
            <div className="rounded-[8px] border border-l-2 border-line border-l-gold bg-[#0E1424] px-3 py-[10px] font-mono text-[11.5px] text-gold">
              Odutola v. Papersack (Nig) Ltd
              <br />
              <span className="text-text-muted">(2006) 18 NWLR (Pt. 1012) 470, SC</span>
              <div className="mt-[6px] flex items-center gap-[5px] font-sans text-[10.5px] font-semibold text-success"><Check size={13} /> Verified · Good law</div>
            </div>
          </div>
        </div>
      </section>

      {/* deep-dive: draft */}
      <section className="mx-auto max-w-[1180px] px-6 py-[54px] sm:px-[38px]">
        <div className="grid items-center gap-[54px] lg:grid-cols-[1.05fr_1fr]">
          <div className="order-2 rounded-[16px] border border-line bg-[#0F1626] px-[30px] py-[26px] font-serif shadow-card lg:order-1">
            <div className="text-center font-mono text-[10px] leading-[1.8] tracking-[.05em] text-text-muted">IN THE FEDERAL HIGH COURT OF NIGERIA<br />HOLDEN AT LAGOS</div>
            <div className="mt-3 text-right font-mono text-[11px] text-gold">SUIT NO. FHC/L/CS/123/2025</div>
            <h3 className="my-[14px] mt-[18px] text-center text-[15px] font-semibold text-text-cream">CLAIMANT&rsquo;S BRIEF OF ARGUMENT</h3>
            <p className="mb-3 text-[13px] leading-[1.7] text-text-secondary">It is the Claimant&rsquo;s contention that the purported acquisition is unlawful, having been effected for a private commercial purpose contrary to <span className="text-gold">s.44(1) of the Constitution</span>.</p>
            <div className="rounded-[9px] border border-dashed border-gold/35 bg-gold/[.05] px-[13px] py-[11px] font-sans">
              <div className="mb-[6px] flex items-center gap-[6px] text-[10.5px] font-bold tracking-[.05em] text-gold"><Sparkles size={14} /> DELAW SUGGESTS</div>
              <p className="text-[12.5px] leading-[1.55] text-text-secondary">Add the leading authority: <span className="font-mono text-[11.5px] text-gold">Bello v. AG Oyo State (1986) 5 NWLR (Pt. 45) 828</span></p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="mb-[14px] font-mono text-[11.5px] tracking-[.1em] text-gold">02 · DRAFTING</div>
            <h2 className="mb-4 font-serif text-[32px] font-bold leading-[1.15] tracking-[-.02em] text-text-cream">From blank page to filed in record time</h2>
            <p className="mb-[22px] text-[15.5px] leading-[1.65] text-text-muted">Generate briefs of argument, contracts, opinions and demand letters from your matter context. DeLaw drafts in the register a Nigerian court expects, suggests authorities as you write, and inserts perfectly-formatted citations with a click.</p>
            <div className="flex flex-col gap-3">
              {[
                ["Court-ready formatting", "for FHC, Court of Appeal & State High Court rules."],
                ["Inline AI suggestions", "you accept or dismiss — you stay in control of every word."],
                ["Reusable templates", "for the filings your chambers runs every week."],
              ].map(([b, rest]) => (
                <div key={b} className="flex items-start gap-[11px]">
                  <Check size={13} className="mt-[3px] flex-none text-gold" />
                  <span className="text-sm leading-[1.5] text-text-secondary"><b className="text-text-cream">{b}</b> — {rest}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* practice areas */}
      <section className="mx-auto max-w-[1180px] px-6 py-[70px] sm:px-[38px]">
        <div className="mb-10 text-center">
          <div className="mb-3 font-mono text-[12px] tracking-[.1em] text-gold">FOR EVERY PRACTICE</div>
          <h2 className="mb-3 font-serif text-[30px] font-bold tracking-[-.02em] text-text-cream sm:text-[34px]">Built for the way Nigeria practises law</h2>
          <p className="mx-auto max-w-[520px] text-[15px] leading-[1.6] text-text-muted">From the courtroom to the boardroom, DeLaw is trained on the authorities and instruments your area relies on.</p>
        </div>
        <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
          {PRACTICE_AREAS.map((p) => (
            <div key={p.name} className="rounded-[13px] border border-line bg-bg-750 p-[18px] transition hover:border-gold">
              <div className="mb-[13px] flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-line bg-bg-600 text-gold"><p.icon size={20} /></div>
              <div className="mb-1 text-[14px] font-semibold text-text-cream">{p.name}</div>
              <div className="text-[12px] leading-[1.45] text-text-faint">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* testimonials */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[74px] pt-[10px] sm:px-[38px]">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-[30px] font-bold tracking-[-.02em] text-text-cream sm:text-[32px]">What Nigerian lawyers are saying</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="flex flex-col rounded-[15px] border border-line bg-bg-750 p-6">
              <div className="mb-[14px] flex gap-[3px] text-gold">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={13} className="fill-gold text-gold" />
                ))}
              </div>
              <p className="mb-[18px] flex-1 font-serif text-[15px] italic leading-[1.6] text-text-secondary">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-[11px] border-t border-line-subtle pt-4">
                <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border border-line-accent bg-gradient-to-br from-line-raised to-bg-500 text-xs font-bold text-gold">{t.initials}</span>
                <div>
                  <div className="text-[13px] font-semibold text-text-body">{t.name}</div>
                  <div className="text-[11.5px] text-gold-muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* security */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[74px] sm:px-[38px]">
        <div className="grid items-center gap-12 rounded-[20px] border border-line p-11 lg:grid-cols-[1fr_1.2fr]" style={{ background: "linear-gradient(135deg,#0E1424,#0B1020)" }}>
          <div>
            <div className="mb-[18px] flex h-[52px] w-[52px] items-center justify-center rounded-[13px] border border-gold/30 bg-gold/10 text-gold"><ShieldCheck size={24} /></div>
            <h2 className="mb-3 font-serif text-[28px] font-bold leading-[1.2] tracking-[-.02em] text-text-cream">The confidentiality the Bar demands</h2>
            <p className="text-[14.5px] leading-[1.6] text-text-muted">Privilege is non-negotiable. DeLaw is built to the standard a Senior Advocate would insist on — your client data never trains shared models.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SECURITY.map((s) => (
              <div key={s.title} className="flex items-start gap-[11px]">
                <Check size={13} className="mt-[1px] flex-none text-success" />
                <div>
                  <div className="mb-[3px] text-[13.5px] font-semibold text-text-cream">{s.title}</div>
                  <div className="text-[12.5px] leading-[1.45] text-text-muted">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="sec-resources" className="mx-auto max-w-[780px] scroll-mt-20 px-6 pb-20 sm:px-[38px]">
        <div className="mb-[34px] text-center">
          <h2 className="font-serif text-[30px] font-bold tracking-[-.02em] text-text-cream">Questions, answered</h2>
        </div>
        <div className="flex flex-col gap-[10px]">
          {FAQS.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className={`overflow-hidden rounded-[13px] border bg-bg-750 transition ${open ? "border-line-accent" : "border-line"}`}>
                <button type="button" onClick={() => setOpenFaq(open ? -1 : i)} className="flex w-full items-center gap-[14px] px-[19px] py-[17px] text-left">
                  <span className="flex-1 text-[15px] font-semibold text-text-cream">{item.q}</span>
                  <ChevronDown size={16} className={`text-gold transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open ? <p className="px-[19px] pb-[18px] text-[14px] leading-[1.65] text-text-muted">{item.a}</p> : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* pricing */}
      <section id="sec-pricing" className="mx-auto max-w-[1180px] scroll-mt-20 px-6 pb-[78px] pt-[10px] sm:px-[38px]">
        <div className="mb-9 text-center">
          <h2 className="mb-[10px] font-serif text-[30px] font-bold tracking-[-.02em] text-text-cream sm:text-[32px]">Pricing that scales with your practice</h2>
          <p className="text-[14.5px] text-text-muted">From solo advocates to full-service firms. Billed per lawyer, monthly.</p>
        </div>
        <div className="grid grid-cols-1 items-stretch gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.key} className={`relative rounded-[15px] p-[22px_18px] ${p.recommended ? "border-[1.5px] border-gold bg-gradient-to-br from-gold/[.09] to-bg-750 shadow-[0_8px_30px_rgba(201,168,76,.12)]" : "border border-line bg-bg-750"}`}>
              {p.recommended ? (
                <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-[20px] bg-gradient-to-br from-gold-hover to-gold px-[11px] py-1 text-[10px] font-bold tracking-[.06em] text-gold-ink">RECOMMENDED</div>
              ) : null}
              <div className="text-[13px] font-semibold text-text-secondary">{p.name}</div>
              <div className="mb-1 mt-[10px] font-serif text-[26px] font-bold text-text-cream">{p.price}</div>
              <div className="mb-[14px] text-[11.5px] text-text-faint">{p.unit}</div>
              <div className="text-[12.5px] leading-[1.5] text-text-muted">{PLAN_TAGLINES[p.key]}</div>
            </div>
          ))}
        </div>
        <div className="mt-[26px] text-center">
          <Link href="/register/step-4" className="inline-flex h-[42px] items-center rounded-[10px] border border-line-accent bg-bg-700 px-5 text-sm font-semibold text-text-body transition hover:border-line-hover">
            See full pricing &amp; features →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[78px] sm:px-[38px]">
        <div className="relative overflow-hidden rounded-[20px] border border-line-raised p-[54px] text-center" style={{ background: "linear-gradient(135deg,#141B2E,#0E1424)" }}>
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,.12), transparent 60%)" }} />
          <h2 className="relative mb-3 font-serif text-[30px] font-bold tracking-[-.02em] text-text-cream sm:text-[34px]">Ready to practice intelligently?</h2>
          <p className="relative mb-[26px] text-[15.5px] text-text-muted">Join the firms modernising African legal practice — start free today.</p>
          <Link href="/register/step-1" className="relative inline-flex h-[50px] items-center rounded-[12px] bg-gradient-to-br from-gold-hover to-gold px-[26px] text-[15.5px] font-bold text-gold-ink shadow-gold-lg transition hover:brightness-105">
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-line-subtle bg-bg-900 px-6 py-10 sm:px-[38px]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-[18px]">
          <div className="flex items-center gap-[11px]">
            <Logo size="sm" href={null} />
            <span className="ml-2 text-[12px] text-text-faint">© 2026 · Made in Lagos 🇳🇬</span>
          </div>
          <div className="flex gap-[26px] text-[13px] text-text-muted">
            <span className="cursor-pointer transition hover:text-gold">Privacy</span>
            <span className="cursor-pointer transition hover:text-gold">Terms</span>
            <span className="cursor-pointer transition hover:text-gold">Security</span>
            <span className="cursor-pointer transition hover:text-gold">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
