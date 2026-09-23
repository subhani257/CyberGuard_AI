import json
from pathlib import Path
from urllib.parse import urlparse


DATA_DIR = Path(__file__).resolve().parent.parent / "scripts" / "data"
LEGACY_TRAINING_FILE = Path(__file__).resolve().parent.parent / "data" / "cyber_training.json"
ALLOWED_SOURCE_DOMAINS = {
    "attack.mitre.org",
    "consumer.ftc.gov",
    "csrc.nist.gov",
    "www.cisa.gov",
    "www.ic3.gov",
    "www.nist.gov",
    "nvlpubs.nist.gov",
    "pages.nist.gov",
}


def load(name: str):
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


def assert_unique(records, field_getter):
    values = [field_getter(record) for record in records]
    assert all(values)
    assert len(values) == len(set(values))


def test_real_world_threat_corpus_is_source_linked_and_unique():
    records = load("threat_chunks.json")
    assert len(records) >= 80
    assert_unique(records, lambda row: row["metadata"]["record_id"])
    assert_unique(records, lambda row: row["content"])

    for row in records:
        metadata = row["metadata"]
        assert row["category"] in {
            "threat_definition", "attack_pattern", "incident_report", "reconnaissance"
        }
        assert 10 <= len(row["content"].split()) <= 150
        if metadata["source_type"] == "authoritative_public_guidance":
            assert metadata["extraction_method"] == "manual_paraphrase"
            parsed = urlparse(metadata["url"])
            assert parsed.scheme == "https"
            assert parsed.netloc in ALLOWED_SOURCE_DOMAINS
        else:
            assert metadata["source_type"] == "synthetic_scenario"
            assert metadata["dataset_type"] == "synthetic_threat_scenario"
            assert metadata["safe_for_training"] is True
            assert metadata["scenario_id"].startswith("SYN-")
            assert "not a real incident" in metadata["provenance_note"]


def test_training_corpus_has_required_channels_and_seed_fields():
    records = load("training_chunks.json")
    assert len(records) >= 80
    assert_unique(records, lambda row: row["metadata"]["record_id"])
    assert_unique(records, lambda row: row["content"])

    required_channels = {
        "email", "voice_phone", "slack_teams", "qr_code",
        "cloud_oauth", "sms_push", "physical_media"
    }
    assert required_channels.issubset({row["channel"] for row in records})

    for row in records:
        assert row["source"] == row["metadata"]["source"]
        assert row["target_risk_surface"]
        assert 10 <= len(row["content"].split()) <= 150
        metadata = row["metadata"]
        if metadata["source_type"] == "authoritative_public_guidance":
            parsed = urlparse(metadata["url"])
            assert parsed.scheme == "https"
            assert parsed.netloc in ALLOWED_SOURCE_DOMAINS
        else:
            assert metadata["source_type"] == "synthetic_training_guidance"
            assert metadata["dataset_type"] == "synthetic_training_module"
            assert metadata["safe_for_training"] is True
            assert metadata["paired_threat_id"].startswith("THR-SYN-")
            assert metadata["expected_behavior"] == "stop_verify_report"


def test_organization_corpus_is_disclosed_as_fictional_demo_data():
    records = load("org_knowledge_chunks.json")
    assert len(records) == 50
    assert_unique(records, lambda row: row["metadata"]["record_id"])
    required_categories = {
        "company_profile", "role_profile", "workflow", "policy",
        "data_handling", "communication_norm", "attack_exposure", "channel_policy",
    }
    assert required_categories == {row["category"] for row in records}
    for row in records:
        metadata = row["metadata"]
        assert metadata["dataset_type"] == "fictional_demo_organization_policy"
        assert metadata["organization"] == "NovaTech (fictional)"
        assert "not an external standard" in metadata["provenance_note"]


def test_synthetic_role_channel_matrix_is_complete_and_cross_linked():
    threats = [
        row for row in load("threat_chunks.json")
        if row["metadata"]["source_type"] == "synthetic_scenario"
    ]
    training = [
        row for row in load("training_chunks.json")
        if row["metadata"]["source_type"] == "synthetic_training_guidance"
    ]
    roles = {
        "Finance Manager", "HR Officer", "IT Administrator", "Software Developer",
        "Customer Support Agent", "Executive Assistant", "Procurement Specialist",
    }
    channels = {
        "email", "voice_phone", "slack_teams", "qr_code",
        "cloud_oauth", "sms_push", "physical_media",
    }
    expected = {(role, channel) for role in roles for channel in channels}
    threat_matrix = {
        (row["metadata"]["target_role"], row["metadata"]["channel"]): row
        for row in threats
    }
    training_matrix = {
        (row["metadata"]["target_role"], row["channel"]): row
        for row in training
    }

    assert set(threat_matrix) == expected
    assert set(training_matrix) == expected
    assert len(threats) == len(training) == 49
    for key in expected:
        assert training_matrix[key]["metadata"]["paired_threat_id"] == threat_matrix[key]["metadata"]["record_id"]
        assert training_matrix[key]["metadata"]["scenario_id"] == threat_matrix[key]["metadata"]["scenario_id"]


def test_dataset_manifest_counts_match_files():
    manifest = load("dataset_manifest.json")
    for filename, details in manifest["files"].items():
        assert details["records"] == len(load(filename))


def test_training_seed_files_are_synchronized():
    canonical = load("training_chunks.json")
    legacy = json.loads(LEGACY_TRAINING_FILE.read_text(encoding="utf-8"))
    assert legacy == canonical
