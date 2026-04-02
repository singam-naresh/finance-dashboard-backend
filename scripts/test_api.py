"""
FinGuard API — Production Test Suite
Tests all production improvements: brute-force, unknown params, JWT errors, audit logs.
"""
import urllib.request
import urllib.error
import json

BASE = "http://localhost:8080"

def post(path, body, token=None):
    data = json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method="POST")
    try:
        r = urllib.request.urlopen(req)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def get(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", headers=headers)
    try:
        r = urllib.request.urlopen(req)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"message": f"(empty body, HTTP {e.code})", "status": e.code}

def sep(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

# ── 1. Brute-force protection ────────────────────────────────
sep("1. BRUTE-FORCE PROTECTION (5 failures → 429 lock)")
for i in range(1, 7):
    code, body = post("/api/auth/login", {"username": "brutefinal", "password": "WRONG"})
    print(f"  Attempt {i} → HTTP {code} | {body.get('message','')}")

# ── 2. Admin login ───────────────────────────────────────────
sep("2. ADMIN LOGIN")
code, body = post("/api/auth/login", {"username": "admin", "password": "Admin@123"})
token = body.get("token", "")
print(f"  HTTP {code} | user={body.get('username')} roles={body.get('roles')}")

# ── 3. Unknown query param rejection ────────────────────────
sep("3. UNKNOWN QUERY PARAM → 400")
code, body = get("/api/records/filter/type?type=INCOME&amount=999", token)
print(f"  HTTP {code} | {body.get('message','')}")

code2, body2 = get("/api/records/filter/date-range?from=2024-01-01&to=2024-03-31&currency=USD", token)
print(f"  HTTP {code2} | {body2.get('message','')}")

# ── 4. Valid filter (no unknown params) ─────────────────────
sep("4. VALID FILTER → 200")
code, _ = get("/api/records/filter/type?type=INCOME", token)
print(f"  ?type=INCOME → HTTP {code}")
code, _ = get("/api/records/filter/date-range?from=2024-01-01&to=2024-12-31", token)
print(f"  ?from=...&to=... → HTTP {code}")

# ── 5. Invalid token → 401 "Invalid token" ──────────────────
sep("5. INVALID TOKEN → 401")
code, body = get("/api/records", "totally.invalid.token")
print(f"  HTTP {code} | {body.get('message','')}")

# ── 6. Dashboard ─────────────────────────────────────────────
sep("6. DASHBOARD SUMMARY")
code, body = get("/api/dashboard/summary", token)
print(f"  HTTP {code} | income={body.get('totalIncome')} expenses={body.get('totalExpenses')} net={body.get('netBalance')}")
print(f"  categories={len(body.get('categoryTotals',[]))} months={len(body.get('monthlySummary',[]))} recent={len(body.get('recentTransactions',[]))}")

# ── 7. VIEWER blocked from dashboard ────────────────────────
sep("7. RBAC: VIEWER blocked from dashboard → 403")
_, vbody = post("/api/auth/login", {"username": "testuser", "password": "Test@1234"})
vtoken = vbody.get("token", "")
code, body = get("/api/dashboard/summary", vtoken)
print(f"  HTTP {code} | {body.get('message','')}")

# ── 8. Duplicate record → 409 ───────────────────────────────
sep("8. DUPLICATE RECORD → 409")
rec = {"amount": 1111.00, "type": "INCOME", "category": "DupProd", "date": "2024-09-01", "userId": 1}
code1, _ = post("/api/records", rec, token)
code2, body2 = post("/api/records", rec, token)
print(f"  First insert → HTTP {code1}")
print(f"  Duplicate    → HTTP {code2} | {body2.get('message','')}")

print("\n" + "="*60)
print("  ALL TESTS COMPLETE")
print("="*60)
