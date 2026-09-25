# Library Engage - Central Library, NIT Tiruchirappalli

Files
- `index.html` - the whole site (logo, styles and scripts are inside; nothing else to upload)
- `SETUP-GOOGLE-SHEET.gs` - the central database + admin-only access (paste into Google Apps Script)

## IMPORTANT: why the Admin page may look empty or out of date
A site hosted on GitHub Pages (or any college web folder) has no server of its own.
Until you complete step B below, every visitor's results are saved only inside
THAT visitor's own browser, so the Admin page can only show records made in the
browser you are logged in from. The admin dashboard now shows a red notice saying so.
To collect everyone's results in one place you MUST connect the Google Sheet (step B).

## Two ways to run it

**A. Just upload index.html (works immediately).**
Each computer/phone keeps its own records. Good for a demo, NOT for a college
deployment, because the Admin cannot see what other devices recorded.

**B. With the central database (use this for the college website).**
1. Create a new Google Sheet (private). Extensions > Apps Script.
2. Paste the whole of `SETUP-GOOGLE-SHEET.gs`, Save.
3. Project Settings > Script properties > add `ADMIN_KEY` = your strong admin password.
4. Deploy > New deployment > Web app > Execute as **Me**, Who has access **Anyone** > Deploy. Copy the `/exec` URL.
5. Open `index.html` in a text editor, find `sheetEndpoint: ''` near the top of the
   `<script>` and paste the URL between the quotes. Also set `adminPassword` to `''`
   (it is ignored in this mode, so there is no password in the file).
6. Upload `index.html` to the college site (or GitHub Pages).

### How data is protected and recorded (mode B)
- Every attempt is saved on the student's device, queued, and sent to the Sheet.
  If the network drops, it stays queued and is re-sent automatically (on reload,
  when back online, and every 30 s). The Sheet ignores duplicates, so nothing is lost or double counted.
- The public page can read only the leaderboard (name, department, challenge, score).
  Roll numbers are never sent to the public.
- The full records and the **Download CSV (Excel)** button are available only after the
  Admin logs in. The password is checked by the server, not by the web page.
  10 wrong attempts pause admin login for 10 minutes.
- The Google Sheet itself is also viewable/downloadable by you (as its owner) at any time.
  Do not share the Sheet publicly.
- After editing the script later: Deploy > Manage deployments > Edit > New version.

### Honest limits
- Scores are calculated in the student's browser, so a technically determined person could send a
  fake record. This is fine for an engagement activity, not for graded exams. Admin can filter such rows.
- Anyone who knows the Web app URL can submit records; they cannot read private data.

## Embedding in the college website
- Best: link to it or open it in its own page. If you use an `<iframe>`, allow popups
  (the certificate opens in a new tab) and keep the page on `https`.
- The certificate QR code loads from cdnjs.cloudflare.com, so it needs internet.

## Certificates
Students/faculty: all five student challenges. Research scholars: the Research Resource Challenge.
Certificate uses the NITT logo and the navy/gold template; set `certificateWatermark: false` in
`CONFIG` to remove the faint logo watermark.

## Customising
Colours (`:root` in the CSS), games (`GAMES` array, see "GAME 07 GOES HERE"), facts (`FACTS` array).
