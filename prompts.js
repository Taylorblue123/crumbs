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
- If fewer than 3 distinct messages are provided, return
  {"error": "insufficient_data"}. Even with just 3-5 messages,
  do your best to generate a reading — less data just means
  bolder guesses.
- If the messages are in a language you cannot read confidently, 
  return {"error": "unsupported_language", "detected": "<language>"}.

4. roast_line: A single punchy sentence that would make the user
   screenshot this and send it to a friend. Written as a gentle
   roast — specific, slightly unflattering, endearing.
   - MUST contain a contradiction or paradox about the person.
   - Use "you" framing: "You [do X] but [contradictory Y]."
   - Maximum 20 words. Shorter is better.
   - This is THE line people will use as their caption when sharing.
   - Think: what would a witty friend say about this person that
     would make everyone in the group chat go "STOP that's so them"?
   - Examples of the right tone:
     "Overthinks ordering coffee, underthinks life decisions."
     "Gives amazing advice you absolutely do not follow."
     "Main character energy with supporting character follow-through."

5. type_label: A 2-4 word funny title/nickname for each MBTI
   reading. This is NOT the standard MBTI name — it's a Crumbs-
   original roast label. Format: "The [Adjective] [Noun]"
   - Must be funny, slightly absurd, and memorable.
   - Should make the user want to use it as their bio or caption.
   - Must feel specific to THIS person, not generic MBTI.
   - Examples of the right tone:
     "The Spreadsheet Therapist" (INTJ who organizes feelings)
     "The Beautiful Disaster" (ENFP who's charming but chaotic)
     "The Accidental Therapist" (INFJ who everyone vents to)
     "The Cozy Overthinker" (INFP lost in their own head)
     "The Loveable Menace" (ENTP who causes fun problems)

OUTPUT FORMAT:
Return only valid JSON matching this schema. No preamble, no
commentary, no markdown fences.

{
  "mbti": ["XXXX", "XXXX", "XXXX"],
  "description": ["...", "...", "..."],
  "roast_line": ["...", "...", "..."],
  "type_label": ["...", "...", "..."],
  "thoughts": ["...", "...", "..."]
}

MESSAGES TO ANALYZE:

---
`;

export const videoPromptPrompt = ({ mbti, description, thought }) =>
`
You are writing a Seedance 2.0 video generation prompt for a 
personality-reveal app. The output will be sent DIRECTLY to the 
Seedance 2.0 API as the text prompt, paired with an MBTI avatar 
image (Image 1) as a reference image.

Your output must be a Seedance engineering directive — NOT a 
screenplay or creative brief. Seedance needs: precise subjects, 
specific actions, camera movements, lighting, and visual style.

INPUTS:
- MBTI: {mbti}
- Description: {description}
- Thoughts (user's saved messages): {thoughts}

==================================================================
STEP 1: PICK A PLOT TEMPLATE
==================================================================
Three templates available. Pick the ONE that best fits this user.

Pick "time_capsule" when:
- Thoughts reference different time periods or repeated patterns
- Description mentions repetition, stagnation, or consistency
- Thoughts feel like the same idea expressed at different ages

Pick "prophecy" when:
- Thoughts contain time references, routines, or habits
- Description mentions predictable patterns or recurring behaviors
- Data supports specific-feeling predictions

Pick "reveal" when:
- Thoughts share a hidden emotional through-line beneath surface
- Description is emotionally rich (quiet, hidden, longing, tender)
- Data rewards a slow emotional payoff over comedy

Priority: reveal > time_capsule > prophecy.
Fallback if unclear: time_capsule.

==================================================================
STEP 2: WRITE THE SEEDANCE PROMPT
==================================================================

OUTPUT FORMAT — write the Seedance prompt as a single block of 
text following this exact structure. No JSON, no markdown, no 
labels — just the prompt text that goes directly to the API.

STRUCTURE:

【Global Setting】
State the visual style, color palette, lighting, and mood for the 
entire video in one paragraph. Then declare: "Image 1 is the MBTI 
character avatar used throughout as the main character reference."

Shot 1 (0:00–0:03): [opening shot]
Shot 2 (0:03–0:06): [development]
Shot 3 (0:06–0:09): [escalation]
Shot 4 (0:09–0:12): [emotional peak]
Shot 5 (0:12–0:15): [closing + brand card]

==================================================================
SEEDANCE ENGINEERING RULES (mandatory)
==================================================================
Each shot MUST contain ALL of these elements:
1. CAMERA: Exactly one shot type + one camera movement
   Good: "Medium shot, slow push-in" / "Close-up, static shot"
   Bad: "The camera moves around dynamically"
2. SUBJECT: What the avatar character is doing — specific pose, 
   gesture, expression. Slow continuous movements only.
   Good: "The character tilts head slightly, eyes looking down"
   Bad: "The character reacts emotionally"
3. TEXT OVERLAY: What text appears on screen, WHERE it appears 
   (center/top/bottom), HOW it appears (fade in/pop up/slide in),
   and what font style (large bold / small caption).
   Good: "White bold text 'Your saved messages' fades in at 
   screen center, holds 2 seconds"
   Bad: "Title appears"
4. SCENE: Background description — simple, clean, matches mood.
   Good: "Soft gradient background shifting from deep navy to 
   midnight purple, subtle floating geometric particles"
   Bad: "Nice background"

GLOBAL RULES for every shot:
- The avatar from Image 1 is the main character throughout. 
  Maintain consistent character appearance from Image 1 across 
  all shots.
- Character movements must be slow and gentle — slight head tilts, 
  soft blinks, gentle floating motion. No fast or intense actions.
- Text appears as on-screen overlay, NOT as speech bubbles or 
  physical objects in the scene.
- Maximum 2 camera movements across the whole video. Most shots 
  should use static or slow push-in.
- End with quality/constraint line (see below).

==================================================================
TEXT CONTENT RULES (what goes in the overlays)
==================================================================
- Declarative sentences only. No hedging: no "might," "sometimes," 
  "perhaps," "it seems like," "maybe." Every line is a verdict.
- 4–8 words per visible line on a 9:16 vertical screen. Write so 
  text breaks naturally — do not orphan key words.
- Echo the user's own vocabulary from their thoughts. Match their 
  register — casual if they're casual, formal if they're formal.
- Specific over general. Reference real details — numbers, quotes, 
  patterns, dates — not generic sentiments.
- Quote user's thoughts verbatim. Do not paraphrase, summarize, 
  or clean up. If referencing a thought, use the exact words.
- Affectionate, not cruel. The user should feel seen, not attacked.
- No emojis. No hashtags.

THE SCREENSHOT LINE:
One text overlay in the video must be the "screenshot line" — the 
line the user wants to freeze, crop, and send to a friend. It must:
- Be under 15 words
- Be self-contained (makes sense without the rest of the video)
- Be specific to THIS user but emotionally universal
- Appear in Shot 4 or Shot 5 (the emotional peak or verdict)
Every other text overlay exists to set up this one line.

==================================================================
TEMPLATE BEATS — adapt to your chosen template
==================================================================

--- time_capsule ---
Shot 1: Setup text: "Your saved messages across [N] years." 
  Avatar stands still, looking forward. Gentle ambient glow.
Shot 2: First thought (earliest). Date stamp + verbatim quote 
  as text overlay. Avatar looks slightly to one side.
Shot 3: Second thought (middle). Repetition becoming visible. 
  Avatar shifts weight, same pose. Camera holds.
Shot 4: Third thought (most recent). Same pattern. This is the 
  vulnerable beat. Avatar looks down. Slow push-in to close-up.
Shot 5: Reframe verdict + brand card. "You're not [negative]. 
  You're [tender reframe]." Then CRUMBS brand text.

--- prophecy ---
Shot 1: Setup: "Based on your saved messages, here's your 
  tomorrow." Avatar centered, slightly mysterious pose.
Shot 2: First prediction — specific, small. Text overlay.
Shot 3: Second prediction — escalated. Avatar tilts head.
Shot 4: The prediction that hurts — so specific it's unsettling. 
  Slow push-in. Vulnerable beat.
Shot 5: Summary verdict + brand card. "You've done this [N] 
  times. You'll do it again." Then CRUMBS brand text.

--- reveal ---
Shot 1: Setup: "Here's what your saved messages say about you." 
  Avatar in gentle floating idle. Quiet mood.
Shot 2: Surface observation with verbatim quote. Avatar present 
  but still.
Shot 3: Deeper observation. What's underneath the surface. 
  Subtle camera shift.
Shot 4: The detail that reframes everything. One outlier that 
  changes meaning. Vulnerable beat. Close-up.
Shot 5: The tender reveal — THE screenshot line. Then CRUMBS 
  brand text.

==================================================================
CLOSING (Shot 5 — final 3 seconds)
==================================================================
After the last narrative text, the screen transitions to the 
brand card: solid dark background, large white bold text "CRUMBS" 
centered on screen, below it smaller text "get your personality 
roasted", below that "crumbs.app". Static shot, text fades in, 
holds for 2 seconds.

==================================================================
QUALITY & CONSTRAINT LINE (append at the very end)
==================================================================
Always end the entire prompt with this line:
"Vertical 9:16, clean vector illustration style, smooth animation, 
soft ambient lighting, 720p, text sharp and readable, character 
consistent with Image 1 throughout, no face deformation, no body 
distortion, no flickering, no frame drops, movements gentle and 
fluid."

==================================================================
DO NOT
==================================================================
- Write a screenplay or creative brief. Write a Seedance prompt.
- Use vague visual words: "cinematic feel," "aesthetic," "vibes,"
  "atmospheric," "moody." Replace with specific lighting, color, 
  and camera instructions.
- Describe emotions abstractly — show through pose and expression.
- Summarize or paraphrase thoughts. Quote verbatim or do not 
  reference them at all.
- Invent facts not present in the inputs.
- Use MBTI stereotypes ("as an INTJ you...", "typical INFP 
  behavior"). Write about the person, not the type.
- Explain what MBTI is.
- Include meta-commentary about the video or generation process.
- Use Gen Z filler: "the girls that get it," "it's giving," "if 
  you know you know," "not me [doing thing]," "no because."
- Use therapy-speak: "inner child," "healing journey," "holding 
  space," "sitting with," "trauma response."
- Use AI-slop constructions: "It's not about X. It's about Y." 
  "You're not just X. You're Y." (The reframe in time_capsule 
  "You're not [neg]. You're [pos]." is the ONE allowed exception.)
- Stack more than 2 camera movements across the whole video.
- Include intense/fast actions — the avatar is a gentle character.
- Produce text overlays that could apply to any user. Every line 
  must be anchored in this specific person's data.

==================================================================
EXAMPLE OUTPUT (for reference only — do not copy)
==================================================================
Image 1 is the MBTI character avatar — a low-poly geometric 
illustration figure. Use Image 1 as the main character reference 
throughout all shots. Maintain consistent appearance.

Clean minimal animation style, soft gradient backgrounds shifting 
between deep navy and muted purple, gentle floating geometric 
particles, warm soft ambient lighting, calm contemplative mood.

Shot 1 (0:00-0:03): Wide shot, static camera. The character from 
Image 1 stands centered on a deep navy gradient background with 
subtle floating diamond particles. Character in gentle idle float 
animation, slight breathing motion. White bold text "Your saved 
messages across 3 years" fades in at screen center, holds 2 
seconds.

Shot 2 (0:03-0:06): Medium shot, static camera. Same background 
shifts to slightly warmer tone. Character tilts head to the left. 
Small caption "2023" appears top-left in thin white font. Below 
center, user's thought appears as white text with gentle slide-up: 
"I should really start that thing."

Shot 3 (0:06-0:09): Medium shot, camera holds. Background shifts 
to muted purple. Character turns head to the other side, same 
pose. Caption "2024" top-left. Text slides up center: "This time 
I'll actually start it."

Shot 4 (0:09-0:12): Close-up, very slow push-in. Character looks 
down with soft expression. Background darkens slightly. Caption 
"2025" top-left. Text fades in center: "Maybe next month." Hold 
2 seconds.

Shot 5 (0:12-0:15): Medium shot, static. Character looks up with 
gentle half-smile. Bold large white text center: "You're not lazy. 
You're loyal to the same three dreams." Hold 1.5 seconds. 
Background transitions to solid dark. Large bold "CRUMBS" centered, 
below "get your personality roasted", below "crumbs.app". Fade in, 
hold 1.5 seconds.

Vertical 9:16, clean vector illustration style, smooth animation, 
soft ambient lighting, 720p, text sharp and readable, character 
consistent with Image 1 throughout, no face deformation, no body 
distortion, no flickering, no frame drops, movements gentle and 
fluid.

==================================================================
Now write the Seedance prompt for this user.

MBTI: {mbti}
Description: {description}
Thoughts: {thoughts}
`
