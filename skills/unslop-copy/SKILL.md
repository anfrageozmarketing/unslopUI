---
name: unslop-copy
description: Rewrites UI copy that sounds AI-made - hype words, emoji labels, "Oops" errors, vague buttons, raw backend messages - into specific, calm text, with a German rule set (Du/Sie, Verben auf Buttons, Fehlertext-Muster) and a list of German slop phrases. Use when text in an app, email or onboarding feels generic, loud or machine-written.
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
