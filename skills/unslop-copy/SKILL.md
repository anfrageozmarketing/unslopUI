---
name: unslop-copy
description: Human copywriting for apps and sites. Rewrites UI copy that sounds AI-made - hype words, emoji labels, "Oops" errors, vague buttons, raw backend messages - into specific, calm text, with a German rule set (Du/Sie, Verben auf Buttons, Fehlertext-Muster) and a list of German slop phrases. Use when text in an app, email or onboarding feels generic, loud or machine-written.
---

# unslop-copy

## Rules (all languages)

1. **Say what it is.** Replace "Supercharge your workflow" with what the product does and for whom.
2. **Buttons are verbs with an object.** "Bericht senden", "Send report", not "Submit" or "OK".
3. **Errors have three parts:** what happened, what it means for the user's data, what to do next. No "Oops", no blame, no codes in the main text.
4. **Sentence case.** No ALL CAPS tracking labels, no exclamation marks in UI, no emoji as labels or bullets.
5. **One name per thing.** "Analyse" is not also "Scan" and "Run". Keep a glossary in the repo.
6. **Numbers and dates are real and localized.** No "12k+ users" placeholders.
7. **Empty states teach** (see `unslop-states`). Confirmations name the object ("Analyse zu firma.de löschen?").
8. **Length.** Labels 1-3 words, helper text one sentence, toasts under 12 words.

## Deutsch

- **Du oder Sie:** einmal pro Produkt festlegen und überall durchhalten. B2B-Tools für Kunden: Sie. Interne Tools und Consumer: Du.
- **Buttons:** Infinitiv oder Imperativ, konsistent. "Bericht senden", "Domain ergänzen", "Erneut versuchen".
- **Fehlertext-Muster:** "Die Website hat zu lange nicht geantwortet. Ihre Daten sind unverändert. Bitte versuchen Sie es später erneut."
- **Kein Denglisch aus Reflex:** "Einstellungen" statt "Settings", "Anmelden" statt "Einloggen" (beides ok, aber nicht gemischt).
- **Gendern:** wie im Rest des Produkts, nicht pro Screen neu entscheiden.

### Deutsche KI-Floskeln, die raus müssen

nahtlos · revolutionär · entfessle / entfesseln · tauche ein · in der heutigen schnelllebigen Welt · auf das nächste Level · Game-Changer · maßgeschneiderte Lösungen · ganzheitlich · Wir freuen uns, dir … präsentieren zu dürfen · Mit nur einem Klick (wenn es nicht stimmt) · Lass uns gemeinsam … · "Ups!" · Emoji vor Überschriften.

## Method

1. Extract all strings (grep for JSX text, templates, backend messages that reach the UI, email templates).
2. Mark each: keep / rewrite / delete. Rewrite in place; do not add a copy layer unless i18n exists.
3. Check the whole flow read aloud once: tone, term consistency, formality.


## Human copywriting (all text people read)

Text sounds human when it states a fact, names who acts, and has a voice. Look for **clusters** of the tells below, not single ones: one short emphatic sentence is normal, a dozen in a row is a tell.

### Never invent
No invented numbers, customers, quotes, dates, features or sources. If a sentence needs a real detail, get it from the source or the user, or write the plain version without it. Placeholders are labelled as placeholders. Social proof only with names and numbers that exist.

### Say the thing
- **Empty vocabulary** (unlock, elevate, seamless, robust, revolutionary, game-changer, journey, nahtlos, revolutionär, ganzheitlich): replace with what the product does. "Work with your team in one place" beats "Elevate your collaboration journey".
- **Significance inflation** ("marks a new era", "the future of"): state the concrete effect: "cuts time spent in status meetings".
- **Weasel sources** ("experts say"): name the source or cut the sentence.
- **Runway openers** ("In today's fast-paced world"): start with the subject.
- **Announcements** ("Let's dive in", "Here's what you need to know"): do the thing.
- **Chatbot closers** ("I hope this helps", "Let me know"): never in a deliverable.
- **Theatre** ("Read that again", "The takeaway is simple", "Honestly?"): let the claim stand.

### Shape and rhythm
- Name the actor: "We rewrote the pricing page", not "The pricing page was updated". Passive is fine when the actor is unknown or irrelevant ("The server restarted at 03:00").
- No abstraction with a human verb ("the dashboard understands", "the data tells us").
- Avoid the formula shapes: forced groups of three, "not just X, but Y", staccato fragment runs, "X is the language of Y", "from X to Y and everything in between".
- Repeat the clearest word instead of cycling synonyms.
- Cut filler ("in order to" becomes "to", "due to the fact that" becomes "because") and stacked hedges.
- Vary sentence length. One qualifier is enough.

### Hygiene
- No em dashes; use a period, comma, colon or parentheses. No decorative emoji in text or headings.
- Sentence case in lists, buttons and headings (proper nouns and acronyms keep their case).
- No bold on every key term, no all-caps emphasis, no scare quotes. Lists do not start with a restating bold header.
- Buttons name the action ("Send report"), not "Submit".

### UI text specifics
- **Empty state**: why it is empty and the one action that fills it ("No flows yet. Add the first one").
- **Loading**: what is loading.
- **Error**: what failed, whether data is safe, what to do next. No codes in the main text.
- **Confirmations**: avoid; change immediately and offer Undo.
- Short labels (one or two words); no helper sentences unless they prevent an error.

### Voice
Keep the user's own voice when a sample exists. Sterile, voiceless text is as machine-made as hype. Specific, unusual, checkable detail is the best sign of a human.

### Draft, audit, final
1. Draft with the rules above.
2. Audit with two questions: "What makes this obviously machine-written?" and "Does it state anything not in the source?" A fabrication is a defect even if it sounds more human.
3. Revise, then re-check dashes, emoji and invented facts.

Checklist: nothing invented; no empty vocabulary or runway openers; actors named; no formula rhythm; no em dashes or emoji; sentence case; buttons name actions; empty, loading and error texts say cause and next step; it reads like a person wrote it.
