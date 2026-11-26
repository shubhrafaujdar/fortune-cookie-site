"""End-to-end test of the shop in a real browser.

Usage (uses a test build where Google sign-in is replaced by a pretend account):
  npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4174 &
  python3 tools/flow_test.py [desktop|phone]
"""
import asyncio, sys
from playwright.async_api import async_playwright

URL = 'http://localhost:4174/'
VP = sys.argv[1] if len(sys.argv) > 1 else 'desktop'
SIZES = {'desktop': (1440, 900, False), 'phone': (390, 844, True)}
OUT = '/tmp/shots'
INIT = """
window.__ac = 0;
const AC = window.AudioContext;
window.AudioContext = class extends AC { constructor(...a){ super(...a); window.__ac++; } };
"""
results = []
def check(name, cond, extra=''):
    results.append(('PASS' if cond else 'FAIL', name, '' if cond else extra))

async def ls(page, key):
    return await page.evaluate(f"JSON.parse(localStorage.getItem('little-fortune-shop:{key}'))")

async def open_cookie(page, shots=None):
    await page.wait_for_selector('.cookie-button:not([disabled])', timeout=9000)
    await page.wait_for_timeout(250)
    await page.click('.cookie-button', force=True)
    if shots:
        await page.wait_for_selector('.ritual.step-split', timeout=5000)
        await page.wait_for_timeout(180)
        # the pieces should be on screen mid-break (checked in the page, not by screenshot,
        # because headless capture can stall during heavy transitions)
        vis = await page.evaluate("[...document.querySelectorAll('.broken-piece')].map(i => getComputedStyle(i).opacity)")
        check('pieces visible while breaking', all(float(o) > 0.5 for o in vis), vis)
    await page.wait_for_selector('.ritual.step-done', timeout=9000)
    await page.wait_for_timeout(1200)
    if shots:
        await page.screenshot(path=f'{OUT}/{VP}-{shots}-done.png', timeout=60000)
    return await page.locator('.fortune-text p').inner_text()

async def close_panel(page):
    await page.click('.panel-close')
    await page.wait_for_timeout(350)

async def run(page, errors, requests):
    await page.goto(URL)
    await page.wait_for_selector('button.jar', timeout=8000)
    await page.wait_for_timeout(900)
    check('fortunes loaded from separate file', any('fortunes/fortunes.json' in r for r in requests))
    broken = await page.evaluate("[...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)")
    check('no broken images', not broken, broken)
    check('no audio before interaction', await page.evaluate('window.__ac') == 0)
    check('guest plaque: 2 free cookies', '2 free cookies' in await page.locator('.account-note').inner_text())
    await page.screenshot(path=f'{OUT}/{VP}-01-guest.png')

    # ---- guest locks
    check('tags locked for guests', await page.locator('.category-cord.is-locked .tag-lock').count() == 8)
    await page.click('button.tag >> nth=1')
    await page.wait_for_selector('.panel.account-panel.reason-tags', timeout=3000)
    check('tag asks to sign up', True)
    await close_panel(page)
    await page.click('button.journal-book-button')
    await page.wait_for_selector('.panel.account-panel.reason-journal', timeout=3000)
    check('journal asks to sign up', await page.locator('.member-perks li').count() == 3)
    await page.screenshot(path=f'{OUT}/{VP}-02-journal-locked.png')
    await close_panel(page)

    # ---- guest cookie 1
    await page.click('button.jar')
    await open_cookie(page, '03')
    check('audio only after a tap', await page.evaluate('window.__ac') == 1)
    check('broken pieces used', await page.locator('.broken-piece').count() == 2)
    foot = await page.locator('.ritual-footnote').inner_text()
    check('footnote 1 free left', '1 free cookie left' in foot, foot)
    check('keep is locked for guests', await page.locator('.ritual-actions .paper-button.is-locked').count() == 1)
    check('share button present', await page.locator('.ritual-actions .share').count() == 1)
    await page.click('.ritual-actions .paper-button.is-locked')
    await page.wait_for_selector('.panel.account-panel.reason-keep', timeout=3000)
    check('guest keep closes cookie and asks to sign up', await page.locator('.ritual').count() == 0)
    await close_panel(page)

    # ---- guest cookie 2, then locked
    await page.wait_for_timeout(3500)
    await page.click('button.jar')
    await open_cookie(page)
    foot = await page.locator('.ritual-footnote').inner_text()
    check('footnote last free', 'last free cookie' in foot, foot)
    label = await page.locator('.ritual-actions .paper-button').last.inner_text()
    check('another says sign in', 'Sign in' in label, label)
    await page.locator('.ritual-actions .paper-button').last.click()
    await page.wait_for_selector('.panel.account-panel.reason-limit', timeout=3000)
    check('jar locked message', 'locked' in await page.locator('.account-head h2').inner_text())
    await page.screenshot(path=f'{OUT}/{VP}-04-locked.png')
    await close_panel(page)
    check('padlock on jar', await page.locator('.jar-padlock').count() == 1)
    await page.screenshot(path=f'{OUT}/{VP}-05-jar-padlock.png')
    await page.click('button.jar')
    await page.wait_for_selector('.panel.account-panel.reason-limit', timeout=3000)
    check('locked jar asks to sign up', await page.locator('.ritual').count() == 0)

    # ---- sign in with Google (the only way to sign in)
    check('only Google sign-in offered', await page.locator('.account-panel input').count() == 0 and await page.locator('.google-button').count() == 1)
    await page.click('.google-button')
    await page.wait_for_selector('.panel.account-panel', state='detached', timeout=6000)
    check('member plaque: 5 left today', '5 cookies left today' in await page.locator('.account-note').inner_text())
    check('padlock gone', await page.locator('.jar-padlock').count() == 0)
    check('tags unlocked', await page.locator('.category-cord.is-locked').count() == 0)
    uid = await page.evaluate("JSON.parse(localStorage.getItem('e2e-user')).id")

    # ---- member: 5 cookies, keep closes, share works
    await page.wait_for_timeout(3500)
    await page.click('button.tag >> nth=2')
    await page.wait_for_timeout(300)
    check('member can choose a tag', await page.locator('button.tag.is-selected').count() == 1)
    await page.click('button.jar')
    text = await open_cookie(page)
    check('footnote 4 of 5', '4 of today' in await page.locator('.ritual-footnote').inner_text())
    if VP == 'desktop':
        await page.click('.ritual-actions .share button')
        await page.wait_for_timeout(300)
        links = await page.locator('.share-menu a').count()
        check('share menu has links', links == 4, links)
        await page.click('.share-menu button')
        await page.wait_for_timeout(400)
        clip = await page.evaluate('navigator.clipboard.readText()')
        check('copy puts fortune on clipboard', text in clip, clip)
        await page.screenshot(path=f'{OUT}/{VP}-06-share.png')
        await page.keyboard.press('Escape')
    await page.click('.ritual-actions .paper-button >> nth=0')
    await page.wait_for_timeout(500)
    check('keep closes the cookie', await page.locator('.ritual').count() == 0)
    check('kept in journal', len(await ls(page, f'user:{uid}:kept')) == 1 and await page.locator('.journal-count').inner_text() == '1')
    await page.wait_for_timeout(300)
    await page.click('button.jar')
    for i in range(4):
        await open_cookie(page)
        if i < 3:
            await page.locator('.ritual-actions .paper-button').last.click()  # Another fortune
            await page.wait_for_timeout(200)
    foot = await page.locator('.ritual-footnote').inner_text()
    check('fifth is the last today', 'last cookie' in foot, foot)
    label = await page.locator('.ritual-actions .paper-button').last.inner_text()
    check('another says back at midnight', 'midnight' in label, label)
    await page.locator('.ritual-actions .paper-button').last.click()
    await page.wait_for_selector('.panel.wait-panel', timeout=3000)
    c1 = await page.locator('.wait-clock').inner_text()
    await page.wait_for_timeout(1300)
    c2 = await page.locator('.wait-clock').inner_text()
    check('countdown to midnight ticks', c1 != c2, (c1, c2))
    await page.screenshot(path=f'{OUT}/{VP}-07-wait.png')
    await page.click('.wait-actions .paper-button >> nth=0')
    await page.wait_for_selector('.panel.journal', timeout=3000)
    await page.click('.journal-bookmarks button >> nth=1')
    await page.wait_for_timeout(400)
    check('journal has every member fortune', await page.locator('.journal-stats dd').first.inner_text() == '5')
    await page.screenshot(path=f'{OUT}/{VP}-08-journal.png')
    await close_panel(page)
    check('closed sign on jar', await page.locator('.jar-closed-sign').count() == 1)
    await page.screenshot(path=f'{OUT}/{VP}-09-closed.png')
    await page.click('button.jar')
    await page.wait_for_selector('.panel.wait-panel', timeout=3000)
    check('jar shows wait screen', True)
    await close_panel(page)

    # ---- next day: fresh cookies
    await page.evaluate("(uid) => localStorage.setItem('little-fortune-shop:user:' + uid + ':daily', JSON.stringify({ date: '2000-01-01', used: 5 }))", uid)
    await page.reload()
    await page.wait_for_selector('button.jar')
    await page.wait_for_timeout(800)
    check('new day: 5 again', '5 cookies left today' in await page.locator('.account-note').inner_text() and await page.locator('.jar-closed-sign').count() == 0)

    # ---- sign out: guest stays locked
    await page.click('.account-tag', force=True)
    await page.wait_for_selector('.panel.account-panel')
    await page.click('.account-actions .ink-link')
    await page.wait_for_timeout(500)
    check('signed out guest still locked', await page.locator('.jar-padlock').count() == 1)
    check('no console errors', not errors, errors)

async def main():
    w, h, mobile = SIZES[VP]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mobile, has_touch=mobile, permissions=['clipboard-read', 'clipboard-write'])
        await ctx.add_init_script(INIT)
        page = await ctx.new_page()
        errors, requests = [], []
        page.on('console', lambda m: m.type in ('error', 'warning') and errors.append(f'console {m.type}: {m.text}'))
        page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
        page.on('response', lambda r: r.status >= 400 and errors.append(f'{r.status}: {r.url}'))
        page.on('request', lambda r: requests.append(r.url))
        try:
            await run(page, errors, requests)
        except Exception as e:
            state = await page.evaluate("({ ritual: document.querySelector('.ritual')?.className, panel: document.querySelector('.panel')?.className, hidden: document.hidden })")
            print('STOPPED:', str(e).split(chr(10))[0][:160])
            print('page state:', state)
            print('errors:', errors[:5])
        finally:
            for r in results:
                print(*r)
        await b.close()
    print(f"{sum(r[0] == 'PASS' for r in results)}/{len(results)} passed")

asyncio.run(main())
