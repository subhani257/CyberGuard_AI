# 🛡️ Cyber Threat Data Extraction — Process Guide
### CyberGuard AI · `cyber_threats` table → Evaluation Agent

---

## The Core Problem You're Solving

Annual reports (FBI IC3, ENISA, Verizon DBIR) are 80–120 page PDFs.
They contain: executive summaries, graphs, legal disclaimers, methodology sections, footnotes, and **scattered across all of that** — the actual threat intelligence you need.

Your Evaluation Agent only needs **3 things**:
1. **What does the attack look like?** (definition)
2. **What are the specific red flags?** (indicators)
3. **What happened in the real world?** (incident stats)

Everything else is noise. The process below filters it out.

---

## Phase 1 — Choose Your Sources (Tiered by Quality)

### 🏆 Tier 1 — Use These First (clean, structured, easy to chunk)

| Source | Format | Why it's easy | URL |
|---|---|---|---|
| **CISA Fact Sheets** | 1–2 page PDF | One topic = one document, minimal noise | cisa.gov/resources-tools |
| **NCSC Guidance Pages** | Web page | Plain English, structured with headers | ncsc.gov.uk/guidance |
| **MITRE ATT&CK Technique Pages** | Web page | Each technique is a self-contained definition | attack.mitre.org |
| **SANS OUCH! Newsletters** | 2-page PDF | One threat topic per issue, pre-chunked | sans.org/ouch |

**👉 Use these for 70% of your `cyber_threats` data.** You can extract them manually in 1–2 hours with near-zero processing.

---

### ⚠️ Tier 2 — Annual Reports (Your Problem — Need Smart Extraction)

| Source | Pages | Useful pages | Noise ratio |
|---|---|---|---|
| **FBI IC3 2025** | ~80 pages | ~15 pages | ~80% noise |
| **Verizon DBIR 2025** | ~120 pages | ~20 pages | ~83% noise |
| **ENISA Threat Landscape** | ~100 pages | ~25 pages | ~75% noise |

These are valuable but require the structured extraction process below.

---

## Phase 2 — Smart Extraction Process for Annual Reports

### Step 1 — Navigate Directly to Signal Sections (skip everything else)

**Do NOT read the full PDF.** Go directly to these sections:

```
FBI IC3 Annual Report — Go to:
  ✅ "Business Email Compromise (BEC)" section
  ✅ "Phishing / Vishing / Smishing" section
  ✅ Any section with the word "Indicators" or "Red Flags"
  ❌ Skip: Director's Message, Methodology, Charts, Appendix

Verizon DBIR — Go to:
  ✅ "Results and Analysis" > "Social Engineering" section
  ✅ "Human Element" statistics
  ✅ "Action varieties" for phishing
  ❌ Skip: Executive Summary, Industry Verticals, VERIS framework pages

ENISA Threat Landscape — Go to:
  ✅ "Phishing" chapter (usually Chapter 3-4)
  ✅ "Social Engineering" techniques section
  ✅ "Key Findings" boxes (highlighted boxes in the PDF)
  ❌ Skip: Policy recommendations, EU regulatory context, country case studies
```

---

### Step 2 — Apply the 3-Question Filter

For every paragraph you read, ask:

```
Q1: Does this describe HOW an attack works?     → KEEP (threat_definition)
Q2: Does this list specific red flags or IOCs?  → KEEP (attack_pattern)
Q3: Does this give a real incident stat/number? → KEEP (incident_report)

Anything else?                                  → DISCARD
```

**Examples of what to KEEP vs DISCARD:**

```
KEEP ✅  "BEC actors impersonate executives using display name spoofing,
          where the sender name matches the CEO but the email domain differs.
          Red flags: urgency, requests for wire transfer, secrecy demands."

KEEP ✅  "BEC resulted in $3.04 billion in losses in 2024, the highest of
          any cybercrime category." (FBI IC3 2025)

DISCARD ❌  "The IC3 was established in 2000 as a partnership between the
             FBI and the National White Collar Crime Center."

DISCARD ❌  "Figure 4.3 shows the year-over-year trend in reported incidents
             across all sectors from 2020–2025."

DISCARD ❌  "ENISA recommends that member states adopt a unified threat
             reporting framework by Q3 2026."
```

---

### Step 3 — Write Extraction Chunks (The Exact Format for Your DB)

Once you've identified content that passes the filter, write it as a clean chunk using this exact template:

```
CHUNK TEMPLATE:
─────────────────────────────────────────────────
category:  threat_definition | attack_pattern | incident_report
source:    [Exact report name + year]
content:   [1–4 sentence self-contained description]
url:       [Report URL or page reference]
─────────────────────────────────────────────────
```

**Rule for content length:**
- Minimum: 1 sentence (don't be too short — no semantic context)
- Maximum: 4 sentences (~100 words)
- Each chunk must make sense **completely on its own** (no "as mentioned above")

---

### Step 4 — Chunk Examples (Ready for Your `cyber_threats` Table)

```json
{
  "category": "threat_definition",
  "content": "Business Email Compromise (BEC) is a sophisticated scam targeting businesses that regularly perform wire transfers. Attackers impersonate executives or trusted vendors through email domain spoofing or account compromise. Key indicators include unexpected payment requests, urgency, demands for secrecy, and last-minute changes to banking details.",
  "metadata": {"source": "FBI IC3 Annual Report 2025", "url": "ic3.gov/AnnualReport"}
}

{
  "category": "incident_report",
  "content": "BEC caused $3.04 billion in financial losses in 2024, making it the costliest cybercrime category reported to the FBI IC3. The finance sector and legal firms are disproportionately targeted due to their regular handling of large wire transfers.",
  "metadata": {"source": "FBI IC3 Annual Report 2025", "url": "ic3.gov/AnnualReport"}
}

{
  "category": "attack_pattern",
  "content": "Spear-phishing via email (MITRE T1566.001) is the most common initial access vector for social engineering attacks. Attackers personalize lures using OSINT data — referencing a victim's recent LinkedIn post, their manager's name, or an ongoing company project. This personalization significantly increases click rates compared to generic phishing.",
  "metadata": {"source": "MITRE ATT&CK T1566.001 + Verizon DBIR 2025", "url": "attack.mitre.org/techniques/T1566/001/"}
}

{
  "category": "attack_pattern",
  "content": "MFA Fatigue (Push Bombing) involves attackers repeatedly sending MFA push notifications to a target after obtaining their password. The goal is to overwhelm the user into approving the request. This technique was used in the 2022 Uber breach and the Lapsus$ group attacks. Mitigation: use number-matching MFA instead of push approval.",
  "metadata": {"source": "CISA Advisory AA22-119A", "url": "cisa.gov/news-events/cybersecurity-advisories/aa22-119a"}
}

{
  "category": "threat_definition",
  "content": "Vishing (Voice Phishing) is a social engineering attack conducted over phone calls. Attackers impersonate IT support, bank fraud departments, or government agencies to extract credentials or one-time passwords. Red flags: unsolicited call, urgency, request for OTP or password, caller refuses to let you call back on an official number.",
  "metadata": {"source": "NCSC UK — Phishing Guidance 2025", "url": "ncsc.gov.uk/guidance/phishing"}
}
```

---

## Phase 3 — Your Extraction Targets (Exactly What to Pull)

### For `cyber_threats` table — Evaluation Agent needs:

| Attack Type | Where to extract from | Target chunks |
|---|---|---|
| **BEC / CEO Fraud** | FBI IC3, NCSC, CISA | 5–8 chunks |
| **Spear Phishing** | MITRE T1566, CISA, Verizon DBIR | 5–8 chunks |
| **Vishing** | NCSC, CISA | 3–5 chunks |
| **Smishing** | CISA, FBI IC3 | 3–5 chunks |
| **MFA Fatigue** | CISA advisory, MITRE | 3–4 chunks |
| **Pretexting** | Verizon DBIR, NCSC | 3–5 chunks |
| **Watering Hole** | MITRE T1189, ENISA | 2–3 chunks |
| **Credential Harvesting** | CISA, NCSC | 3–5 chunks |

**Total: 30–45 chunks** — perfect for your Supabase pgvector table.

---

## Phase 4 — Automated Ingestion into Vector DB

Your existing [`seed_vector_db.py`](file:///c:/Users/yasan/Downloads/Sem%202%20-%203rd%20Year/IRW/Group%20Assignment/CyberGuard_AI/backend/scripts/seed_vector_db.py) already handles embedding + upload.

**Recommended workflow:**

```
Annual Report PDF
       │
       ▼
 Step 1: Read the PDF, apply 3-question filter (manual, ~30 min per report)
       │
       ▼
 Step 2: Write chunks into threat_chunks.json
       │
       ▼
 Step 3: Run threat_ingest.py (extends seed_vector_db.py to read from JSON)
       │
       ▼
 Supabase pgvector: cyber_threats table ✅
```

---

## Phase 5 — Build `threat_chunks.json` (Your Extraction Output File)

Create this file at `backend/scripts/data/threat_chunks.json`:

```json
[
  {
    "category": "threat_definition",
    "content": "YOUR EXTRACTED CONTENT HERE",
    "metadata": {
      "source": "Source Name + Year",
      "url": "URL",
      "attack_type": "BEC",
      "extracted_by": "manual"
    }
  }
]
```

Then the ingest script simply loads this file and calls your existing `seed_knowledge_base()` function.

---

## Phase 6 — Quality Check Before Uploading

Before running the ingest script, check each chunk:

```
✅ Self-contained? (reads fine without surrounding context)
✅ Under 100 words?
✅ At least 1 concrete fact or technique name?
✅ Correct category tag? (threat_definition / attack_pattern / incident_report)
✅ Source + URL in metadata?
❌ No vague sentences like "attacks are increasing" without specifics
❌ No duplicate chunks (same fact from two sources — keep only one)
❌ No policy/recommendation content (that goes in cyber_training, not cyber_threats)
```

---

## Recommended Extraction Order (Start to Finish)

| Day | Task | Time | Output |
|---|---|---|---|
| **Day 1 AM** | CISA fact sheets (BEC, Phishing, Smishing) | 1 hr | ~10 chunks |
| **Day 1 PM** | NCSC guidance pages (web) | 1 hr | ~8 chunks |
| **Day 2 AM** | MITRE ATT&CK (T1566, T1598, T1189) | 1 hr | ~8 chunks |
| **Day 2 PM** | FBI IC3 Annual Report 2025 (targeted) | 1.5 hr | ~8 chunks |
| **Day 3 AM** | Verizon DBIR (Human Element + Social Eng sections) | 1.5 hr | ~8 chunks |
| **Day 3 PM** | ENISA (Phishing chapter only) | 1 hr | ~5 chunks |
| **Day 4** | Review all chunks, build JSON, run ingest script | 1 hr | DB seeded ✅ |

**Total effort: ~8 hours across 4 days.** Produces 40–50 high-quality chunks.

---

## Key Principle

> Annual reports are **reference libraries**, not **reading material**.  
> You don't read them — you **navigate them surgically**, extract only the sentences that answer your 3 questions, and discard everything else.
>
> The Evaluation Agent never needs to know who wrote the report's foreword. It needs to know: *"What does a BEC attack look like, and what are its red flags?"* — extract **exactly that**, nothing more.
