# PhishGuard — Machine Learning

## Overview

The phishing classifier is a **scikit-learn Random Forest** trained on URL features. It runs entirely
locally — no external ML API is used as the classifier.

Feature extraction lives in a single shared module, `ml/features/url_features.py`, used **identically**
during training and production inference to avoid train/serve skew. See `FEATURE_NAMES` for the full set.

## Feature set

| Feature | Meaning |
| --- | --- |
| `url_length` | Total URL length |
| `domain_length` | Host/label length |
| `path_length` | Path length |
| `dot_count` | Number of dots |
| `subdomain_count` | Labels to the left of the registered domain |
| `digit_count` | Number of digits |
| `special_char_count` | Number of special characters |
| `hyphen_count` | Number of hyphens |
| `has_ip` | Raw IP address used as host |
| `is_https` | Uses HTTPS |
| `has_at_symbol` | Contains `@` |
| `is_encoded` | Contains percent-encoding |
| `has_query` | Has a query string |
| `has_fragment` | Has a fragment |
| `suspicious_keyword_count` | Count of lure keywords present |
| `tld_in_path` | A common TLD appears inside the path |
| `double_slash_in_path` | Path contains `//` |
| `domain_entropy` | Shannon entropy of the domain string |

## Current model artifact

`ml/models/phishing_model.joblib` is a joblib bundle containing:

- `model` — the trained `RandomForestClassifier`
- `feature_names` — the exact feature ordering used at inference
- `metrics` — evaluation metrics recorded at training time
- `feature_importances` — per-feature Gini importance (a *relative* measure, not causal proof)

> **Important**: the committed artifact was trained on the **synthetic sample dataset**
> (`generate_dataset.py`). Its recorded metrics describe that synthetic distribution only. They are a
> demonstration of a working pipeline, **not** a claim about real-world phishing detection accuracy.

## Datasets

### Current (synthetic fallback)

- **Source:** `generate_dataset.py` — procedurally generated URLs that mirror realistic legitimate and
  phishing structures for pipeline development.
- **License:** N/A (generated internally).
- **Class distribution:** 5,000 legitimate / 5,000 phishing (balanced by construction).
- **Purpose:** let the full train → evaluate → export → serve pipeline run with zero external data.

### Real datasets (recommended for evaluation)

To produce a meaningful model, train on a real, freely available dataset of legitimate + phishing URLs.
Use one with a permissive/licensed reuse and document it here. Options:

- **PhishTank** (`https://www.phishtank.com/`) — verified phishing URLs; check its data/usage terms.
- **OpenPhish feed** — check its own terms before reuse.
- **Kaggle / Mendeley URL-classification CSVs** — many include a `url`/`label` column; confirm the
  per-dataset license before use.

**Required preprocessing** (documented before relying on any numbers):

1. Record the dataset **source, license, and fetch date**.
2. Inspect **class distribution**; report it.
3. **Clean** rows (drop empty URLs, deduplicate).
4. Confirm labels: `0` = legitimate, `1` = phishing/malicious.

### Preparing a CSV

```csv
url,label
https://example.com,0
http://bank-verify.xyz/login.php,1
```

## Training

```bash
# Train on the synthetic fallback (demonstrates the pipeline)
python -m ml.train

# Train on a real dataset
python -m ml.train --dataset ml/data/my_real_dataset.csv
```

`ml/train.py`:
1. Loads + cleans the dataset.
2. Extracts features with `extract_url_features` (same code as inference).
3. Splits 80/20 (stratified, `random_state=42`).
4. Trains a `RandomForestClassifier`.
5. Evaluates honestly: **accuracy, precision, recall, F1**, and a **confusion matrix**.
6. Exports `ml/models/phishing_model.joblib`.

## Evaluation honesty

For phishing detection, **false negatives are the worst outcome** (a real phishing site called safe),
but false positives (safe sites called phishing) also erode trust. Read both carefully. Never optimize
for raw accuracy alone, and never fabricate metrics. Report the real confusion matrix.

## Inference

The backend loads the artifact on startup (`backend/app/services/ml/predictor.py`). For each URL it runs
the same feature extractor, calls `model.predict_proba`, and returns:

- `prediction` — 0 (legitimate) / 1 (phishing)
- `probability` — model's phishing probability (0–1)

If the artifact is absent or fails to load, the service operates in a documented **heuristic fallback**
mode using the same feature signals — it does not claim to be a trained model.
