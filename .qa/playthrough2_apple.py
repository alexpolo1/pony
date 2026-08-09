from playwright.sync_api import sync_playwright
import time

console_msgs = []
failed = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 480, "height": 900}, ignore_https_errors=True)
    page.on("console", lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda exc: console_msgs.append(f"[pageerror] {exc}"))
    page.on("response", lambda r: failed.append(f"{r.status} {r.url}") if r.status >= 400 else None)

    page.goto("https://192.168.1.96:8443/", wait_until="networkidle")
    time.sleep(2)
    page.get_by_text("Start med lyd", exact=False).click(timeout=8000)
    time.sleep(1)
    try:
        page.get_by_text("Lad os gå", exact=False).click(timeout=5000)
    except Exception:
        pass
    time.sleep(1.5)

    # theme index 2: æblerne-ruller
    page.locator(".pony-card").nth(2).click()
    time.sleep(1)
    print("--- wizard type step ---")
    print(page.inner_text("body")[:300])

    # Jordpony = index 0
    page.locator(".pony-card").nth(0).click()
    time.sleep(1)
    print("--- after picking jordpony, step count ---")
    print(page.inner_text("body")[:100])

    # Jordpony has no horn/wings: type->body->eyes->mane->tail = 5 steps, 3 Next clicks needed
    for i in range(3):
        page.get_by_role("button", name="Næste trin").click()
        time.sleep(0.4)
    print("--- final wizard step (should be tail, Start eventyr) ---")
    print(page.inner_text("body")[:200])
    page.get_by_role("button", name="Start eventyr").click()
    time.sleep(2)

    def snap(name): page.screenshot(path=f"/home/alex/pony/.qa/{name}.png")

    # Scene 1: dice
    page.get_by_role("button", name="Kast terningerne").click()
    time.sleep(5)
    # Scene 2: choice
    page.get_by_role("button", name="mulighed 3", exact=False).click()
    time.sleep(5)

    # Scene 3: color - deliberately WRONG first (Blå), correct is Rød
    snap("apple_s3_before_wrong")
    page.get_by_role("button", name="Blå", exact=False).click()
    time.sleep(4)
    snap("apple_s3_after_wrong")
    print("--- after WRONG color pick ---")
    print(page.inner_text("body")[:600])

    # now correct: Rød
    page.get_by_role("button", name="Rød", exact=False).click()
    time.sleep(5)
    snap("apple_s4")

    # Scene 4: dice
    page.get_by_role("button", name="Kast terningerne").click()
    time.sleep(5)

    # Scene 5: memory - deliberately wrong first, target is 4
    snap("apple_s5_before")
    page.get_by_role("button", name="mulighed 1", exact=False).click()
    time.sleep(4)
    snap("apple_s5_after_wrong")
    print("--- after WRONG memory pick ---")
    print(page.inner_text("body")[:600])

    page.get_by_role("button", name="mulighed 4", exact=False).click()
    time.sleep(5)
    snap("apple_end")
    print("--- final end state ---")
    print(page.inner_text("body")[:500])

    # test Spil Igen
    page.get_by_role("button", name="Spil Igen", exact=False).click()
    time.sleep(1.5)
    snap("apple_after_replay")
    print("--- after Spil Igen click ---")
    print(page.inner_text("body")[:200])

    browser.close()

print("\n--- FAILED REQUESTS ---")
for r in failed: print(r)
print("--- CONSOLE ---")
for m in console_msgs: print(m)
