import os
import sys
import argparse
import logging

# Ensure project root is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib

from ml.features.url_features import extract_url_features, FEATURE_NAMES
from ml.generate_dataset import generate_sample_dataset

DATASET_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "data", "dataset.csv"))
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "models", "phishing_model.joblib"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def train_phishing_model(dataset_path: str = None):
    logger.info("=== PhishGuard ML Training Pipeline ===")

    # Use an explicitly-provided real dataset when given.
    # Otherwise fall back to the synthetic sample dataset for pipeline demonstration.
    if dataset_path:
        DATA_SOURCE = os.path.abspath(dataset_path)
        is_synthetic = False
    else:
        DATA_SOURCE = DATASET_PATH
        is_synthetic = not os.path.exists(DATA_SOURCE)
        if is_synthetic:
            logger.info("Dataset not found. Generating sample dataset...")
            generate_sample_dataset(DATA_SOURCE)

    if is_synthetic:
        logger.warning("Training on the SYNTHETIC sample dataset (procedurally generated URLs).")
        logger.warning("Metrics below demonstrate the pipeline only and are NOT a claim about real-world performance.")
        logger.warning("Provide a real dataset with `--dataset path/to/urls.csv` for meaningful results.")
        logger.warning("See README.md -> 'Using a real dataset' for details.\n")

    logger.info(f"Loading dataset from: {DATA_SOURCE}")
    df = pd.read_csv(DATA_SOURCE)
    logger.info(f"Total samples: {len(df)}")
    logger.info(f"Class distribution:\n{df['label'].value_counts()}")

    print("\nExtracting URL features...")
    feature_rows = []
    labels = []

    for idx, row in df.iterrows():
        url = str(row['url'])
        label = int(row['label'])
        feats = extract_url_features(url)
        # Ensure ordered list of values matching FEATURE_NAMES
        feat_vector = [feats[name] for name in FEATURE_NAMES]
        feature_rows.append(feat_vector)
        labels.append(label)

    X = np.array(feature_rows)
    y = np.array(labels)

    print(f"Feature matrix shape: {X.shape}")

    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Training samples: {len(X_train)}, Testing samples: {len(X_test)}")

    # Train Random Forest
    print("\nTraining RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    print("\n=== Model Evaluation Results ===")
    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall:    {rec * 100:.2f}%")
    print(f"F1-Score:  {f1 * 100:.2f}%")
    print(f"Confusion Matrix:\n{cm}")

    # Save model artifact
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model_payload = {
        "model": clf,
        "feature_names": FEATURE_NAMES,
        "metrics": {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1)
        },
        "feature_importances": dict(zip(FEATURE_NAMES, clf.feature_importances_))
    }
    joblib.dump(model_payload, MODEL_PATH)
    print(f"\nTrained model successfully saved to: {MODEL_PATH}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the PhishGuard URL phishing classifier.")
    parser.add_argument(
        "--dataset",
        help="Optional path to a real CSV dataset with columns 'url' and 'label' (0=legit, 1=phishing). "
        "If omitted, the synthetic sample dataset is generated/used.",
    )
    args = parser.parse_args()
    train_phishing_model(dataset_path=args.dataset)
