import os
import csv
import random

def generate_sample_dataset(output_path: str):
    """
    Generates a reproducible dataset of legitimate and phishing URLs 
    based on realistic web structures, PhishTank patterns, and top domain benchmarks.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    random.seed(42)
    
    # 1. Legitimate domain seeds
    legit_domains = [
        "google.com", "github.com", "wikipedia.org", "microsoft.com", "amazon.com",
        "apple.com", "stackoverlow.com", "youtube.com", "linkedin.com", "reddit.com",
        "cloudflare.com", "nytimes.com", "github.io", "mozilla.org", "python.org",
        "medium.com", "dropbox.com", "spotify.com", "adobe.com", "zoom.us",
        "coursera.org", "khanacademy.org", "gitlab.com", "docker.com", "mit.edu",
        "stanford.edu", "harvard.edu", "bbc.co.uk", "reuters.com", "w3schools.com"
    ]
    
    legit_paths = [
        "", "/", "/about", "/contact", "/docs/api/v1/user", "/article/2026/08/26/cybersecurity-guide",
        "/search?q=python+fastapi", "/profile/settings", "/products/category/electronics",
        "/en-us/downloads/latest", "/blog/posts/how-to-secure-your-app", "/help/center/faq"
    ]

    # 2. Phishing domain seeds & lures
    phish_brands = ["paypal", "bankofamerica", "wellsfargo", "chase", "netflix", "apple-id", "microsoft-online", "metamask", "binance", "secure-login"]
    phish_tlds = [".xyz", ".top", ".info", ".ru", ".cn", ".tk", ".ml", ".cf", ".ga", ".gq", ".site", ".online"]
    phish_keywords = ["login", "verify-account", "update-billing", "secure-portal", "auth-check", "recover-wallet", "confirm-identity", "webmail-access"]

    rows = []

    # Generate Legitimate samples (5000)
    for i in range(2500):
        domain = random.choice(legit_domains)
        path = random.choice(legit_paths)
        scheme = "https://" if random.random() > 0.05 else "http://"
        url = f"{scheme}{domain}{path}"
        rows.append((url, 0)) # 0 = Legitimate

        # Subdomain variant
        sub = random.choice(["www", "blog", "docs", "api", "support", "m"])
        url_sub = f"{scheme}{sub}.{domain}{path}"
        rows.append((url_sub, 0))

    # Generate Phishing samples (5000)
    for i in range(2500):
        brand = random.choice(phish_brands)
        tld = random.choice(phish_tlds)
        kw = random.choice(phish_keywords)
        scheme = "http://" if random.random() > 0.4 else "https://"

        pattern_choice = random.randint(1, 5)
        if pattern_choice == 1:
            # Domain typosquat / lure: paypal-security-update.xyz/login
            domain = f"{brand}-{kw}{tld}"
            url = f"{scheme}{domain}/signin.php?user=verify"
        elif pattern_choice == 2:
            # Subdomain abuse: paypal.com.verify-security.xyz/login.html
            domain = f"login.{brand}.com.verify-user-{random.randint(100,999)}{tld}"
            url = f"{scheme}{domain}/auth/account?id={random.randint(10000,99999)}"
        elif pattern_choice == 3:
            # IP Address host: http://192.168.1.50/paypal/login.php
            ip = f"{random.randint(10,200)}.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}"
            url = f"http://{ip}/{brand}/{kw}/index.html"
        elif pattern_choice == 4:
            # Obfuscated @ symbol: http://legitimate.com@phishing-server.ru/login
            url = f"{scheme}google.com@{brand}-verification{tld}/{kw}/account"
        else:
            # Excessive path/query obfuscation
            domain = f"auth-portal-{random.randint(10,99)}{tld}"
            url = f"{scheme}{domain}/{brand}.com/verify/update-billing-info-now/index.php?secure_token={random.randint(1000000,9999999)}"
        
        rows.append((url, 1)) # 1 = Phishing

        # Extra typosquatting sample
        typo_domain = f"www.{brand}-security-service{tld}"
        url_typo = f"{scheme}{typo_domain}/{kw}.html"
        rows.append((url_typo, 1))

    # Shuffle
    random.shuffle(rows)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["url", "label"])
        writer.writerows(rows)

    print(f"Dataset generated with {len(rows)} samples at {output_path}")

if __name__ == "__main__":
    generate_sample_dataset("B:/CEP PROJECT/ml/data/dataset.csv")
