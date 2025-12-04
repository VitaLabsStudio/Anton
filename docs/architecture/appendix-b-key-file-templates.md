# Appendix B: Key File Templates

## Claims Library Structure

```json
{
  "approved_phrases": [
    "designed to support normal breakdown processes",
    "formulated to help steady electrolytes",
    "delivers B-vitamins and antioxidant precursors through your skin",
    "transdermal delivery bypasses your digestive system"
  ],
  "prohibited_terms": [
    "cure",
    "prevent",
    "treat",
    "clinically proven",
    "doctor recommended",
    "FDA approved",
    "medical"
  ],
  "soft_benefits": [
    "may help you feel more like yourself",
    "supports your body's natural processes",
    "convenient alternative to pills when your stomach is upset"
  ],
  "version": "1.0",
  "last_updated": "2025-12-01",
  "approved_by": "Legal Team"
}
```

## Keyword Taxonomy Structure

```json
{
  "version": "1.0",
  "categories": {
    "direct_hangover": {
      "weight": 1.0,
      "terms": ["hangover", "hungover", "morning after", "day after drinking"]
    },
    "physical_symptoms_primary": {
      "weight": 0.9,
      "terms": ["nausea", "headache", "vomiting", "dehydrated", "dizzy"]
    },
    "recovery_intent": {
      "weight": 0.95,
      "terms": ["how to cure", "what helps", "need help", "remedy"]
    }
  },
  "exclusions": [
    "The Hangover",
    "soundtrack",
    "bitcoin",
    "ethereum"
  ]
}
```

---

---
