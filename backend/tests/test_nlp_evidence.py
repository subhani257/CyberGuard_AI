from nlp.classifier import ReasoningClassifier


def test_without_checking_is_classified_as_naive_not_security_aware():
    classifier = ReasoningClassifier()
    result = classifier.classify(
        "It looked official, so I followed the instructions without checking."
    )
    assert result["category"] == "naive"

