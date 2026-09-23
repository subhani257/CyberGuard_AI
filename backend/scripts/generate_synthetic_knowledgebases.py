"""Generate the complete CyberGuard AI demonstration knowledge corpus.

The generator is deterministic and safe to run repeatedly. It replaces the
fictional NovaTech organization corpus, keeps the checked-in authoritative
public guidance, and regenerates a matched synthetic threat/training matrix for
every supported role and delivery channel.

Usage:
    python backend/scripts/generate_synthetic_knowledgebases.py
    python backend/scripts/generate_synthetic_knowledgebases.py --check
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any


DATA_DIR = Path(__file__).resolve().parent / "data"
LEGACY_TRAINING_FILE = Path(__file__).resolve().parent.parent / "data" / "cyber_training.json"
GENERATED_ON = "2026-09-23"
ORGANIZATION = "NovaTech (fictional)"
SYNTHETIC_SOURCE = "CyberGuard AI Synthetic Scenario Library v1.0"


ROLES: list[dict[str, Any]] = [
    {
        "code": "FIN",
        "role": "Finance Manager",
        "department": "Finance",
        "systems": "NetSuite ERP, the approved banking portal, Coupa procurement, and Microsoft 365",
        "contacts": "the CFO, Accounts Payable, Procurement, approved suppliers, and external auditors",
        "requests": "invoices, purchase-order exceptions, vendor bank-detail changes, and payment approvals",
        "authority": "may approve routine payments up to USD 10,000; larger or redirected payments require dual approval",
        "asset": "payment authority, bank details, invoice records, and financial forecasts",
        "risk_surface": "financial_access",
        "verification": "the vendor-master telephone number and the CFO's directory extension",
        "sensitive_action": "release a payment or change remittance details",
        "workflow": "match the purchase order, goods receipt, and invoice before recording approval in NetSuite",
    },
    {
        "code": "HR",
        "role": "HR Officer",
        "department": "Human Resources",
        "systems": "Workday, the recruitment portal, DocuSign, and Microsoft 365",
        "contacts": "employees, candidates, payroll, hiring managers, and benefits providers",
        "requests": "onboarding documents, payroll changes, benefit questions, and employee-record updates",
        "authority": "may prepare personnel updates but payroll and bank-detail changes require employee re-authentication and payroll review",
        "asset": "employee personal data, payroll details, identity documents, and candidate records",
        "risk_surface": "pii_and_payroll",
        "verification": "the employee's registered Workday contact method or an in-person HR check",
        "sensitive_action": "change payroll data or disclose an employee record",
        "workflow": "open the case in Workday, validate identity, obtain Payroll review, and retain the audit entry",
    },
    {
        "code": "ITA",
        "role": "IT Administrator",
        "department": "IT & Security",
        "systems": "Entra ID, Okta, Jira Service Management, endpoint management, and the privileged-access vault",
        "contacts": "employees, managed-service providers, Security Operations, and application owners",
        "requests": "password resets, access grants, device enrollment, incident triage, and system changes",
        "authority": "may perform approved administrative changes only against a valid ticket and never shares vault credentials",
        "asset": "privileged identities, endpoint controls, cloud administration, and recovery mechanisms",
        "risk_surface": "privileged_access",
        "verification": "the Jira ticket, corporate directory callback, and privileged-access approval record",
        "sensitive_action": "reset an account, grant access, or run an administrative command",
        "workflow": "confirm the ticket requester, obtain system-owner approval, use the vault, and log the completed change",
    },
    {
        "code": "DEV",
        "role": "Software Developer",
        "department": "Engineering / DevOps",
        "systems": "GitHub Enterprise, Jira, the CI/CD platform, package registries, and the secrets vault",
        "contacts": "engineering peers, reviewers, DevOps, product managers, and approved technology vendors",
        "requests": "code reviews, build failures, package updates, repository invitations, and API integration changes",
        "authority": "may merge reviewed code within owned repositories but production changes and secrets require protected workflows",
        "asset": "source code, API tokens, build pipelines, package integrity, and customer-facing services",
        "risk_surface": "source_code_and_ci_cd",
        "verification": "the linked Jira issue, signed repository identity, and protected pull-request review",
        "sensitive_action": "run code, expose a token, install a package, or approve a production change",
        "workflow": "link the Jira issue, inspect the diff and dependency provenance, obtain review, and use the protected pipeline",
    },
    {
        "code": "CS",
        "role": "Customer Support Agent",
        "department": "Customer Support",
        "systems": "Zendesk, the customer identity console, the CRM, telephony, and Microsoft 365",
        "contacts": "customers, account managers, engineering escalation teams, and support supervisors",
        "requests": "account recovery, billing questions, profile updates, data exports, and incident escalation",
        "authority": "may handle standard support cases but cannot bypass identity checks or export restricted customer data",
        "asset": "customer identities, support history, contact data, and account-recovery controls",
        "risk_surface": "customer_data_and_recovery",
        "verification": "the approved customer identity challenge and the account's registered contact details",
        "sensitive_action": "reset an account, change a customer identity, or export support data",
        "workflow": "record the case in Zendesk, complete the identity challenge, apply least privilege, and document the outcome",
    },
    {
        "code": "EA",
        "role": "Executive Assistant",
        "department": "Executive Office",
        "systems": "Microsoft 365, the board portal, travel systems, DocuSign, and the visitor platform",
        "contacts": "executives, board members, Finance, Legal, investors, and travel providers",
        "requests": "calendar changes, confidential documents, travel arrangements, signatures, and executive introductions",
        "authority": "may coordinate executive logistics but cannot approve payments, disclose board material, or waive policy",
        "asset": "executive schedules, board documents, strategic plans, and high-trust communication paths",
        "risk_surface": "executive_and_board_data",
        "verification": "the executive's directory number, board-portal identity, or an in-person confirmation",
        "sensitive_action": "release board material, alter executive access, or authorize a confidential request",
        "workflow": "confirm the requester through the executive directory, classify the material, and use the approved board or document portal",
    },
    {
        "code": "PROC",
        "role": "Procurement Specialist",
        "department": "Procurement",
        "systems": "Coupa, the vendor-management portal, NetSuite ERP, DocuSign, and Microsoft 365",
        "contacts": "suppliers, Legal, Finance, budget owners, and vendor-risk reviewers",
        "requests": "supplier onboarding, quotations, contract signatures, purchase orders, and bank-detail updates",
        "authority": "may create supplier and purchase-order records after due diligence but cannot independently approve payment redirection",
        "asset": "supplier identities, contracts, purchase orders, pricing, and payment-routing data",
        "risk_surface": "supply_chain_and_payments",
        "verification": "the master supplier record, known contract contact, and vendor-risk approval",
        "sensitive_action": "onboard a supplier, change vendor details, or approve a purchase-order exception",
        "workflow": "complete due diligence, validate tax and banking evidence, obtain Legal and Finance approvals, and activate the supplier in Coupa",
    },
]


CHANNELS: list[dict[str, Any]] = [
    {
        "channel": "email",
        "label": "email",
        "attack": "targeted spear-phishing email",
        "category": "phishing_recognition",
        "policy_id": "COM-EMAIL-01",
        "lure": "uses a sender domain visually similar to novatech.example, a reply-chain imitation, and an urgent attachment or sign-in link",
        "indicators": ["look-alike sender domain", "unexpected attachment or link", "artificial deadline"],
        "response": "Do not reply, open the attachment, or use the embedded link. Inspect the full sender address, open the relevant system from a trusted bookmark, verify independently, and report the message",
    },
    {
        "channel": "voice_phone",
        "label": "phone or voicemail",
        "attack": "vishing and voice-clone impersonation",
        "category": "vishing_defense",
        "policy_id": "COM-VOICE-01",
        "lure": "spoofs caller ID and imitates a trusted manager while claiming that normal verification cannot be used",
        "indicators": ["caller-ID trust", "refusal of callback", "request for secret or urgent action"],
        "response": "End the call without sharing information. Call the person or service through a known directory number, state that voice familiarity is not proof, and report the call details",
    },
    {
        "channel": "slack_teams",
        "label": "Slack or Teams direct message",
        "attack": "compromised collaboration-account message",
        "category": "chat_compromise_defense",
        "policy_id": "COM-CHAT-01",
        "lure": "uses a familiar display name to request a file, token, script, approval, or off-platform action without a ticket",
        "indicators": ["unexpected direct message", "missing ticket or case", "request for token, script, or sensitive file"],
        "response": "Do not share data, secrets, or run commands from chat. Verify using the official ticket or case and contact the sender through a second trusted channel before reporting the message",
    },
    {
        "channel": "qr_code",
        "label": "QR code",
        "attack": "QR-code phishing (quishing)",
        "category": "quishing_detection",
        "policy_id": "COM-QR-01",
        "lure": "places an unapproved QR code in a notice or PDF that claims scanning is required for authentication or document access",
        "indicators": ["obscured destination", "unapproved physical or PDF notice", "credential request after scan"],
        "response": "Do not scan the code. Check the notice owner and destination through an approved portal, photograph or preserve the notice without visiting it, and report it for removal or investigation",
    },
    {
        "channel": "cloud_oauth",
        "label": "cloud OAuth consent screen",
        "attack": "malicious OAuth application consent",
        "category": "oauth_consent_defense",
        "policy_id": "COM-OAUTH-01",
        "lure": "presents an unverified productivity app that asks for persistent access to mail, files, contacts, or administrative data",
        "indicators": ["unverified publisher", "excessive permissions", "persistent offline access"],
        "response": "Deny consent and close the screen. Check the approved application catalog, report the app and requested scopes, and ask Security Operations to revoke consent if it was already granted",
    },
    {
        "channel": "sms_push",
        "label": "SMS or authentication push",
        "attack": "MFA fatigue and helpdesk SMS pretext",
        "category": "mfa_fatigue_defense",
        "policy_id": "COM-MFA-01",
        "lure": "sends repeated unsolicited approval prompts followed by a message claiming IT needs the user to accept or share a code",
        "indicators": ["uninitiated authentication", "repeated prompts", "request to approve or disclose a one-time code"],
        "response": "Deny every uninitiated prompt and never share a code. Change the password from a known device, contact Security Operations through the official directory, and preserve the prompt details",
    },
    {
        "channel": "physical_media",
        "label": "removable media or cable",
        "attack": "malicious removable-media baiting",
        "category": "removable_media_defense",
        "policy_id": "COM-MEDIA-01",
        "lure": "leaves a USB drive or cable with a curiosity-inducing work label near the employee's workspace",
        "indicators": ["unknown physical origin", "sensitive or tempting label", "prompt to run a file or connect a device"],
        "response": "Do not connect the device to any corporate or personal system. Note where it was found, avoid altering it, and hand it to Corporate Security or IT for controlled analysis",
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def org_metadata(record_id: str, title: str, department: str, policy_id: str | None = None) -> dict[str, Any]:
    metadata: dict[str, Any] = {
        "record_id": record_id,
        "title": title,
        "source": "NovaTech Synthetic Organization Handbook v1.0",
        "department": department,
        "dataset_type": "fictional_demo_organization_policy",
        "organization": ORGANIZATION,
        "provenance_note": "Synthetic policy used for CyberGuard AI demonstration; not an external standard.",
        "last_reviewed": GENERATED_ON,
    }
    if policy_id:
        metadata["policy_id"] = policy_id
    return metadata


def build_org_records() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = [
        {
            "category": "company_profile",
            "content": (
                "NovaTech Solutions is a fictional regional software and managed-services company used only for CyberGuard AI demonstrations. "
                "Its official simulated domain is novatech.example. The company operates Finance, Human Resources, IT and Security, Engineering, "
                "Customer Support, Executive, and Procurement functions. Security reports use the simulated Security Alert button or "
                "security@novatech.example; no record in this corpus describes a real person, company, incident, or credential."
            ),
            "metadata": org_metadata("ORG-001", "Company profile and safe simulation boundary", "General Enterprise", "ORG-GEN-01"),
        }
    ]

    record_number = 2
    for role in ROLES:
        role_id = f"ROLE-{role['code']}-01"
        records.append({
            "category": "role_profile",
            "content": (
                f"{role['role']} role profile: This employee works in {role['department']} using {role['systems']}. "
                f"They communicate with {role['contacts']} and normally receive {role['requests']}. Their authority is limited as follows: "
                f"{role['authority']}. High-value assets include {role['asset']}."
            ),
            "metadata": {
                **org_metadata(f"ORG-{record_number:03d}", f"{role['role']} role profile", role["department"]),
                "role_id": role_id,
                "role": role["role"],
                "risk_surface": role["risk_surface"],
            },
        })
        record_number += 1

        records.append({
            "category": "workflow",
            "content": (
                f"{role['code']}-WF-01: Standard {role['role']} workflow. Before the employee may {role['sensitive_action']}, they must "
                f"{role['workflow']}. Requests arriving through email, phone, chat, QR code, OAuth prompt, MFA notification, or physical media "
                f"do not replace any approval or identity-verification step."
            ),
            "metadata": {
                **org_metadata(f"ORG-{record_number:03d}", f"{role['role']} standard workflow", role["department"], f"{role['code']}-WF-01"),
                "role": role["role"],
                "applies_to": role["role"],
                "enforcement_level": "MANDATORY",
            },
        })
        record_number += 1

        records.append({
            "category": "policy",
            "content": (
                f"{role['code']}-SEC-01: Independent verification for {role['department']}. Any unexpected request to {role['sensitive_action']} "
                f"must be verified using {role['verification']}, never contact details supplied by the requester. {role['role']} staff must preserve "
                f"the request, stop processing when identity is uncertain, and report suspected impersonation to Security Operations."
            ),
            "metadata": {
                **org_metadata(f"ORG-{record_number:03d}", f"{role['role']} independent verification", role["department"], f"{role['code']}-SEC-01"),
                "role": role["role"],
                "applies_to": role["role"],
                "risk_level": "critical",
                "enforcement_level": "MANDATORY",
            },
        })
        record_number += 1

        records.append({
            "category": "data_handling",
            "content": (
                f"{role['code']}-DATA-01: {role['asset'].capitalize()} may be accessed only through approved systems and shared only with verified, "
                f"authorized recipients. {role['role']} staff must not send the data to personal accounts, paste it into unapproved applications, "
                f"upload it through message links, or copy it to unapproved removable media."
            ),
            "metadata": {
                **org_metadata(f"ORG-{record_number:03d}", f"{role['role']} data handling", role["department"], f"{role['code']}-DATA-01"),
                "role": role["role"],
                "applies_to": role["role"],
                "risk_level": "high",
                "enforcement_level": "MANDATORY",
            },
        })
        record_number += 1

        records.append({
            "category": "communication_norm",
            "content": (
                f"{role['code']}-COM-01: Normal {role['department']} communication is linked to an approved case, ticket, purchase order, or system record. "
                f"Colleagues do not object to verification, ask the recipient to bypass controls, or request passwords, MFA codes, secrets, or confidential "
                f"exports in a message. Unexpected requests concerning {role['requests']} must be checked through {role['verification']}."
            ),
            "metadata": {
                **org_metadata(f"ORG-{record_number:03d}", f"{role['department']} communication norm", role["department"], f"{role['code']}-COM-01"),
                "role": role["role"],
                "applies_to": role["role"],
            },
        })
        record_number += 1

        records.append({
            "category": "attack_exposure",
            "content": (
                f"{role['code']}-RISK-01: The {role['role']} is a likely social-engineering target because the role can influence {role['asset']}. "
                f"Likely pretexts imitate {role['contacts']} and reference {role['requests']}. Pressure, secrecy, a change of channel, or instructions to "
                f"ignore the standard workflow are indicators that require independent verification and reporting."
            ),
            "metadata": {
                **org_metadata(f"ORG-{record_number:03d}", f"{role['role']} attack exposure", role["department"], f"{role['code']}-RISK-01"),
                "role": role["role"],
                "risk_surface": role["risk_surface"],
            },
        })
        record_number += 1

    for channel in CHANNELS:
        records.append({
            "category": "channel_policy",
            "content": (
                f"{channel['policy_id']}: NovaTech {channel['label']} rule. A request delivered through {channel['label']} must never be treated as identity "
                f"proof or as authorization to bypass an established workflow. Warning indicators include {', '.join(channel['indicators'])}. "
                f"Required response: {channel['response']}."
            ),
            "metadata": {
                **org_metadata(f"ORG-{record_number:03d}", f"{channel['label'].title()} security rule", "General Enterprise", channel["policy_id"]),
                "channel": channel["channel"],
                "applies_to": "All Employees",
                "enforcement_level": "MANDATORY",
            },
        })
        record_number += 1

    return records


def keep_authoritative(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        row for row in records
        if row.get("metadata", {}).get("source_type") == "authoritative_public_guidance"
    ]


def build_synthetic_threats(start_number: int = 1) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    number = start_number
    for role in ROLES:
        for channel in CHANNELS:
            scenario_id = f"SYN-{role['code']}-{channel['channel'].upper()}"
            record_id = f"THR-SYN-{number:03d}"
            records.append({
                "category": "attack_pattern",
                "source": SYNTHETIC_SOURCE,
                "content": (
                    f"Synthetic scenario {scenario_id} targets a {role['role']} through {channel['label']} using {channel['attack']}. The fictional attacker "
                    f"{channel['lure']} and frames the request around {role['requests']}. Observable indicators are {', '.join(channel['indicators'])}. "
                    f"Compliance could expose {role['asset']}. This controlled example contains no real victim, live malicious address, or executable payload."
                ),
                "metadata": {
                    "record_id": record_id,
                    "scenario_id": scenario_id,
                    "source": SYNTHETIC_SOURCE,
                    "source_type": "synthetic_scenario",
                    "dataset_type": "synthetic_threat_scenario",
                    "provenance_note": "Fictional attack pattern generated for defensive CyberGuard AI training; not a real incident or external intelligence report.",
                    "attack_type": channel["attack"].title(),
                    "channel": channel["channel"],
                    "target_role": role["role"],
                    "target_department": role["department"],
                    "risk_surface": role["risk_surface"],
                    "severity": "high" if role["code"] in {"FIN", "ITA", "EA", "PROC"} else "medium",
                    "indicators": channel["indicators"],
                    "related_policy_id": channel["policy_id"],
                    "safe_for_training": True,
                    "generated_on": GENERATED_ON,
                },
            })
            number += 1
    return records


def build_synthetic_training(start_number: int = 1) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    number = start_number
    for role in ROLES:
        for channel in CHANNELS:
            scenario_id = f"SYN-{role['code']}-{channel['channel'].upper()}"
            threat_id = f"THR-SYN-{number:03d}"
            record_id = f"TRN-SYN-{number:03d}"
            records.append({
                "category": channel["category"],
                "channel": channel["channel"],
                "target_risk_surface": role["risk_surface"],
                "source": SYNTHETIC_SOURCE,
                "content": (
                    f"Role-specific exercise for a {role['role']} facing {channel['attack']} through {channel['label']}: {channel['response']}. "
                    f"Before attempting to {role['sensitive_action']}, verify using {role['verification']} and follow {role['code']}-WF-01 plus "
                    f"{channel['policy_id']}. Preserve the message, call, prompt, or device details and report scenario {scenario_id} through the simulated "
                    f"Security Alert channel. Successful behavior is to stop, verify independently, protect {role['asset']}, and report without interacting with the lure."
                ),
                "metadata": {
                    "record_id": record_id,
                    "scenario_id": scenario_id,
                    "paired_threat_id": threat_id,
                    "source": SYNTHETIC_SOURCE,
                    "source_type": "synthetic_training_guidance",
                    "dataset_type": "synthetic_training_module",
                    "provenance_note": "Fictional defensive exercise generated for CyberGuard AI demonstration; not an external standard.",
                    "framework": "NovaTech Synthetic Controls",
                    "level": "role_based",
                    "target_role": role["role"],
                    "target_department": role["department"],
                    "channel": channel["channel"],
                    "risk_surface": role["risk_surface"],
                    "related_policy_ids": [f"{role['code']}-WF-01", channel["policy_id"]],
                    "learning_objectives": [
                        f"Recognize {channel['attack']}",
                        "Verify through a trusted independent channel",
                        "Preserve evidence and report promptly",
                    ],
                    "expected_behavior": "stop_verify_report",
                    "safe_for_training": True,
                    "generated_on": GENERATED_ON,
                },
            })
            number += 1
    return records


def build_manifest(org: list[dict[str, Any]], threats: list[dict[str, Any]], training: list[dict[str, Any]]) -> dict[str, Any]:
    threat_synthetic = sum(row.get("metadata", {}).get("source_type") == "synthetic_scenario" for row in threats)
    training_synthetic = sum(row.get("metadata", {}).get("source_type") == "synthetic_training_guidance" for row in training)
    return {
        "dataset_name": "CyberGuard AI hybrid knowledge corpus",
        "version": GENERATED_ON,
        "method": (
            "Deterministic synthetic NovaTech role/channel matrix combined with the existing manually paraphrased authoritative public guidance. "
            "Synthetic records contain no personal data and are explicitly labeled; public guidance retains direct source URLs."
        ),
        "coverage": {
            "roles": [role["role"] for role in ROLES],
            "channels": [channel["channel"] for channel in CHANNELS],
            "synthetic_role_channel_combinations": len(ROLES) * len(CHANNELS),
        },
        "files": {
            "org_knowledge_chunks.json": {
                "records": len(org),
                "purpose": "Scenario Agent organization-context RAG",
                "provenance": "Fictional NovaTech organization policies, roles, workflows, communication norms, and attack exposure",
                "synthetic_records": len(org),
            },
            "threat_chunks.json": {
                "records": len(threats),
                "purpose": "Evaluation Agent threat-pattern RAG",
                "provenance": "Existing FBI IC3, CISA, NIST, MITRE ATT&CK, and FTC paraphrases plus explicit synthetic scenarios",
                "authoritative_records": len(threats) - threat_synthetic,
                "synthetic_records": threat_synthetic,
            },
            "training_chunks.json": {
                "records": len(training),
                "purpose": "Coach Agent remediation RAG",
                "provenance": "Existing CISA, NIST, FBI IC3, and MITRE ATT&CK paraphrases plus explicit synthetic role-based exercises",
                "authoritative_records": len(training) - training_synthetic,
                "synthetic_records": training_synthetic,
            },
        },
        "source_policy": {
            "authoritative_content_form": "Original paraphrases with direct source URLs",
            "synthetic_content_form": "Clearly labeled fictional defensive examples with no claim of external authority",
            "personal_data": "None",
            "live_malicious_content": "None",
        },
    }


def validate(org: list[dict[str, Any]], threats: list[dict[str, Any]], training: list[dict[str, Any]]) -> None:
    expected_pairs = {(role["role"], channel["channel"]) for role in ROLES for channel in CHANNELS}
    synthetic_threats = [row for row in threats if row.get("metadata", {}).get("source_type") == "synthetic_scenario"]
    synthetic_training = [row for row in training if row.get("metadata", {}).get("source_type") == "synthetic_training_guidance"]

    assert len(org) == 50, f"Expected 50 organization records, found {len(org)}"
    assert len(synthetic_threats) == 49, f"Expected 49 synthetic threats, found {len(synthetic_threats)}"
    assert len(synthetic_training) == 49, f"Expected 49 synthetic training modules, found {len(synthetic_training)}"

    threat_pairs = {(row["metadata"]["target_role"], row["metadata"]["channel"]) for row in synthetic_threats}
    training_pairs = {(row["metadata"]["target_role"], row["channel"]) for row in synthetic_training}
    assert threat_pairs == expected_pairs
    assert training_pairs == expected_pairs

    all_records = org + threats + training
    ids = [row["metadata"].get("record_id") for row in all_records]
    duplicate_ids = [value for value, count in Counter(ids).items() if value and count > 1]
    assert not duplicate_ids, f"Duplicate record IDs: {duplicate_ids}"

    for row in all_records:
        content = row.get("content", "").strip()
        assert 10 <= len(content.split()) <= 150, f"Invalid chunk length: {row.get('metadata', {}).get('record_id')}"
    for row in synthetic_threats + synthetic_training:
        assert row["metadata"]["safe_for_training"] is True
        assert "not a real incident" in row["metadata"].get("provenance_note", "") or "not an external standard" in row["metadata"].get("provenance_note", "")


def generate(check_only: bool = False) -> dict[str, int]:
    threat_path = DATA_DIR / "threat_chunks.json"
    training_path = DATA_DIR / "training_chunks.json"
    authoritative_threats = keep_authoritative(read_json(threat_path))
    authoritative_training = keep_authoritative(read_json(training_path))

    org = build_org_records()
    threats = authoritative_threats + build_synthetic_threats()
    training = authoritative_training + build_synthetic_training()
    validate(org, threats, training)

    if check_only:
        current_org = read_json(DATA_DIR / "org_knowledge_chunks.json")
        current_threats = read_json(threat_path)
        current_training = read_json(training_path)
        assert current_org == org, "org_knowledge_chunks.json is not synchronized; run the generator"
        assert current_threats == threats, "threat_chunks.json is not synchronized; run the generator"
        assert current_training == training, "training_chunks.json is not synchronized; run the generator"
        assert read_json(LEGACY_TRAINING_FILE) == training, "legacy cyber_training.json is not synchronized"
        assert read_json(DATA_DIR / "dataset_manifest.json") == build_manifest(org, threats, training), "dataset manifest is not synchronized"
    else:
        write_json(DATA_DIR / "org_knowledge_chunks.json", org)
        write_json(threat_path, threats)
        write_json(training_path, training)
        write_json(LEGACY_TRAINING_FILE, training)
        write_json(DATA_DIR / "dataset_manifest.json", build_manifest(org, threats, training))

    return {"org_knowledge": len(org), "cyber_threats": len(threats), "cyber_training": len(training)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate CyberGuard AI synthetic knowledge-base data.")
    parser.add_argument("--check", action="store_true", help="Validate generated data without writing files.")
    args = parser.parse_args()
    counts = generate(check_only=args.check)
    action = "Validated" if args.check else "Generated"
    print(f"{action} knowledge bases: " + ", ".join(f"{name}={count}" for name, count in counts.items()))


if __name__ == "__main__":
    main()
