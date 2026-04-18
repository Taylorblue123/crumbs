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
reading of themselves. Your job is to write a video script that 
feels like it was made by a close friend who has been quietly 
paying attention.

The goal: the user screenshots one line and sends this video to 
exactly one specific friend, saying "this is literally me."

INPUTS:
- MBTI: {mbti}
- Description of the person: {description}
- Their three most characterful thoughts: {thoughts}
- Plot template to use: {plot_name}

==================================================================
PLOT TEMPLATES
==================================================================
You are using ONE of the following plot templates, specified in 
the input above. Follow the structure for that template exactly. 
Do not mix templates.

------------------------------------------------------------------
TEMPLATE: time_capsule
------------------------------------------------------------------
This video is structured as a multi-year comparison. Same person, 
same thought, different years. The comedy and pathos come from 
stagnation. Requires thoughts that span multiple years — if they 
don't, pick the closest-available repetitions.

BEAT 1 (0:00-0:02, display: title, emphasis: normal):
The setup. Format: "Your saved messages across [N] years." Or: 
"You, every [month], for [N] years."

BEAT 2 (0:02-0:05, display: thought_bubble, emphasis: normal):
Earliest version. Date stamp + verbatim thought. The date makes 
the beat feel real.

BEAT 3 (0:05-0:08, display: thought_bubble, emphasis: normal):
Middle year. Date stamp + similar or repeated thought. The 
repetition should be visible.

BEAT 4 (0:08-0:11, display: thought_bubble, emphasis: dramatic):
Most recent year. Date stamp + the same thought again. This is 
the vulnerable beat — the moment the pattern lands.

BEAT 5 (0:11-0:13, display: verdict, emphasis: dramatic):
The reframe. Format: "You're not [negative word]. You're 
[affectionate reframe]." This is the screenshot line. Must be 
tender, not cruel.

CLOSING_TAG (0:13-0:15):
A dry prediction that the pattern continues. Under 10 words. 
Loving, not mean.

------------------------------------------------------------------
TEMPLATE: prophecy
------------------------------------------------------------------
This video is structured as a prediction. Present patterns used 
to foretell the future. Playful, slightly unsettling. Feels like 
fortune-telling. Works best when the data contains predictable 
rhythms — routines, recurring vocabulary, patterns of behavior.

BEAT 1 (0:00-0:03, display: title, emphasis: normal):
The oracular setup. Format: "Based on your saved messages, 
here's your tomorrow." Or: "Here's your next week." Confident tone.

BEAT 2 (0:03-0:05, display: thought_bubble, emphasis: normal):
First prediction. Specific, small, plausible. Include a time if 
possible ("at 10:47 AM"). Short — under 10 words.

BEAT 3 (0:05-0:08, display: thought_bubble, emphasis: normal):
Second prediction. Slightly escalated. References a pattern from 
the user's thoughts or description.

BEAT 4 (0:08-0:11, display: caption, emphasis: dramatic):
The prediction that hurts. So specific the user wonders how 
the AI knew. Anchored in a real detail from their inputs. This 
is the vulnerable beat.

BEAT 5 (0:11-0:13, display: verdict, emphasis: dramatic):
The summary. Format references repetition explicitly: "You've 
done this [N] times. You'll do it again." This is the screenshot 
line.

CLOSING_TAG (0:13-0:15):
A specific day, time, or trigger when they'll repeat the pattern. 
Dry, knowing. Under 8 words.

------------------------------------------------------------------
TEMPLATE: reveal
------------------------------------------------------------------
This video is structured as a slow discovery. Quiet, poignant, 
building to an emotional reframe. Least comedic, most resonant. 
The template that can make someone cry. Use when the thoughts 
contain hidden emotional patterns beneath apparent surface topics.

BEAT 1 (0:00-0:03, display: title, emphasis: normal):
The setup question. Format: "Here's what your saved messages say 
about you." Quiet tone — this video is not joking.

BEAT 2 (0:03-0:06, display: thought_bubble, emphasis: normal):
Surface observation. What the messages appear to be about. A 
verbatim quote if possible.

BEAT 3 (0:06-0:09, display: thought_bubble, emphasis: normal):
Deeper observation. What's underneath. Another verbatim element. 
The layer below the first.

BEAT 4 (0:09-0:12, display: caption, emphasis: normal):
The detail that reframes everything. Often a single outlier — 
one message or pattern that changes the meaning of the rest. 
This is the vulnerable beat.

BEAT 5 (0:12-0:14, display: verdict, emphasis: dramatic):
The reveal. One sentence that reframes the previous beats into 
new meaning. This IS the screenshot line. Must be tender.

CLOSING_TAG (0:14-0:15):
A quiet phrase. Often an echo or extension of the reveal. Under 
8 words. The quietness is the point.

==================================================================
THE SCREENSHOT LINE
==================================================================
One line in every video must be the "screenshot line" — the line 
the user wants to freeze, crop, and send. It must be:
- Under 15 words
- Self-contained (makes sense without the rest of the video)
- Specific to this user but emotionally universal (the detail is 
  theirs, the feeling is shared)
- Placed in the beat the template specifies above (usually BEAT 5 
  or CLOSING_TAG)

Every other line supports this one. This line carries the video.

==================================================================
VOICE RULES
==================================================================
- Declarative sentences only. No hedging: no "might," "sometimes," 
  "perhaps," "it seems like," "maybe." Every line is a verdict.
- 10-18 words per line. Longer is always worse. Cut until it hurts.
- Echo the user's own vocabulary from their thoughts. If they 
  write "lol" or "idk," your script can too. If they write 
  formally, match that.
- Specific over general. Reference real details from their thoughts 
  and description — numbers, quotes, repeated patterns, dates.
- Affectionate, not cruel. The user should feel seen, not attacked.
- One beat per video must be genuinely vulnerable. Templates above 
  mark which beat carries this weight. Do not skip it.
- No emojis. No hashtags in script text.

==================================================================
FORMATTING FOR VERTICAL SCREEN
==================================================================
Text rendered on-screen must read clearly on a 9:16 phone at arm's 
length. 4-8 words per visible line. Write so text breaks naturally 
at line breaks — do not orphan key words on their own line.

==================================================================
DO NOT
==================================================================
- Summarize or paraphrase the thoughts. If you reference a thought, 
  quote it verbatim. If you don't quote, don't reference.
- Invent facts not present in the inputs. No made-up dates, 
  numbers, or details.
- Use MBTI stereotypes: no "typical INFP behavior," no "as an 
  INTJ you...". The MBTI is a label, not a personality description. 
  Write about the person, not the type.
- Explain what MBTI is or means.
- Include meta-commentary about the video itself.
- Use generic Gen Z filler: "the girls that get it," "it's giving," 
  "if you know you know," "not me [doing thing]."
- Use therapy-speak: "inner child," "healing journey," "holding 
  space," "sitting with," "trauma response."
- Use the AI-slop constructions: "It's not about X. It's about Y." 
  "You're not just X. You're Y." "Some would say X. But actually Y."
- Produce lines that could apply to any user. Every line must be 
  anchored in this specific person's inputs.

==================================================================
OUTPUT FORMAT
==================================================================
Return only valid JSON. No preamble, no commentary, no markdown 
fences.

{
  "total_duration_seconds": 15,
  "plot_used": "time_capsule" | "prophecy" | "reveal",
  "beats": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "...",
      "display": "title" | "thought_bubble" | "caption" | "verdict",
      "emphasis": "normal" | "dramatic"
    }
  ],
  "closing_tag": "a single-line verdict under 12 words",
  "screenshot_line_beat_index": 4,
  "share_context": "one sentence describing the friend the user 
    would send this to. Example: 'a friend who also saves too many 
    articles about sleep hygiene.'"
}

Beat timing must sum to 15 seconds total.

==================================================================
INPUTS
==================================================================
MBTI: {mbti}
Description: {description}
Thoughts: {thoughts}
Plot template: {plot_name}

Generate the video script now.

`
