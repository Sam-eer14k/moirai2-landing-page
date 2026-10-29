# MoirAI Cloud: page wireframe

The current page is a product-led, interactive landing page for Synaptix™. Every
visual is built in SVG, CSS or canvas; the only raster images are the logo and
the two founder photos. There is no video. (The first version, an AgenIO mirror,
is in the git history.)

## Strategy

| | |
|---|---|
| Business | MoirAI Cloud. Sells Synaptix™, an AI infrastructure operating platform (compute, networking, storage, monitoring and AI-assisted operations in one console). |
| Buyer | Heads of infrastructure, IT and data center operations; CIOs weighing a move off VMware; MSPs. Technical, wary of AI hype and of rip-and-replace risk. |
| Primary conversion | **Talk to Our Team**, ending at the contact form. |
| Secondary conversion | Read the VMware Migration Playbook. |
| Honesty rule | Only the Synaptix™ Platform is available today. Multi-Site Management is in development. Predictive Operations, Policy & Resilience Automation and Autonomous Operations are planned. Demo UI is labeled "Illustrative"; unknown facts are marked `[CONFIRM: ...]`. |

## Section map (each section has one job)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ HEADER   logo · Platform Solutions Roadmap Compare Insights FAQ ·            │
│          "Available today: Synaptix™ Platform" chip · [Talk to Our Team]     │
│          transparent over hero → blurred bar; hides on scroll down           │
├──────────────────────────────────────────────────────────────────────────────┤
│ HERO     headline + 2 CTAs + trust row | Illustrative Synaptix console       │
│          (typed questions, answer, sparklines) over a reactive dot grid      │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1 PROBLEM      "One question, two ways": 4 consoles vs 1, side by side;      │
│                3 stat tiles that list what each number counts                │
│ 2 PLATFORM     radial hub: 5 modules, packets into Synaptix™, rich panel     │
│                with "Ask Synaptix™"                                          │
│ 3 SOLUTIONS    4 auto-advancing selectors · before/after drag slider ·       │
│                interactive rack / org tree / audit log / edge map            │
│ 4 CoS          density visualizer (Illustrative, not a benchmark)            │
│ 5 COMPARE      fragmented ↔ Synaptix™ switch + 4 pillars (bento)             │
│ 6 OVERSIGHT    3 incident scenarios: Investigate → Plan → Recommend →        │
│                Approve/Reject → audit trail                                  │
│ 7 ROADMAP      5 stage cards on a scroll-driven track, true statuses         │
│ 8 READINESS    6 yes/no questions, score ring, tailored next step            │
│ 9 TWO WAYS     "Where are you today?" → Modernize or Run on Synaptix™        │
│ 10 FOUNDERS    tilt cards with bio/quote reveal + CTA card                   │
│ 11 INSIGHTS    filterable article list with cursor preview                   │
│ 12 FAQ         live search + accordion                                       │
│ 13 LET'S TALK  rising bars banner, whole block links to the form             │
│ 14 CONTACT     email, socials, validated form                                │
│ FOOTER         nav row · big logo · drifting checker blocks · back to top    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Journey

1. Hero says what it is and that operators stay in control.
2. Problem and Platform show why one console matters and what it covers.
3. Solutions and CoS answer "does it fit my environment?"
4. Compare and Oversight handle "another tool?" and "will the AI act on its own?"
5. Roadmap is the trust section: what ships today vs later.
6. Readiness and Two ways route the visitor to a next step.
7. Founders, Insights and FAQ answer the last questions; banner and contact convert.

## Visual system

| Token | Value | Source / use |
|---|---|---|
| `--cyan` | `#55D4E1` | Left of the logo's eye ring. Accents on dark, packets, highlights. |
| `--blue` | `#3199CC` | Middle of the eye ring. |
| `--blue-deep` | `#004AAE` | Wordmark and right of the ring. Links and accents on light. |
| `--ink` | `#050A14` | Near-black navy for dark sections (the logo's pupil is pure black). |
| `--paper` | `#F4F6F9` | Light section background. |
| `--grad` | cyan → blue → deep blue | Signature accent: fills, borders, progress, connectors. |

Type: Urbanist (headings, body) with JetBrains Mono (labels, stats, console UI).
Corners 2–6px, no pill buttons, no purple.
