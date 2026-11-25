"""End-to-end API smoke test for the reconstruction.

Run with the server already listening on http://localhost:3000:
    python3 tests/flow.py
"""
import json, urllib.request, urllib.error, http.cookiejar, sys, time

BASE = "http://localhost:3000"
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))


def call(method, path, data=None, expect=None):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(BASE + path, data=body, method=method)
    if body:
        req.add_header("content-type", "application/json")
    try:
        with op.open(req, timeout=20) as r:
            raw, status = r.read(), r.status
            ctype = r.headers.get("content-type", "")
    except urllib.error.HTTPError as e:
        raw, status = e.read(), e.code
        ctype = e.headers.get("content-type", "")
    value = json.loads(raw or b"null") if "json" in ctype else raw.decode("utf-8", "replace")
    if expect is not None and status != expect:
        raise AssertionError(f"{method} {path}: expected {expect}, got {status}: {str(value)[:300]}")
    print("OK", method, path, status)
    return value


call("GET", "/api/health", expect=200)
call("GET", "/api/landing-stats", expect=200)
call("GET", "/api/templates", expect=200)
call("GET", "/api/updates", expect=200)
call("GET", "/api/gallery", expect=200)
call("POST", "/api/reports", {"url": ".desainpakeai.com/contoh", "issue": "Lainnya"}, expect=201)

email = "uji-%d@example.com" % time.time()
call("POST", "/api/auth/register", {"email": email, "password": "rahasia123", "name": "Uji"}, expect=200)
session = call("GET", "/api/auth/session", expect=200)
assert session["user"]
call("POST", "/api/checkout/intent", {"plan": "pro"}, expect=201)

created = call("POST", "/api/projects", {"starter": {"prompt": "Buat landing page kedai kopi Senja dengan menu reservasi", "platform": "web", "look": "minimal"}}, expect=201)
pid = created["project"]["id"]
assert len(created["project"]["model"]["pages"]) >= 2

chat = call("POST", f"/api/projects/{pid}/chat", {"instruction": "Ubah warna tombol menjadi hijau"}, expect=200)
assert chat["project"]["model"]["theme"]["accent"] == "#16734f"

page = call("POST", f"/api/projects/{pid}/pages", {"title": "Pricing"}, expect=201)
slug = page["project"]["model"]["pages"][-1]["slug"]
call("PATCH", f"/api/projects/{pid}/pages/{slug}", {"title": "Paket"}, expect=200)
versions = call("GET", f"/api/projects/{pid}/versions", expect=200)
assert versions["versions"]
call("POST", f"/api/projects/{pid}/versions/{versions['versions'][0]['id']}/restore", {}, expect=200)
call("GET", f"/api/projects/{pid}/design.md", expect=200)
call("GET", f"/api/projects/{pid}/export?format=html", expect=200)
call("GET", f"/api/projects/{pid}/export?format=zip", expect=200)

published = call("POST", f"/api/projects/{pid}/publish", {"slug": f"uji-{int(time.time())}", "gallery": True}, expect=200)
site = call("GET", f"/sites/{published['slug']}", expect=200)
assert "Kopi Senja" in site
call("GET", "/api/gallery", expect=200)
call("POST", f"/api/projects/{pid}/unpublish", {}, expect=200)
call("DELETE", f"/api/projects/{pid}", expect=200)
call("POST", "/api/auth/logout", {}, expect=200)
print("ALL FLOW TESTS PASSED")
