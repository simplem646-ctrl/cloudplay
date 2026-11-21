# Academics, clubs, jobs, activities — rules API (lead-built)

Pure logic over the plain-JSON state, Node-tested (`test/sim/t8a_*.test.mjs`, `test/sim/t8b_activities_logic.test.mjs`). **Scenes are the
remaining work** (see "Scenes still to build"). Everything takes optional `opts = { bus, balance }`; time-spending functions advance the clock through
`clock.advance` unless `opts.advanceClock === false` (let the scene animate first, then advance by the returned `minutes`).

## Timetable — `src/data/timetable.js`
`TIMETABLE[weekdayIndex][period-1]` (Mon..Fri x 6), `subjectAt(weekdayIndex, period)`, `teacherOf(subject)`, `lessonsOn(weekdayIndex)`, `isAcademic(id)`,
`roomFor(subject, weather)`: all lessons are in `school_classroom` except **PE: `school_field` when sunny/cloudy, classroom when wet**.
Non-lesson periods: `self_study` (Wed 6), `club_intro` (Thu 6), `cleanup` (Fri 6): attendance needs only "be on school grounds"; no scene, no gains.

## School day — `src/sim/academics.js`
- `schoolPhase(minute)` -> `{ phase: 'pre'|'homeroom'|'period'|'break'|'lunch'|'after', period?, next?, late?, graceOpen? }` (grace = 10 min after the bell).
- `recordAttendance(state, 1..6|'homeroom', 'present'|'late'|'absent')` (first record wins): late conduct -1; absent conduct -2, `stats.daysSkippedClass++`, per-term
  counter; every 5th skipped period of a term sets `flags.detention_pending`. Homeroom absence only sets `daily.missedHomeroom`.
- `markMissedPeriods(state, minute)` / `finalizeSchoolDay(state)`: unattended periods whose grace window closed become absences (lesson days only).
- `applyClass(state, { subject, period, choice, quiz, late })` -> `{ gains, traits, conduct, energy, caught }`. Choices: `listen` +2 · `notes` +3 (-2 energy) ·
  `doze` +0 (+5 energy, conduct -1) · `pass_note` +1 (+1 charm, 40% caught: conduct -2, seeded). Pop quiz right +2 (`hasPopQuiz(state, period)` is the seeded 25% roll;
  the scene asks one question from the subject's bank and passes `quiz: true|false`). Late -1. PE +1 fitness, art +1 creativity. Diminishing returns >70 are automatic.
- `study(state, { subject, hours: 1..3, place: 'home'|'library' })` -> `{ ok, reason?, hours, gain, perHour, energyCost, minutes }` (12 energy + 60 min per hour,
  gain 2-4 + books (<=2) + 1 library - 2 when tired; stops when energy runs out; reasons `bad_subject|bad_hours|too_tired`).
- `letterGrade(score)` A>=90 B>=80 C>=70 D>=55 else F · `standingFor(avg)` honors>=85 good>=70 fair>=55 else probation.

## Exams — `src/sim/exams.js`
Exam day = 2 sittings per day (08:30 and 10:30, 80 min each; a sitting may start up to 15 min late, then it is a zero). All six subjects over three days.
1. `prep = prepareSubject(state, subject)` -> `{ key, examId, subject, knowledge, strikes, total, practical, questions:[{ q, options[4], correct, tier, topic, struck:[idx] }] }`.
   Deterministic per seed/exam/subject (a retry never re-rolls). 6/7/8 questions by year; tier mix by year; knowledge >=40 strikes 1 wrong option, >=70 strikes 2.
   `practical` is `'track_sprint'` (PE) / `'art_palette'` (art; not built: skip it) — a practical result is worth 50% of that subject.
2. The scene shows questions (struck options greyed and unselectable), collects `answers[i]` (option index), optionally runs the practical, then
   `submitSubject(state, prep, answers, { practical /* 0..100 | null */ }, opts)` -> `{ subject, score, correct, total, written, bonuses, energyCost }`
   (+2 conduct>=80, +3 energy>=50, -10 energy). The scene advances the clock 80 min per sitting.
3. Results day (`resultsDue(state)` -> exam def): `processResults(state, examId, opts)` builds `school.exams[key] = { scores, total, average, rank }`, a report card entry,
   running `school.average`, `standing`, `remedialDays = 5` on probation, Community Spirit +3 for rank <= 5, flags `exam_<id>_y<year>_done`, `exam_top3`, `exam_rank1`,
   `year_<n>_honors`, and `school.yearGrades[year]` after final2. Idempotent (`already: true`). Rank is among 30: Clara ~90-96, Nina/Dante ~55-70, 26 seeded classmates.
   Tested: an 88 average is top 3-6, a 36 average is ~27th. Missed sittings are 0.

## Director + night hook — `src/sim/school_director.js`, `src/sim/academics_index.js`
`registerAcademics({ registry?, director = true })` (T9a's boot calls it) registers the `'academics'` before-hook (closes the day, zeroes unsat exams, processes posted
results) and `registerSchoolDirector()` (`registerDirector('school', fn, 20)`). The director returns, in this priority:
| when | action |
|---|---|
| results day, >= 15:10, once | processes results, `{ scene:'report_card', params:{ examId, key } }` |
| exam day, player in `school_classroom`, a sitting is due | `{ scene:'exam', params:{ examId, key, subject, slot, late, dayIndex, subjects } }` |
| a lesson's grace window is open and the player is in its room | `{ scene:'class', params:{ period, subject, late, minutes /* left in the period */, popQuiz, room } }` (attendance is recorded when issued) |
| 08:20-08:30 in the classroom | silent homeroom attendance |
| `school.remedialDays > 0`, 15:10-16:30 on school grounds, once a day | `{ scene:'activity:study_library', params:{ remedial:true, hours:1, subject: weakest } }` (decrements the counter when issued) |

## Clubs / job / activities — `src/sim/{clubs,jobs,activities}.js`
- Clubs: `joinClub(state, club, opts)`, `leaveClub`, `clubGame(club)` (mini-game id; `soccer_penalty`, `art_palette`, `literature_words`, `astronomy_stars` are NOT built:
  the scene needs a fallback), `canPractice(state)` (club, 15:30-17:30 on school days / 09:00-17:30 otherwise, energy >= 20, once a day),
  `practice(state, { score, rank })` -> `{ ok, club, xp, xpTotal, rank, rankUp, traits, energy, minutes: 120 }` (XP gold 12/silver 8/bronze 5/none 3 + practice items; rank 0-5 at XP 0/20/50/90/140/200;
  trains fitness / creativity / charm / science per club).
- Job: `canWork(state)` (weekdays 16:00-19:00, free days 10:00-17:00; a shift may start 30 min before opening until close-3h; once a day; energy >= 25),
  `finishShift(state, { score, rank })` -> `{ ok, pay: 45 (+10 silver+), energy: -25, minutes: 180, shifts, firstShift }`; first shift sets `school.job = 'cafe'`, flag `job_cafe_started`, +1 charm.
- Free time: `rest(state, { minutes: 30|60 })` +10 energy per 30 min · `nap(state)` 1 h +25 energy, 09:00-17:00, once a day · `jog(state)` 1 h, -10 energy, +2 fitness, once a day, not in a storm.
  Guards return `{ ok:false, reason }`; `canNap/canJog` are the pure checks. Daily flags live in `state.daily` and reset every night.

## Scenes still to build (registered by T8a/T8b workers through `src/scenes/registry.js`)
`class` · `exam` · `report_card` · `activity:study_home` · `activity:study_library` · `shop` · `activity:club_practice` · `activity:job_cafe` · `activity:rest` · `activity:nap` · `activity:jog`.
Each scene: do the interaction, call the matching logic function, advance the clock by the returned `minutes` (if it passed `advanceClock:false`), then `game.scenes.pop(result)`
with the shape in `src/scenes/registry.js`. Use `MockStage`-style fakes + `src/dev/*_demo.js` harnesses to screenshot them.

## Scenes (built, `src/scenes/academics/`)
`registerAcademicScenes()` (`index.js`) registers `class`, `exam`, `report_card`, `activity:study_home`, `activity:study_library`. Pure helpers (flavour lines, quiz pick, question/option layout,
grade colours, teacher comments, hour options, time tint) live in `logic.js` (tests: `test/scenes/academics_logic.test.mjs`); backdrops in `backdrops.js`; shared base + result card in `common.js`.
All scenes paint an opaque 320x240 backdrop, use `game.sim` (`state`, `clock.advance`, `balance`), `game.audio?.sfx` (tolerated if absent) and placeholder portraits when no art service exists.
- `class` `{ period, subject, late, minutes, popQuiz, room }` -> `{ attended: true, gains, choice, minutes }`. Late grumble, a seeded teacher line (8 per subject, year-varied), attention ListMenu
  (listen/notes/doze/pass_note), optional pop quiz (bank tier = year), `applyClass`, result card, `bell_school` sfx, `clock.advance(minutes)`. `room: 'school_field'` swaps in the field backdrop.
- `exam` `{ examId, key, subject, slot, late, dayIndex, subjects }` -> `{ scores: { [subject]: score }, subject }`. `prepareSubject` at enter, struck options greyed (marked `x`), practical offered via
  `minigame:<prep.practical>` (`missing`/`cancelled` -> `practical: null`, so art is skipped), `submitSubject`, result card with bonuses and a proctor line, clock +80 min. Does not loop to the second sitting.
- `report_card` `{ examId, key }` -> `{}`. Parchment table (score, letter, bar), average, rank n/30, standing, running average, Ms. Delaney's comment (3 variants per standing, remedial notice),
  banner + `cheer` for rank <= 3. `reportData(state, key)` is exported from `report_card.js`.
- `activity:study_home` / `activity:study_library` `{ remedial?, hours?, subject? }` -> `{ minutes, gains: { [subject]: gain } }`. Subject list (knowledge bars, "book +n"), hours 1/2/3 (disabled when energy
  cannot pay), animated desk/shelves with time-of-day tint, `study(..., { advanceClock: false })`, per-hour gains + energy, then `clock.advance(minutes)`. `remedial: true` skips the menus (1 h, given subject).
  Too tired -> `{ minutes: 0, gains: {} }`. Cancelling the subject list also pops `{ minutes: 0, gains: {} }`.
- Harness: `node scripts/build.mjs --entry src/dev/academics_demo.js --out dist/dev/academics_demo.html`, then `?scene=class|exam|report_card|study_home|study_library` (+ `&late=1&popquiz=1&room=school_field&subject=&year=&energy=&knowledge=&avg=&remedial=1&books=1&minute=`).
  `window.__ac = { step(n), tap(action), scene(), result() }`.
