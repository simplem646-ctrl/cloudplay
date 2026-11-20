# Story main (S1): events, flags, quests, festivals, endings

Files: `src/content/events/main_y1.js`, `main_y2.js`, `main_y3.js`, `fest_all.js`, `fest_shared.js` (helpers only, no
default export), `src/content/quests/main.js`, `src/content/endings/main.js`, `src/content/endings/friends_only.js`.

## Main events (kind `story`, priority 80 unless noted, `repeat: 'once'`)

| id | trigger | when (summary) |
|---|---|---|
| main_01_wake_up | wake | Y1 Sp1 (prio 95) |
| main_02_homeroom | enterMap school_classroom 08:00-16:00 | Y1 Sp1-12, seen fest_entrance_ceremony or day >= 2 |
| main_03_breakfast_people / 04_breakfast_classes / 05_breakfast_money | wake | Y1 Sp2-12 / 3-14 / 4-16, each after the previous |
| main_06_blossom_legend | auto 10:00-20:00 | Y1 Blossom Day, town_park, after fest_blossom_day, legend unknown (prio 75) |
| main_07_harbor_legend | enterMap town_harbor 14:00-19:30 | legend unknown, any date after Y1 Sp14 (fallback) |
| main_08_enrolment_rumour | enterMap school_hall_1f | Y1 Summer or later |
| main_09_bell_committee | enterMap school_hall_2f 12:20-17:30 | after 08 |
| main_10_tower_door | enterMap school_rooftop | after 09 |
| main_11_finch_challenge | enterMap town_harbor | after 10 |
| main_12_summer_posters | enterMap town_square | after 11, core not found, Y1 Su15-Au26 or later |
| main_13_booth_vote | enterMap school_classroom | Y1 Autumn 1-26 |
| main_14_core_handover | auto 13:00-20:00 | Y1 Bell Festival, school_grounds; Spirit >= 20 gives core, else defers |
| main_15_core_harbor | auto 15:00-23:30 on town_harbor | core not found, Y1 Wi14+ or later (fallback core) |
| main_16_core_study | enterMap school_classroom 12:20-18:30 | core found |
| main_17_year_two | wake | Y2 Sp1-7 |
| main_18_committee_y2 | enterMap school_rooftop | Y2+, after 16 |
| main_19_archive | enterMap town_hall | after 18, Y2 Summer+ (gives `old_letter`) |
| main_20_lighthouse | enterMap town_harbor | after 19 (gives fitting) |
| main_21_board_letter | enterMap school_hall_1f | Y2 Autumn+ |
| main_22_fundraiser | enterMap school_rooftop | Y2 Au1-26, after 21 |
| main_23_finch_lesson | enterMap town_harbor | fitting found, Y2 Winter+ |
| main_24_year_three | wake | Y3 Sp1-7 |
| main_25_eleven | enterMap school_classroom | any Y3 |
| main_26_rope | enterMap town_harbor | Y3 Summer+, after 25 (gives rope) |
| main_27_restoration | enterMap school_rooftop | core+fitting+rope flags, not restored |
| main_28_inspection | enterMap school_grounds | Y3 Au1-26 or Wi1-21 |
| main_29_board_meeting | auto 15:30-23:30 | Y3 Wi22-25 (prio 85, warps to town_hall) |
| main_30_board_vote | auto | after `main_board_speeches_done` (prio 55: a romance beat at 60 can run in between) |
| main_31_last_rooftop | enterMap school_rooftop | Y3 Wi26-28 |
| main_32_bell_night_finale | auto 22:30-25:59 | Y3 Wi28 and (`fest_bell_night_y3_gathered` or time >= 23:30); ends with `endGame()` |
| main_33_finale_wakeup | sleep | Y3 Wi28 if 32 not seen; same finale script |

Note: main_19/29/30 stage in `town_hall` (not tier-1 yet); the finale and 27 use `bell_tower`.

## Flags others may read
- Plot: `main_arrived`, `main_bell_story_known`, `main_committee_joined`, `main_finch_challenge`, `main_core_found`
  (`main_core_earned` = Spirit route, `main_core_deferred` / `main_core_fallback` = fallback route), `main_core_studied`,
  `main_archive_found`, `main_fitting_found`, `main_board_letter`, `main_rope_lead`, `main_rope_found`, `main_bell_restored`,
  `main_inspection_done`, `main_board_speeches_done`, `main_vote_saved` / `main_vote_merged`, `main_graduated`, `main_bell_rung`.
- Finale: `main_bell_rung_with_<nina|elise|clara|mari|vera|jules|mr_finch|roz|everyone>` (partner options only when dating).
- Choices: `main_y1_booth_<cafe|haunted|play>`, `main_y2_fund_<concert|market|run>`, `main_inspection_<kind|honest|playful>`,
  `main_speech_<kind|honest|playful>`, plus per-scene tone flags `main_NN_*` (see source).
- Club Fair: `club_pick_<track|soccer|art|music|literature|astronomy>` (or `main_club_undecided`). There is no join-club op:
  **the integrator must map `club_pick_*` to `school.club`.** The fair only offers joining while `{ club: null }`.
- Lantern Night wish: `fest_lantern_wish_<bell|stay|private>`. Every festival sets `fest_<id>_attended`.

## Quests (`quests/main.js`)
`main_first_week` (Y1 Sp1-5 onboarding), `main_silent_bell` (legend -> core -> fitting -> rope -> restore -> ring; completed in finale),
`main_save_school` (starts at main_09; completed at the vote, either outcome, with a different note).

## Community Spirit awards (`spirit` op)
Story: committee +3, posters +3, booth vote +2, core +8 (earned) or +5 (fallback), fitting +8, fundraiser +2, rope +8,
restoration +4, inspection +3 (max ~41). Festivals per attendance: +2 to +3 each (Club Fair +3, Bell Festival +3/day,
+2 extra in Y2/Y3; relay podium +2; regional meet podium (track club) +3). A player attending about half the festivals
over three years plus the story reaches 60; story alone does not (~41 + sim sources). Y1 Bell Festival threshold is 20.

## Festival frames (`fest_all.js`)
All: kind `festival`, priority 90, `repeat: 'daily'`, trigger `auto` in the calendar window, `when: { festival, map: [...] }`,
banner per year, music `festival` (sports/fireworks where fitting), cameos, small activity, Spirit.
Staging substitutions (places not built yet): beach_day, fireworks -> town_harbor; moon_night -> school_rooftop;
closing_ceremony -> school_grounds.

Evening choice (Fireworks, Moon Viewing, Bell Festival day 28, Lantern Night, Heart Day) sets
`fest_<festivalId>_y<year>_with_<nina|elise|clara|mari|vera|friends|alone>`; heroines are offered at >= 3 hearts.
**Heroine writers:** trigger your festival beat with `auto` + `{ festival: '<id>' }` + `{ flag: 'fest_<id>_y<n>_with_<you>' }`;
the frame only says where Theo finds you (a `think` line), it does not stage you. Hints used: fireworks (Elise on the harbor
steps, Vera at the dock end), moon_night (Clara at the dome), bell_festival (Mari at the exhibit, Elise in the library window),
lantern_night (Vera by the water), heart_day (Nina on the field, Vera on the rooftop).
Heart Day gives a fixed chocolate line from each heroine at >= 4 hearts (+3 friendship); write deeper beats on your side.
Bell Night Y3 sets `fest_bell_night_y3_gathered`, which lets the finale start.
Your `seen` conditions can only reference event ids that exist. Use flags to reference other writers' beats.

## Endings
`endings/main.js`: main `main_saved`, `main_merged` (order 10); `main_bell_everyone|finch|jules|roz` (order 20; partner
bell slides belong in the heroines' romance files); academic `academic_elite` (avg >= 85 & rank <= 3), `academic_state`
(>= 70), `academic_college` (>= 55), `academic_gap` (< 55); friends `friends_jules|dante|owen`; final `final_bell`.
`endings/friends_only.js`: `romance_friends_only` (`partner: null`).
Not done: per-club slides (there is no club-rank condition; a `clubRank` condition would be needed for rank tiers).
