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
    assert len(records) >= 30
    assert_unique(records, lambda row: row["metadata"]["record_id"])
    assert_unique(records, lambda row: row["content"])

    for row in records:
        metadata = row["metadata"]
        assert row["category"] in {
            "threat_definition", "attack_pattern", "incident_report", "reconnaissance"
        }
        assert 10 <= len(row["content"].split()) <= 150
        assert metadata["source_type"] == "authoritative_public_guidance"
        assert metadata["extraction_method"] == "manual_paraphrase"
        parsed = urlparse(metadata["url"])
        assert parsed.scheme == "https"
        assert parsed.netloc in ALLOWED_SOURCE_DOMAINS


def test_training_corpus_has_required_channels_and_seed_fields():
    records = load("training_chunks.json")
    assert len(records) >= 30
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
        parsed = urlparse(row["metadata"]["url"])
        assert parsed.scheme == "https"
        assert parsed.netloc in ALLOWED_SOURCE_DOMAINS


def test_organization_corpus_is_disclosed_as_fictional_demo_data():
    records = load("org_knowledge_chunks.json")
    assert records
    for row in records:
        metadata = row["metadata"]
        assert metadata["dataset_type"] == "fictional_demo_organization_policy"
        assert metadata["organization"] == "NovaTech (fictional)"
        assert "not an external standard" in metadata["provenance_note"]


def test_dataset_manifest_counts_match_files():
    manifest = load("dataset_manifest.json")
    for filename, details in manifest["files"].items():
        assert details["records"] == len(load(filename))


def test_training_seed_files_are_synchronized():
    canonical = load("training_chunks.json")
    legacy = json.loads(LEGACY_TRAINING_FILE.read_text(encoding="utf-8"))
    assert legacy == canonical
