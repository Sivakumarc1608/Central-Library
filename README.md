# Library Engage - Central Library, NIT Tiruchirappalli

## Files in this zip
- `index.html` - the whole site (logo, styles and scripts are inside; nothing else to upload)
- `SETUP-GOOGLE-SHEET.gs` - the central database + admin-only access (paste into Google Apps Script)
- `LibraryEngage-Database-Template.xlsx` - a preview of the database layout, importable into Google Sheets

## IMPORTANT: why the Admin page may look empty or out of date
A site hosted on GitHub Pages (or any college web folder) has no server of its own.
Until you complete Part 2 below, every visitor's results are saved only inside
THAT visitor's own browser, so the Admin page can only show records made in the
browser you are logged in from. The admin dashboard shows a red notice saying so.
To collect everyone's results in one place you MUST connect the Google Sheet (Part 2).

---

## Part 1 - Put the site on GitHub Pages

1. **Create a GitHub account** (skip if you have one) at github.com.
2. **Create a new repository.** Click the `+` top-right > *New repository*.
   Name it anything, e.g. `library-engage`. Keep it **Public**. Do not add a README. Click *Create repository*.
3. **Upload the file.** On the new repository's page, click *uploading an existing file*,
   drag in `index.html` from this zip, and click *Commit changes*.
   (You can upload `LibraryEngage-Database-Template.xlsx` and the `.gs` file too, so everything
   lives in one place, but only `index.html` needs to be there for the site to work.)
4. **Turn on Pages.** Repository > *Settings* tab > *Pages* (left sidebar) > under *Build and
   deployment*, set Source to **Deploy from a branch** > Branch: **main**, folder **/(root)** > *Save*.
5. **Wait about a minute**, then reload the Pages settings page. A green box shows your live
   link: `https://<your-username>.github.io/<repository-name>/`. That is the link to share.
6. **Test it** by opening the link, playing one game, and confirming the certificate opens.

To update the site later (new games, colours, a pasted Sheet URL): edit `index.html` on your
computer, go back to the repository, click on `index.html` > the pencil (Edit) icon, paste the
new content, and *Commit changes*. The live link updates within a minute, no re-upload needed.

## Part 2 - Connect the central database (do this before sharing the link widely)

This makes every visitor's attempt land in one place, viewable only by the Admin.

1. Go to **sheets.google.com** and create a **blank spreadsheet**. Keep it private (do not
   share it). Optionally, rename it "Library Engage Database".
2. *(Optional preview)* File > Import > Upload > choose `LibraryEngage-Database-Template.xlsx`
   from this zip > Import location: **Insert new sheet(s)**. This shows you the exact column
   layout and a live Dashboard tab. You can skip this step - the Apps Script below creates the
   same "Participation" tab automatically the first time someone plays.
3. In the Sheet, open **Extensions > Apps Script**. Delete the sample code in the editor and
   paste in the entire contents of `SETUP-GOOGLE-SHEET.gs`. Save (Ctrl/Cmd+S).
4. Click the gear icon **Project Settings** (left sidebar) > scroll to **Script properties** >
   *Add script property* > Property: `ADMIN_KEY`, Value: a strong password you choose. Save.
5. Click **Deploy > New deployment**. Click the gear next to "Select type" > **Web app**.
   Set *Execute as*: **Me**, *Who has access*: **Anyone**. Click **Deploy**.
6. Google will ask you to authorise the script (it's yours, so this is safe) - click through
   the "Google hasn't verified this app" warning via *Advanced > Go to (project name)*.
7. Copy the **Web app URL** shown (it ends with `/exec`).
8. Back in `index.html`, find this line near the top of the `<script>` section:
   ```
   sheetEndpoint: '',
   ```
   and paste your URL between the quotes:
   ```
   sheetEndpoint: 'https://script.google.com/macros/s/AKfycb.../exec',
   ```
9. Save the file, then update it on GitHub (Part 1's "update the site later" steps).
10. **Test it**: play one game on the live link, then open the Sheet - a new row should appear
    on the "Participation" tab within a few seconds. Then open Admin Login on the site and log
    in with your `ADMIN_KEY` to confirm the record shows there too.

Whenever you edit the script later, use **Deploy > Manage deployments > Edit (pencil) >
Version: New version > Deploy** - the same URL keeps working, so you don't touch `index.html` again.

### How data is protected and recorded (once Part 2 is done)
- Every attempt is saved on the student's device, queued, and sent to the Sheet.
  If the network drops, it stays queued and is re-sent automatically (on reload,
  when back online, and every 30 s). The Sheet ignores duplicates, so nothing is lost or double counted.
- The public page can read only the leaderboard (name, department, challenge, score).
  Roll numbers are never sent to the public.
- The full records and the **Download CSV (Excel)** button are available only after the
  Admin logs in. The password is checked by the server, not by the web page.
  10 wrong attempts pause admin login for 10 minutes.
- The Google Sheet itself is also viewable/downloadable by you (as its owner) at any time,
  via File > Download, or by opening `LibraryEngage-Database-Template.xlsx`'s layout for reference.
  Do not share the Sheet publicly.

### Honest limits
- Scores are calculated in the student's browser, so a technically determined person could send a
  fake record. This is fine for an engagement activity, not for graded exams. Admin can review rows.
- Anyone who knows the Web app URL can submit records; they cannot read private data without `ADMIN_KEY`.

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
