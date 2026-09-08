import os
import joblib
import logging
from typing import Dict, Any, Tuple
from ml.features.url_features import extract_url_features, FEATURE_NAMES

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "phishing_model.joblib"))

logger = logging.getLogger(__name__)

class MLPredictorService:
    def __init__(self):
        self.model = None
        self.feature_names = FEATURE_NAMES
        self.feature_importances = {}
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                payload = joblib.load(MODEL_PATH)
                if isinstance(payload, dict) and "model" in payload:
                    self.model = payload["model"]
                    self.feature_names = payload.get("feature_names", FEATURE_NAMES)
                    self.feature_importances = payload.get("feature_importances", {})
                else:
                    self.model = payload
                logger.info(f"PhishGuard ML model successfully loaded from {MODEL_PATH}")
            except Exception as e:
                logger.warning(f"Failed to load ML model from {MODEL_PATH}: {e}. Operating in fallback heuristic inference mode.")
                self.model = None
        else:
            logger.info(f"ML model file not found at {MODEL_PATH}. Operating in feature-heuristic inference mode until model is trained.")
            self.model = None

    def predict_url(self, url: str) -> Tuple[int, float, Dict[str, Any], Dict[str, float]]:
        """
        Extract URL features and perform ML model inference.
        Returns:
            - prediction: 0 (Legitimate) or 1 (Phishing)
            - probability: float (0.0 to 1.0)
            - features: Dict of extracted URL features
            - feature_importances: Dict of top feature importances
        """
        features = extract_url_features(url)
        feat_vector = [[features[name] for name in self.feature_names]]

        if self.model is not None:
            try:
                probs = self.model.predict_proba(feat_vector)[0]
                # Class 1 is Phishing
                phishing_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
                prediction = 1 if phishing_prob >= 0.5 else 0
                return prediction, round(phishing_prob, 4), features, self.feature_importances
            except Exception as e:
                logger.error(f"Error during ML model inference: {e}")

        # Fallback Heuristic Probability calculation if joblib model artifact is uninitialized
        score = 0.0
        if features["has_ip"]: score += 0.35
        if features["suspicious_keyword_count"] > 0: score += min(0.30, features["suspicious_keyword_count"] * 0.15)
        if features["url_length"] > 75: score += 0.15
        if features["subdomain_count"] >= 2: score += 0.15
        if features["has_at_symbol"]: score += 0.20
        if features["tld_in_path"]: score += 0.20
        if features["double_slash_in_path"]: score += 0.15
        if not features["is_https"]: score += 0.10
        if features["domain_entropy"] > 4.2: score += 0.15

        prob = min(0.95, score)
        pred = 1 if prob >= 0.5 else 0

        default_importances = {
            "suspicious_keyword_count": 0.22,
            "has_ip": 0.18,
            "domain_entropy": 0.15,
            "subdomain_count": 0.12,
            "url_length": 0.10,
            "tld_in_path": 0.08,
            "has_at_symbol": 0.07,
            "is_https": 0.05,
            "digit_count": 0.03
        }

        return pred, round(prob, 4), features, default_importances

predictor_service = MLPredictorService()
