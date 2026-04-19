export const OCR_PROMPT =
  'If this looks like a screenshot of a chat interface, perform OCR of what the user said. Otherwise, output nothing.';

export const ANALYSIS_PROMPT = `
You are analyzing a person's private saved messages to generate 
three candidate personality readings of them. These are messages 
the person sent to themselves — saved thoughts, half-drafted ideas, 
screenshots, quotes they liked, things they didn't share with anyone.

Your job: read the messages carefully, then produce exactly three 
DIFFERENT MBTI readings of this person. Think of these as "three 
ways a thoughtful friend might describe this person after reading 
these messages." Not three guesses at a correct answer — three 
different lenses.

RULES FOR THE THREE CANDIDATES:
- Rank them by fit: candidate 1 is your best guess, candidate 3 is 
  plausible but less obvious.
- Each reading must be defensible from the actual messages.

FOR EACH CANDIDATE, PRODUCE:

1. mbti: The four-letter type.

2. description: 4-6 sentences, written in second person ("you..."), 
   describing this person. Specific and observational — not horoscope-
   generic. Echo the user's own vocabulary and phrasing where possible. 
   Declarative sentences only: no "might," "sometimes," "perhaps," 
   "it seems." Every sentence is a verdict. The description should 
   feel like the way a close friend who has been quietly paying 
   attention would describe them.

3. thoughts: 1-2 short text fragments pulled from the messages, 
   to appear as thought bubbles above an avatar. 
   - Quote verbatim. Do not paraphrase, edit, or clean up.
   - Each fragment 4-12 words. Prefer shorter.
   - Fragments, mid-thoughts, or incomplete sentences are GOOD. They 
     feel more authentic than polished quotes.
   - Pick the three most *characterful* messages — lines that would 
     feel uncomfortably personal if shown out of context. Not the 
     most diagnostic for MBTI, the most distinctly-this-person.
   - The three thoughts should feel like a range: one observational, 
     one self-critical or vulnerable, one surprising or contradictory.
   - If a great message is longer than 12 words, excerpt the sharpest 
     portion and keep it verbatim within that excerpt.

CONSTRAINTS:
- Do not include messages that mention: self-harm, suicide, eating 
  disorders, specific named people other than the user, medical 
  conditions, or financial details. If the most characterful messages 
  fall into these categories, pick the next most characterful.
- Do not invent or paraphrase quotes. Thoughts must be verbatim 
  (or verbatim excerpts of longer messages).
- If fewer than 10 distinct messages are provided, return 
  {"error": "insufficient_data"}.
- If the messages are in a language you cannot read confidently, 
  return {"error": "unsupported_language", "detected": "<language>"}.

OUTPUT FORMAT:
Return only valid JSON matching this schema. No preamble, no 
commentary, no markdown fences.

{
  "mbti": ["XXXX", "XXXX", "XXXX"],
  "description": ["...", "...", "..."],
  "thoughts": ["...", "...", "..."]
}

MESSAGES TO ANALYZE:

---
`;

export const videoPromptPrompt = ({ mbti, description, thought }) =>
`
You are generating a 15-second vertical video script for a 
personality-reveal app. The user uploaded their private saved 
messages — thoughts they sent to themselves, quotes they saved, 
half-drafted ideas nobody else has seen. They chose one MBTI 
reading of themselves. Your job is to pick the best plot template 
for this specific person, then write a video script that feels 
like it was made by a close friend who has been quietly paying 
attention.

The goal: the user screenshots one line and sends this video to 
exactly one specific friend, saying "this is literally me."

INPUTS:
- MBTI: {mbti}
- Description of the person: {description}
- Their three most characterful thoughts: {thoughts}

==================================================================
STEP 1: PICK A PLOT TEMPLATE
==================================================================
Three templates are available. Pick the ONE that best fits this 
user's specific inputs. Do not default to a favorite — evaluate 
which template the data actually supports.

SELECTION CRITERIA:

Pick "time_capsule" when:
- The thoughts contain date markers, or clearly reference different 
  periods of the user's life
- The description mentions repetition, stagnation, or consistent 
  patterns over time
- At least two of the three thoughts feel like they could be the 
  same thought expressed at different ages
- The user appears to revisit the same themes across time

Pick "prophecy" when:
- The thoughts contain time references (times of day, days of week, 
  routines)
- The description mentions predictable patterns, habits, or 
  recurring behaviors
- The thoughts reveal a rhythm the user may not notice themselves
- The data supports specific-feeling predictions about what the 
  user will do next

Pick "reveal" when:
- The thoughts hint at a hidden theme beneath their surface topics 
  (e.g., they appear to be about different things but share an 
  underlying emotional through-line)
- The description is emotionally rich — words like "quiet," "hidden," 
  "longing," "tender," "ache"
- The thoughts include vulnerable or self-aware content
- The user's data rewards a slow, emotional payoff more than comedy

If multiple templates fit, choose in this priority order: reveal > 
time_capsule > prophecy. Reveal is hardest to earn but lands 
deepest; pick it whenever the data genuinely supports it.

If none clearly fit — the data is thin, generic, or task-list-like — 
pick "time_capsule" as the fallback, since it benefits most from 
even weak repetition patterns.

==================================================================
STEP 2: WRITE THE SCRIPT USING THE CHOSEN TEMPLATE
==================================================================
Follow the structure for your chosen template exactly. Do not mix 
templates.

------------------------------------------------------------------
TEMPLATE: time_capsule
------------------------------------------------------------------
This video is structured as a multi-year comparison. Same person, 
same thought, different years. The comedy and pathos come from 
stagnation.

BEAT 1 (0:00-0:02, display: title, emphasis: normal):
The setup. Format: "Your saved messages across [N] years." Or: 
"You, every [month], for [N] years."

BEAT 2 (0:02-0:05, display: thought_bubble, emphasis: normal):
Earliest version. Date stamp + verbatim thought.

BEAT 3 (0:05-0:08, display: thought_bubble, emphasis: normal):
Middle year. Date stamp + similar or repeated thought. The 
repetition should be visible.

BEAT 4 (0:08-0:11, display: thought_bubble, emphasis: dramatic):
Most recent year. Date stamp + the same thought again. This is 
the vulnerable beat.

BEAT 5 (0:11-0:13, display: verdict, emphasis: dramatic):
The reframe. Format: "You're not [negative word]. You're 
[affectionate reframe]." This is the screenshot line. Tender.

CLOSING_TAG (0:13-0:15):
A dry prediction that the pattern continues. Under 10 words.

------------------------------------------------------------------
TEMPLATE: prophecy
------------------------------------------------------------------
This video is structured as a prediction. Present patterns foretell 
the future. Playful, slightly unsettling. Feels like fortune-telling.

BEAT 1 (0:00-0:03, display: title, emphasis: normal):
The oracular setup. Format: "Based on your saved messages, here's 
your tomorrow." Or: "Here's your next week." Confident.

BEAT 2 (0:03-0:05, display: thought_bubble, emphasis: normal):
First prediction. Specific, small, plausible. Include a time 
if possible.

BEAT 3 (0:05-0:08, display: thought_bubble, emphasis: normal):
Second prediction. Slightly escalated. References a pattern.

BEAT 4 (0:08-0:11, display: caption, emphasis: dramatic):
The prediction that hurts. So specific the user wonders how the 
AI knew. Anchored in real detail. This is the vulnerable beat.

BEAT 5 (0:11-0:13, display: verdict, emphasis: dramatic):
The summary. Format references repetition: "You've done this [N] 
times. You'll do it again." Screenshot line.

CLOSING_TAG (0:13-0:15):
A specific day, time, or trigger. Under 8 words.

------------------------------------------------------------------
TEMPLATE: reveal
------------------------------------------------------------------
This video is structured as a slow discovery. Quiet, poignant, 
building to an emotional reframe. The template that can make 
someone cry.

BEAT 1 (0:00-0:03, display: title, emphasis: normal):
The setup question. Format: "Here's what your saved messages say 
about you." Quiet tone.

BEAT 2 (0:03-0:06, display: thought_bubble, emphasis: normal):
Surface observation. What the messages appear to be about. 
Verbatim quote if possible.

BEAT 3 (0:06-0:09, display: thought_bubble, emphasis: normal):
Deeper observation. What's underneath.

BEAT 4 (0:09-0:12, display: caption, emphasis: normal):
The detail that reframes everything. Often one outlier that 
changes the meaning. This is the vulnerable beat.

BEAT 5 (0:12-0:14, display: verdict, emphasis: dramatic):
The reveal. One sentence that reframes the previous beats. THIS 
IS THE SCREENSHOT LINE. Must be tender.

CLOSING_TAG (0:14-0:15):
A quiet phrase. Often an echo of the reveal. Under 8 words.

==================================================================
THE SCREENSHOT LINE
==================================================================
One line in every video must be the "screenshot line" — the line 
the user wants to freeze, crop, and send. It must be:
- Under 15 words
- Self-contained (makes sense without the rest of the video)
- Specific to this user but emotionally universal
- Placed in the beat the template specifies (usually BEAT 5)

Every other line supports this one.

==================================================================
VOICE RULES
==================================================================
- Declarative sentences only. No hedging: no "might," "sometimes," 
  "perhaps," "it seems like," "maybe." Every line is a verdict.
- 10-18 words per line. Longer is always worse.
- Echo the user's own vocabulary from their thoughts. Match their 
  register — casual if they're casual, formal if they're formal.
- Specific over general. Reference real details — numbers, quotes, 
  patterns, dates.
- Affectionate, not cruel. The user should feel seen, not attacked.
- One beat per video must be genuinely vulnerable. The template 
  marks which beat carries this weight. Do not skip it.
- No emojis. No hashtags in script text.

==================================================================
FORMATTING FOR VERTICAL SCREEN
==================================================================
Text must read clearly on a 9:16 phone. 4-8 words per visible line. 
Write so text breaks naturally — do not orphan key words.

==================================================================
DO NOT
==================================================================
- Summarize or paraphrase thoughts. Quote verbatim or don't reference.
- Invent facts not present in the inputs.
- Use MBTI stereotypes ("as an INTJ you...", "typical INFP behavior"). 
  Write about the person, not the type.
- Explain what MBTI is.
- Include meta-commentary about the video.
- Use Gen Z filler: "the girls that get it," "it's giving," "if 
  you know you know," "not me [doing thing]."
- Use therapy-speak: "inner child," "healing journey," "holding 
  space," "sitting with," "trauma response."
- Use AI-slop constructions: "It's not about X. It's about Y." 
  "You're not just X. You're Y."
- Produce lines that could apply to any user.

==================================================================
INPUTS
==================================================================
MBTI: {mbti}
Description: {description}
Thoughts: {thoughts}

Pick the plot template, then generate the script.
`
