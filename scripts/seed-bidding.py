#!/usr/bin/env python3
"""
Seed script — marks a curated set of projects as open for bidding.
Run once: python3 scripts/seed-bidding.py
"""

import json, os, sys, urllib.request, urllib.error

PB_URL   = os.environ.get("POCKETBASE_URL", "https://pocketbase-production-6ab5.up.railway.app").rstrip("/")
EMAIL    = os.environ.get("POCKETBASE_ADMIN_EMAIL",    "ddinsmore8@gmail.com")
PASSWORD = os.environ.get("POCKETBASE_ADMIN_PASSWORD", "MADcap(123)")

def req(method, path, body=None, token=None):
    url = f"{PB_URL}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

# ── Auth ──────────────────────────────────────────────────────────────────────
auth = req("POST", "/api/collections/_superusers/auth-with-password",
           {"identity": EMAIL, "password": PASSWORD})
token = auth.get("token")
if not token:
    print("Auth failed:", auth)
    sys.exit(1)
print("✓ Authenticated")

# ── Fetch all projects ────────────────────────────────────────────────────────
resp = req("GET", "/api/collections/projects/records?perPage=200&fields=id,name,status,type", token=token)
all_projects = resp.get("items", [])
print(f"✓ Found {len(all_projects)} projects")

# ── Pick projects to open for bidding ─────────────────────────────────────────
# Prefer planned/in_progress; pick a spread of types
TARGET_NAMES = [
    "Venue & Course Build",
    "Broadcast Infrastructure",
    "Tech & Data Platform",
    "Marketing & Brand Launch",
    "Sponsor Activation Program",
    "Tournament Operations",
    "Media Production Setup",
    "Player Experience & Hospitality",
]

# Match by name substring (case-insensitive), fall back to first 8 planned/in_progress
def name_match(project):
    n = project["name"].lower()
    return any(t.lower() in n for t in TARGET_NAMES)

matched   = [p for p in all_projects if name_match(p)]
remaining = [p for p in all_projects if not name_match(p) and p["status"] in ("planned", "in_progress")]
candidates = (matched + remaining)[:8]

print(f"\nOpening {len(candidates)} projects for bidding:")
for p in candidates:
    print(f"  • {p['name']}  [{p['status']}]")

# ── Patch each project ────────────────────────────────────────────────────────
ok = 0
for p in candidates:
    result = req("PATCH", f"/api/collections/projects/records/{p['id']}",
                 {"biddingOpen": True}, token=token)
    if "id" in result:
        ok += 1
    else:
        print(f"  ✗ Failed {p['name']}: {result.get('message')}")

print(f"\n✓ {ok}/{len(candidates)} projects marked biddingOpen=true")
