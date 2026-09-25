/**
 * LIBRARY ENGAGE - central database (Google Sheet + Apps Script)
 * ---------------------------------------------------------------
 * What this does
 *   - Records every attempt from every device, once (duplicates are ignored).
 *   - The public page can read ONLY the leaderboard: name, department,
 *     challenge and score. Roll numbers are never sent to the public.
 *   - Full records (with roll numbers) are released ONLY to the Admin
 *     screen, and only when the correct ADMIN_KEY is supplied. The key is
 *     stored here in Script Properties, never in the web page.
 *
 * Setup (about 5 minutes)
 *   1. Create a NEW Google Sheet (keep it private - do not share it publicly).
 *   2. Extensions > Apps Script. Delete the sample code, paste this file, Save.
 *   3. Project Settings (gear icon) > Script properties > Add script property:
 *        Property: ADMIN_KEY      Value: (a strong password of your choice)
 *   4. Deploy > New deployment > type "Web app".
 *        Execute as: Me            Who has access: Anyone
 *      Authorise when asked, then copy the Web app URL (ends with /exec).
 *   5. In index.html set  sheetEndpoint: 'PASTE-THE-URL-HERE'  in CONFIG.
 *   6. Whenever you edit this script later: Deploy > Manage deployments >
 *      Edit > Version: New version > Deploy (the URL stays the same).
 */

var SHEET_NAME = 'Participation';
var HEADERS = ['Received At', 'Attempt Time', 'Attempt ID', 'Name', 'Roll Number', 'Department', 'Category',
               'Game ID', 'Game', 'Score', 'Total Questions', 'Percentage', 'Seconds', 'Certificate ID'];
var COL = { RECEIVED:1, TS:2, UID:3, NAME:4, ROLL:5, DEPT:6, CAT:7, GAMEID:8, GAME:9, SCORE:10, TOTAL:11, PCT:12, SECS:13, CERT:14 };
var MAX_FAILED_LOGINS = 10;      // then admin login is paused for 10 minutes

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    // Store text columns as plain text so nothing typed by a participant can act as a formula.
    [COL.TS, COL.UID, COL.NAME, COL.ROLL, COL.DEPT, COL.CAT, COL.GAMEID, COL.GAME, COL.CERT].forEach(function (c) {
      sh.getRange(1, c, sh.getMaxRows(), 1).setNumberFormat('@');
    });
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function clean_(v, max) {
  return String(v === null || v === undefined ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 120);
}
function num_(v, lo, hi) {
  var n = Number(v);
  if (isNaN(n)) return null;
  n = Math.round(n);
  return (n < lo || n > hi) ? null : n;
}
function hash_(s) {
  // salted with the private admin key so roll numbers cannot be guessed back from the public leaderboard
  var salt = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY') || '';
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, salt + '|' + String(s)).map(function (b) {
    return ('0' + (b & 255).toString(16)).slice(-2);
  }).join('').slice(0, 12);
}

/* ---- admin password check (with a simple lock-out after repeated failures) ---- */
function checkAdmin_(key) {
  var admin = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('admin_fails') || 0);
  if (fails >= MAX_FAILED_LOGINS) return 'locked';
  if (admin && key && String(key) === admin) { cache.remove('admin_fails'); return 'ok'; }
  cache.put('admin_fails', String(fails + 1), 600);
  return 'bad';
}

/* ---- PUBLIC read: leaderboard only (best score per person per challenge, no roll numbers) ---- */
function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  if (action !== 'leaderboard') return json_({ ok: true, service: 'Library Engage' });
  var sh = getSheet_(), last = sh.getLastRow();
  var best = {};
  if (last > 1) {
    sh.getRange(2, 1, last - 1, HEADERS.length).getValues().forEach(function (r) {
      var k = r[COL.ROLL - 1] + '|' + r[COL.GAMEID - 1];
      var pct = Number(r[COL.PCT - 1]) || 0;
      if (!best[k] || pct > best[k].percentage) {
        best[k] = { roll: hash_(r[COL.ROLL - 1]), name: r[COL.NAME - 1], department: r[COL.DEPT - 1],
                    game_id: r[COL.GAMEID - 1], game_title: r[COL.GAME - 1], score: r[COL.SCORE - 1],
                    total_questions: r[COL.TOTAL - 1], percentage: pct, seconds: Number(r[COL.SECS - 1]) || 0,
                    ts: String(r[COL.TS - 1]) };
      }
    });
  }
  var rows = Object.keys(best).map(function (k) { return best[k]; });
  rows.sort(function (a, b) { return b.percentage - a.percentage; });
  return json_({ ok: true, rows: rows.slice(0, 300) });
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  if (req.action === 'admin') return adminRead_(req);
  return record_(req);
}

/* ---- ADMIN read: everything, only with the correct key ---- */
function adminRead_(req) {
  var status = checkAdmin_(req.key);
  if (status === 'locked') return json_({ ok: false, error: 'locked' });
  if (status !== 'ok') return json_({ ok: false, error: 'unauthorized' });
  var sh = getSheet_(), last = sh.getLastRow(), rows = [];
  if (last > 1) {
    sh.getRange(2, 1, last - 1, HEADERS.length).getValues().forEach(function (r) {
      rows.push({ ts: String(r[COL.TS - 1]), name: r[COL.NAME - 1], roll: String(r[COL.ROLL - 1]),
                  department: r[COL.DEPT - 1], category: r[COL.CAT - 1], game_id: r[COL.GAMEID - 1],
                  game_title: r[COL.GAME - 1], score: r[COL.SCORE - 1], total_questions: r[COL.TOTAL - 1],
                  percentage: r[COL.PCT - 1], seconds: r[COL.SECS - 1], certificate_id: String(r[COL.CERT - 1] || '') });
    });
  }
  return json_({ ok: true, rows: rows });
}

/* ---- WRITE: record one attempt (validated, de-duplicated) ---- */
function record_(r) {
  var uid = clean_(r.uid, 160), name = clean_(r.name, 100), roll = clean_(r.roll, 40),
      dept = clean_(r.department, 120), cat = clean_(r.category, 20);
  var total = num_(r.total_questions, 1, 200), score = total === null ? null : num_(r.score, 0, total),
      pct = num_(r.percentage, 0, 100), secs = num_(r.seconds, 0, 86400);
  if (!uid || name.length < 2 || roll.length < 3 || dept.length < 2 || score === null || pct === null || secs === null) {
    return json_({ ok: false, error: 'invalid' });
  }
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return json_({ ok: false, error: 'busy' }); }
  try {
    var sh = getSheet_(), last = sh.getLastRow();
    if (last > 1) {
      var hit = sh.getRange(2, COL.UID, last - 1, 1).createTextFinder(uid).matchEntireCell(true).findNext();
      if (hit) return json_({ ok: true, duplicate: true });          // already recorded: safe to drop from the device queue
    }
    sh.appendRow([new Date(), clean_(r.ts, 40), uid, name, roll, dept, cat, clean_(r.game_id, 60),
                  clean_(r.game_title, 120), score, total, pct, secs, clean_(r.certificate_id, 60)]);
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}
