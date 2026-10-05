# Arabic Adventure

An original, responsive Modern Standard Arabic speaking course for Diin Islaam, published at /arabic-learning/.

The course contains 24 worlds in six stages, 144 authored lessons, all 28 letters with connected forms and tracing, 24 original bilingual stories, and nine learning activities in every lesson. Beginner lessons include transliteration; advanced lessons emphasise connected speech, evidence, counterarguments, presentations and repair strategies.

## Accounts and saved progress

The page imports the existing ../kids-quest-cloud.js?v=24 account service. Existing Tuhfatul Atfaal, Seeraa Quest and Qur’an Tracker credentials work through its studentLogin, onStudentAuth, studentForgotPassword and studentLogout methods. No passwords are stored by this course.

Progress uses KidsCloud.saveProgress('arabic-speaking', profile) under the student’s existing document. It has its own course key and does not overwrite another course’s progress. Local per-user checkpoints provide a recovery copy; pending changes sync on the next successful connection. Guest practice is separate and is never silently copied into a signed-in student record.

Six sequential lessons form each world. Passing a five-question checkpoint with at least four correct answers completes a lesson. Placement checks can change the starting point without awarding skipped lessons or certificates. Completed activities resume individually; an unfinished checkpoint restarts its five questions.

## Audio and speaking

Existing recordings from ../data/arabic-adventure-audio-manifest.js support many letter and word cards. Other models use an installed Arabic speech-synthesis voice. If that voice is absent, listening activities offer a written-model fallback.

Microphone access is requested only by Record. Audio remains in memory in the current tab and is released when the learner leaves that activity. Optional browser speech recognition may use the browser provider’s speech service. Its text comparison is not a pronunciation score. Speaking completion is a learner self-check; a teacher must assess spontaneous speaking independently.

## Development

Static HTML, CSS and JavaScript; no build or additional package installation is required.

From the repository root:

    python3 -m http.server 4173

Then open /arabic-learning/. Account sync requires access to the existing Firebase service and its SDK; use the production domain for the same-origin session.

## Curriculum approach

The activities and artwork are original. Public descriptions of Reading Eggs informed the small-step map progression, explicit instruction, guided practice and rewards. CEFR and ACTFL communication guidance informed the movement from short exchanges to narrative and supported arguments. Course stages are learning goals, not accredited proficiency levels. The exact Reading Eggs student lesson requires access to its student application and was not copied.

- [Reading Eggs lesson progression](https://readingeggs.helpjuice.com/en_US/4-begin-with-the-lessons)
- [Reading Eggs programme overview](https://kb.readingeggs.com/reading-eggs-program-overview?kb_language=en_AU)
- [Council of Europe CEFR Companion Volume](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions)
- [ACTFL proficiency guidance](https://www.actfl.org/proficiency-guidelines-overview)
- [Al Jazeera Learning Arabic](https://learning.aljazeera.net/en)

Completion certificates celebrate course practice. They do not certify an external language proficiency.
