# CloudRecall | AWS CLF-C02 Study Game

A responsive, gamified study application built from the two supplied AUF AWS Certified Cloud Practitioner handouts.

## Included question banks

- Official Practice Exam: 65 questions
- Official Pretest: 65 questions
- **Total: 130 questions**

Question wording, answer choices, marked correct answers, and option explanations are extracted from the supplied PDFs. Each question retains its source and original question number.

## Study modes

### Flashcards
- The front shows the complete question and all answer choices.
- Flip to reveal the correct answer(s) and the source explanation for every option.
- Mark each card **Got it** or **Review again** to guide future study.
- Keyboard: `Space` to flip, `←` / `→` to navigate.

### Quiz
- Single-answer questions use radio selection.
- Multi-select questions use checkboxes and require all correct answers, with no incorrect selections.
- Submit to see whether the response is correct, the correct answer(s), and explanations for every choice.
- Retry any question without losing progress.

## Retention features

- Mixed, Practice-only, and Pretest-only question banks
- Shuffled sessions and focused review of missed questions
- Session accuracy, streak, answered count, and study progress
- Persistent progress using browser local storage
- No lives, hearts, game-over state, or penalty for mistakes
- Immediate feedback and repeat practice

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build for production

```bash
npm run build
npm run preview
```

Vite outputs the production site to `dist/`.

## Deploy to Vercel

1. Extract this ZIP and push the project folder to a GitHub repository.
2. In Vercel, select **Add New → Project** and import the repository.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy. No environment variables or backend are required.

The included `vercel.json` also provides the SPA rewrite.

## Data and privacy

Study progress is saved in the browser's local storage on the device and browser being used. It is not synchronized between devices and is not sent to a server. Clearing site data will clear saved progress.

## Source note

This app reproduces the content in the two PDFs supplied for this task. Explanations are the handout's explanations, not independently updated AWS documentation. If AWS services or exam content change, use current AWS exam materials for final verification.
