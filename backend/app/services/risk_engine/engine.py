from typing import Dict, List, Any, Tuple

class ExplainableRiskEngine:
    def calculate_risk(
        self,
        url: str,
        domain: str,
        providers: Dict[str, Dict[str, Any]],
        ml_prediction: int,
        ml_probability: float,
        features: Dict[str, Any]
    ) -> Tuple[int, str, List[Dict[str, str]], List[str], List[str]]:
        """
        Calculates a deterministic 0-100 risk score and classification.
        Generates explainable evidence items, reason strings, and user recommendations.
        """
        score = 0
        evidence: List[Dict[str, str]] = []
        reasons: List[str] = []
        recommendations: List[str] = []

        # 1. Threat Intelligence Evidence
        vt = providers.get("virustotal", {})
        if vt.get("matched"):
            stats = vt.get("details", {}).get("stats", {})
            malicious_count = stats.get("malicious", 1)
            pts = 40 if malicious_count >= 2 else 25
            score += pts
            reasons.append(f"VirusTotal threat intelligence flagged URL as malicious ({malicious_count} engine detection(s)).")
            evidence.append({
                "title": "VirusTotal Malicious Detections",
                "category": "Threat Intelligence",
                "description": f"{malicious_count} security vendor(s) on VirusTotal flagged this URL as harmful.",
                "risk_level": "critical" if malicious_count >= 3 else "high"
            })

        urlhaus = providers.get("urlhaus", {})
        if urlhaus.get("matched"):
            score += 35
            reasons.append("URLhaus database confirmed URL is actively distributing malware/phishing payloads.")
            evidence.append({
                "title": "URLhaus Active Malware Match",
                "category": "Threat Intelligence",
                "description": "Listed in the URLhaus threat database as an active malware distribution link.",
                "risk_level": "critical"
            })

        urlscan = providers.get("urlscan", {})
        if urlscan.get("matched"):
            score += 30
            reasons.append("urlscan.io repository contains past malicious scan verdicts for this domain.")
            evidence.append({
                "title": "urlscan.io Malicious Verdict",
                "category": "Threat Intelligence",
                "description": "Previous page scans on urlscan.io detected malicious DOM/network behavior.",
                "risk_level": "high"
            })

        # 2. Machine Learning Evidence
        ml_contrib = int(ml_probability * 35)
        score += ml_contrib
        if ml_probability >= 0.70:
            reasons.append(f"In-house Random Forest ML model predicted high phishing likelihood ({int(ml_probability * 100)}% probability).")
            evidence.append({
                "title": "Machine Learning Model Classifier",
                "category": "Machine Learning",
                "description": f"Extracted URL feature pattern aligns with known phishing URL structures ({int(ml_probability * 100)}% confidence).",
                "risk_level": "high"
            })
        elif ml_probability >= 0.45:
            reasons.append(f"Machine learning model flagged suspicious URL structural patterns ({int(ml_probability * 100)}% probability).")
            evidence.append({
                "title": "Machine Learning Model Classifier",
                "category": "Machine Learning",
                "description": f"URL exhibits mixed structural patterns common in credential lures ({int(ml_probability * 100)}% probability).",
                "risk_level": "medium"
            })

        # 3. Structural URL Feature Heuristics
        if features.get("has_ip"):
            score += 20
            reasons.append("URL uses a raw IP address instead of a registered domain name (e.g. 192.168.x.x).")
            evidence.append({
                "title": "IP Address Host",
                "category": "URL Structure",
                "description": "Legitimate organizations rarely request logins over raw IP address hostnames.",
                "risk_level": "high"
            })

        kw_count = features.get("suspicious_keyword_count", 0)
        if kw_count > 0:
            score += min(20, kw_count * 10)
            reasons.append(f"URL path/domain contains suspicious lure keyword(s) (count: {kw_count}).")
            evidence.append({
                "title": "Phishing Keyword Detection",
                "category": "Content Pattern",
                "description": "Contains sensitive keywords such as 'login', 'verify', 'banking', or 'account' in unconventional places.",
                "risk_level": "medium"
            })

        if features.get("subdomain_count", 0) >= 2:
            score += 15
            reasons.append("Excessive subdomains detected (e.g., paypal.com.evil-domain.xyz).")
            evidence.append({
                "title": "Excessive Subdomains",
                "category": "Domain Architecture",
                "description": "Attackers stack subdomains to trick users into mistaking the fake site for a legitimate brand.",
                "risk_level": "high"
            })

        if features.get("has_at_symbol"):
            score += 15
            reasons.append("URL contains an '@' symbol, which causes browsers to ignore preceding credentials and redirect to the host after '@'.")
            evidence.append({
                "title": "Obfuscated '@' Credentials",
                "category": "Obfuscation",
                "description": "The '@' character in URLs is a common trick used to mask the actual destination host.",
                "risk_level": "high"
            })

        if features.get("tld_in_path"):
            score += 15
            reasons.append("Top-Level Domain (e.g., .com, .net) embedded inside the URL path directory.")
            evidence.append({
                "title": "TLD In Path Obfuscation",
                "category": "Obfuscation",
                "description": "Embedding domain extensions in the path tries to impersonate legitimate brand URLs.",
                "risk_level": "medium"
            })

        if features.get("double_slash_in_path"):
            score += 10
            reasons.append("URL path contains double slashes ('//') to force sub-path redirection.")
            evidence.append({
                "title": "Path Redirection Trick",
                "category": "Obfuscation",
                "description": "Double slashes in the path can cause browser URL parsing ambiguities.",
                "risk_level": "medium"
            })

        if features.get("domain_entropy", 0.0) > 4.2:
            score += 10
            reasons.append("High domain character randomness (entropy) indicative of algorithmic generation or obfuscation.")
            evidence.append({
                "title": "High Domain Entropy",
                "category": "Domain Pattern",
                "description": "Domain name exhibits non-human, high-entropy character distribution.",
                "risk_level": "low"
            })

        if features.get("url_length", 0) > 75:
            score += 5
            reasons.append(f"Unusually long URL structure ({features.get('url_length')} characters).")
            evidence.append({
                "title": "Excessive URL Length",
                "category": "URL Structure",
                "description": "Long URLs are often used to hide the true destination off-screen on mobile devices.",
                "risk_level": "low"
            })

        if not features.get("is_https"):
            score += 5
            reasons.append("Connection lacks HTTPS encryption (HTTP unencrypted protocol).")
            evidence.append({
                "title": "Unencrypted HTTP Protocol",
                "category": "Security Protocol",
                "description": "Website communicates over plain HTTP without TLS encryption.",
                "risk_level": "medium"
            })

        # Cap score between 0 and 100
        final_score = max(0, min(100, score))

        # Classification mapping
        if final_score >= 65:
            classification = "PHISHING"
            recommendations.extend([
                "DO NOT enter any passwords, usernames, credit cards, or personal credentials on this website.",
                "DO NOT download files or authorize browser notification popups from this link.",
                "Close the browser tab immediately and report the link to your IT/Security administrator."
            ])
        elif final_score >= 30:
            classification = "SUSPICIOUS"
            recommendations.extend([
                "Exercise caution before interacting with this page.",
                "Double-check the exact domain name spelling in your browser address bar.",
                "Avoid submitting sensitive account information unless you independently verified the source."
            ])
        else:
            classification = "SAFE"
            recommendations.extend([
                "No immediate threat indicators were detected by threat intelligence or URL feature patterns.",
                "Always verify the website domain in your address bar before typing passwords."
            ])

        return final_score, classification, evidence, reasons, recommendations

risk_engine = ExplainableRiskEngine()
