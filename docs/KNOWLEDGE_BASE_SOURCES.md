# 📚 CyberGuard AI — Trusted Knowledge Base Sources

## Quick Reference — Which Source Goes Where

```
cyber_threats table   → feeds Evaluation Agent  → threat facts, attack stats
cyber_training table  → feeds Coach Agent        → best practices, how-to guides
org_knowledge table   → feeds Scenario Agent     → you create this yourself
```

---

## 🔴 TABLE 1: cyber_threats — Evaluation Agent Sources

These sources describe WHAT attacks look like, HOW they work, and incident statistics.
Use them to build your threat definition knowledge base.

---

### 🇺🇸 FBI Internet Crime Complaint Center (IC3)
| Field | Detail |
|---|---|
| **URL** | ic3.gov/AnnualReport |
| **Trust level** | 🟢 US Federal Government |
| **What to get** | 2024 & 2025 Annual Reports (free PDF) |
| **What to extract** | BEC definitions, phishing stats, loss figures, attack descriptions |
| **Key stat for your project** | BEC losses exceeded $3B in 2025. Losses from all cybercrime surpassed $20B |
| **Why use it** | Real incident data — makes evaluation feedback credible with actual numbers |

---

### 🇬🇧 NCSC — National Cyber Security Centre (UK)
| Field | Detail |
|---|---|
| **URL** | ncsc.gov.uk/guidance |
| **Trust level** | 🟢 UK Government |
| **What to get** | Phishing, BEC, social engineering threat guidance pages |
| **What to extract** | Threat definitions, attack indicators, red flags |
| **Best pages** | "Phishing attacks: defending your organisation", "Email security" |
| **Why use it** | Plain-English definitions perfect for chunking into knowledge base |

---

### 🇺🇸 CISA — Cybersecurity & Infrastructure Security Agency
| Field | Detail |
|---|---|
| **URL** | cisa.gov/resources-tools |
| **Trust level** | 🟢 US Federal Government |
| **What to get** | Fact sheets on phishing, BEC, social engineering |
| **What to extract** | Attack type descriptions, threat indicators, warning signs |
| **Best docs** | "Phishing Guidance: Stopping the Attack Cycle", BEC fact sheets |
| **Why use it** | Short, structured documents — easy to chunk cleanly |

---

### 🇪🇺 ENISA — EU Agency for Cybersecurity
| Field | Detail |
|---|---|
| **URL** | enisa.europa.eu/publications |
| **Trust level** | 🟢 EU Regulatory Body |
| **What to get** | ENISA Threat Landscape 2024 & 2025 (free PDF) |
| **What to extract** | Phishing trends, social engineering techniques, attack statistics |
| **Key stat for your project** | Phishing accounts for ~60% of all intrusion attempts (2025 report) |
| **Why use it** | Most comprehensive European threat data. Adds geographic diversity |

---

### 📊 Verizon DBIR — Data Breach Investigations Report
| Field | Detail |
|---|---|
| **URL** | verizon.com/business/resources/reports/dbir |
| **Trust level** | 🟢 Industry Leader (analysed by Verizon + CISA + FBI) |
| **What to get** | 2024 & 2025 DBIR (free PDF, registration needed) |
| **What to extract** | "Human element" stats, phishing click rates, BEC incident patterns |
| **Key stat for your project** | Human element involved in ~60% of breaches. Training raised reporting 4x |
| **Why use it** | Most cited industry report globally — excellent for viva credibility |

---

### 🌐 MITRE ATT&CK Framework
| Field | Detail |
|---|---|
| **URL** | attack.mitre.org |
| **Trust level** | 🟢 Non-profit Research Organisation |
| **What to get** | Techniques under "Initial Access" and "Social Engineering" |
| **What to extract** | Spearphishing, pretexting, watering hole attack definitions |
| **Best sections** | T1566 (Phishing), T1598 (Phishing for Information) |
| **Why use it** | Industry-standard taxonomy for attack techniques — shows technical depth |

---

## 🟢 TABLE 2: cyber_training — Coach Agent Sources

These sources describe WHAT TO DO, HOW TO BEHAVE SAFELY, and HOW TO SPOT ATTACKS.
Use them to build your awareness training knowledge base.

---

### 🇬🇧 NCSC — Staff Guidance & Awareness Pages
| Field | Detail |
|---|---|
| **URL** | ncsc.gov.uk/guidance |
| **Trust level** | 🟢 UK Government |
| **What to get** | "Top Tips for Staff", "Exercise in a Box" materials |
| **What to extract** | Verification steps, safe behaviour checklists, how-to guides |
| **Best pages** | "Phishing — Spot and Report", "Protecting your organisation from email attack" |
| **Why use it** | Written for non-technical staff — plain language, directly actionable |

---

### 🇺🇸 NIST SP 800-50 & SP 800-16
| Field | Detail |
|---|---|
| **URL** | csrc.nist.gov/publications |
| **Trust level** | 🟢 US Government Standard |
| **What to get** | SP 800-50 (Security Awareness & Training Programme), SP 800-16 |
| **What to extract** | Awareness training principles, learning objectives, behavioural guidance |
| **Why use it** | The foundational standard for security awareness training globally |

---

### 🎓 SANS Institute — OUCH! Newsletter & Awareness Resources
| Field | Detail |
|---|---|
| **URL** | sans.org/security-awareness-training/resources |
| **Trust level** | 🟢 Industry Academic Body |
| **What to get** | OUCH! monthly newsletters (free, no registration), awareness cheat sheets |
| **What to extract** | The SLAM method, verification techniques, safe email habits, password guidance |
| **Why use it** | Newsletters are already perfectly chunked — one topic per issue |
| **Note** | OUCH! newsletters are translated into 30+ languages — excellent source quality |

---

### 🇺🇸 CISA — Cybersecurity Awareness Month Toolkit
| Field | Detail |
|---|---|
| **URL** | cisa.gov/cybersecurity-awareness-month |
| **Trust level** | 🟢 US Federal Government |
| **What to get** | Annual awareness toolkit PDFs, tip sheets |
| **What to extract** | "Think Before You Click", MFA guidance, phishing reporting procedures |
| **Why use it** | Designed for employee training — already in digestible format |

---

### 🇦🇺 ACSC — Australian Cyber Security Centre
| Field | Detail |
|---|---|
| **URL** | cyber.gov.au/protect-yourself |
| **Trust level** | 🟢 Australian Government |
| **What to get** | "Protect yourself online" guides, small business security guides |
| **What to extract** | Safe behaviour guides, verification checklists, incident reporting steps |
| **Why use it** | Plain English. Adds non-US/UK perspective. Good for diverse training content |

---

### 🌐 APWG — Anti-Phishing Working Group
| Field | Detail |
|---|---|
| **URL** | apwg.org/resources |
| **Trust level** | 🟢 Industry Body (global coalition) |
| **What to get** | Consumer advice pages, phishing awareness guides |
| **What to extract** | How to identify phishing URLs, spoofed senders, urgency tactics |
| **Why use it** | Focused specifically on phishing awareness — very targeted content |

---

## 🔵 TABLE 3: org_knowledge — Scenario Agent Source

> [!IMPORTANT]
> This knowledge base is NOT downloaded from anywhere. You create it yourselves for your fictional demo company.

### Your Fictional Company Profile to Create

For the university demo, create a fictional company called **"NovaTech Solutions"** (or any name you choose).

Write short documents covering these categories — 15–25 documents total is enough:

---

#### Category A — Role Profiles (one per role)
```
Roles to write:
  • Finance Manager
  • HR Officer
  • IT Administrator
  • Software Developer
  • Customer Support Agent

For each role, write:
  - What they do daily (3–5 sentences)
  - Who they communicate with regularly
  - What systems/tools they use
  - What kind of requests they typically receive by email
  - Their approval authority (if any)
```

#### Category B — Company Processes & Policies
```
Documents to write:
  • Payment approval process
    (e.g., "Amounts over $5,000 require dual sign-off")
  • IT request procedure
    (e.g., "All IT requests go through ServiceNow helpdesk")
  • HR communication norms
    (e.g., "HR announcements come from hr@novatech.com only")
  • Supplier onboarding process
    (e.g., "New vendors must be registered through procurement")
  • Data sharing policy
    (e.g., "Customer data never shared via email attachment")
```

#### Category C — Communication Style
```
Documents to write:
  • How internal emails look at NovaTech
    (formal/informal tone, typical sign-off phrases)
  • How the CEO communicates
    (e.g., "David Chen always uses full sentences, never urgency language")
  • How IT communicates
    (e.g., "IT never asks for passwords by email")
  • Typical vendor email patterns
    (e.g., "Invoices always reference a PO number")
```

#### Category D — Industry-Specific Attack Patterns (for each role)
```
Write short paragraphs like:
  "Finance Managers at IT companies are frequently targeted
   by CEO fraud where attackers impersonate senior executives
   to request urgent wire transfers bypassing normal approval."

  "HR Officers are targeted with fake employee onboarding
   requests asking to change payroll bank account details."
```

---

## 📋 Recommended Download Order (Start Here)

| Priority | Source | Time to download | Why first |
|---|---|---|---|
| 1 | NCSC guidance pages | 30 min | Best quality, plain English, both threat + training |
| 2 | FBI IC3 2025 Annual Report | 10 min | Real BEC/phishing stats for Evaluation Agent |
| 3 | SANS OUCH! newsletters (last 12) | 20 min | Perfect chunks, Coach Agent training content |
| 4 | CISA fact sheets | 20 min | Short, structured, easy to chunk |
| 5 | ENISA Threat Landscape 2025 | 10 min | European threat data, evaluation credibility |
| 6 | Verizon DBIR 2025 | 15 min | Best industry statistics |
| 7 | MITRE ATT&CK techniques | 30 min | Technical taxonomy for threat definitions |
| 8 | Create org_knowledge yourself | 2–3 hours | Your fictional company context |

---

## ✅ How Many Documents Do You Actually Need?

```
cyber_threats:   30–50 chunks   (from NCSC, FBI, CISA, ENISA, Verizon, MITRE)
cyber_training:  30–50 chunks   (from NCSC staff guides, SANS OUCH!, NIST, CISA)
org_knowledge:   20–30 chunks   (written by your team for NovaTech)

Total: ~80–130 document chunks across all 3 tables
Storage used in Supabase pgvector: ~2–4 MB
Well within the 500 MB free tier.
```
