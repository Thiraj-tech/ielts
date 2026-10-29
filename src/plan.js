// The 90-day IELTS Academic plan. Instructions are kept exactly as supplied.

export const TOTAL_DAYS = 90;
export const DAILY_BUDGET = 60;

export const PHASES = {
  1: 'Find your starting level',
  2: 'Listening and reading fundamentals',
  3: 'Academic writing and reading accuracy',
  4: 'Complete your first month',
  5: 'Improve listening',
  6: 'Improve reading speed',
  7: 'Strengthen writing',
  8: 'Midpoint assessment',
  9: 'Exam techniques',
  10: 'Full test practice',
  11: 'Mock exam week',
  12: 'Final preparation',
  13: 'Consolidate and prepare',
};

export const SKILLS = [
  'Listening', 'Reading', 'Writing Task 1', 'Writing Task 2', 'Writing', 'Speaking',
  'Grammar', 'Vocabulary', 'Mixed practice', 'Timed practice', 'Mock test', 'Review', 'Rest',
];

export const SKILL_TIPS = {
  'Listening': 'Read the questions before the audio starts, underline keywords, and check spelling and word limits when you write answers.',
  'Reading': 'Note where each answer is in the passage. If an answer is wrong, find the sentence that proves the correct one.',
  'Writing Task 1': 'Aim for at least 150 words in about 20 minutes. Include a clear overview of the main trends and give no opinions.',
  'Writing Task 2': 'Aim for at least 250 words in about 40 minutes. Answer every part of the question and keep one main idea per paragraph.',
  'Writing': 'Task 2 counts for twice as much as Task 1, so spend about 20 minutes on Task 1 and 40 minutes on Task 2.',
  'Speaking': 'Record yourself. Listen back for long pauses, repeated words and short answers you could extend with a reason or example.',
  'Grammar': 'Add each error you find to the Mistake journal so you can review it again later.',
  'Vocabulary': 'Learn words together with the words they usually go with (collocations), and write your own example sentences.',
  'Mixed practice': 'Split your time evenly and log mistakes in the journal as you go.',
  'Timed practice': 'Use strict timing with no pauses, then review every wrong answer.',
  'Mock test': 'Simulate exam conditions: quiet room, strict timing, no dictionary. Record your results on the Scores page.',
  'Review': 'Open the Mistake journal, filter for unresolved mistakes and redo those questions.',
  'Rest': 'Keep today light. Sleep well and confirm your test time, venue and ID.',
};

// [day, skill, short title, instructions, estimated minutes]
const RAW = [
  [1, 'Listening', 'Diagnostic listening practice', 'Take a 30-minute IELTS listening practice and review answers for 30 minutes.', 60],
  [2, 'Reading', 'Diagnostic reading passage', 'Complete one reading passage in 25 minutes; review answers and unfamiliar words.', 60],
  [3, 'Writing Task 2', 'Introduction and body paragraphs', 'Write an essay introduction and two body paragraphs; review grammar.', 60],
  [4, 'Speaking', 'Record answers about yourself', 'Record answers to 10 questions about yourself, work, hobbies and studies.', 60],
  [5, 'Grammar', 'Sentence structure and common errors', 'Study sentence structure, subject–verb agreement and common grammar errors.', 60],
  [6, 'Mixed practice', 'Listening, reading and vocabulary', 'Practise 20 minutes each of listening, reading and vocabulary review.', 60],
  [7, 'Review', 'Weekly review', 'Review mistakes from Days 1–6 and repeat your weakest exercise.', 60],

  [8, 'Listening', 'Predicting answers', 'Practise predicting answers before listening; focus on names, dates and numbers.', 60],
  [9, 'Reading', 'Skimming and scanning', 'Practise skimming for main ideas and scanning for specific information.', 60],
  [10, 'Writing Task 1', 'Describing a bar chart', 'Learn how to describe a bar chart; write an overview and comparisons.', 60],
  [11, 'Speaking', 'Part 1 short answers', 'Practise short answers about home, work, daily routines and hobbies.', 60],
  [12, 'Vocabulary', 'Education vocabulary', 'Learn 10 words for education; write your own sentences using them.', 60],
  [13, 'Listening', 'Multiple choice and distractors', 'Practise multiple-choice questions and review distractors.', 60],
  [14, 'Review', 'Weekly review', 'Redo difficult questions and review your 10 most useful words.', 60],

  [15, 'Reading', 'True / False / Not Given', 'Practise True/False/Not Given questions and find evidence in the passage.', 60],
  [16, 'Writing Task 2', 'Opinion essay structure', 'Learn opinion essay structure; write a plan and a clear thesis statement.', 60],
  [17, 'Listening', 'Form and sentence completion', 'Practise form completion and sentence completion.', 60],
  [18, 'Speaking', 'Part 2: a memorable event', 'Prepare a one-minute plan and speak for up to two minutes about a memorable event.', 60],
  [19, 'Grammar', 'Complex sentences and punctuation', 'Practise complex sentences, conjunctions and punctuation.', 60],
  [20, 'Writing Task 1', 'Timed line graph report', 'Write a 150-word report about a line graph in 20 minutes; review it.', 60],
  [21, 'Review', 'Weekly review', 'Review one essay, one speaking recording and your listening errors.', 60],

  [22, 'Reading', 'Matching headings', 'Practise matching headings to paragraphs.', 60],
  [23, 'Listening', 'Two timed sections', 'Complete two timed sections and analyse missed answers.', 60],
  [24, 'Writing Task 2', 'Full essay in 40 minutes', 'Write a complete essay in 40 minutes and check all four writing criteria.', 60],
  [25, 'Speaking', 'Part 3: education opinions', 'Practise explaining opinions, reasons and examples about education.', 60],
  [26, 'Vocabulary', 'Monthly words and collocations', 'Review 30 words from the month and practise collocations.', 60],
  [27, 'Timed practice', 'Progress test: listening and reading', 'Complete a timed listening and reading practice.', 90],
  [28, 'Review', 'Monthly review', 'Compare your results with Week 1 and choose your two weakest skills.', 60],

  [29, 'Listening', 'Map and plan labelling', 'Practise map and plan labelling.', 60],
  [30, 'Reading', 'Sentence and summary completion', 'Practise sentence and summary completion.', 60],
  [31, 'Writing Task 1', 'Table or bar chart comparisons', 'Describe a table or bar chart; focus on key comparisons.', 60],
  [32, 'Speaking', 'Parts 1 and 2 with recording', 'Practise Parts 1 and 2; record yourself and identify pauses.', 60],
  [33, 'Grammar', 'Articles, prepositions and nouns', 'Practise articles, prepositions and countable/uncountable nouns.', 60],
  [34, 'Listening', 'Full listening test', 'Complete a full 30-minute listening test and review the transcript.', 60],
  [35, 'Review', 'Weekly review', 'Redo incorrect listening questions without looking at the answers.', 60],

  [36, 'Reading', 'Matching information', 'Practise matching information and locating paragraph evidence.', 60],
  [37, 'Writing Task 2', 'Discussion essay', 'Write a discussion essay presenting both sides and your opinion.', 60],
  [38, 'Listening', 'Paraphrases and synonyms', 'Practise recognising paraphrases and synonyms.', 60],
  [39, 'Speaking', 'Part 2: person, place or object', 'Speak about a person, place or object; practise giving specific details.', 60],
  [40, 'Vocabulary', 'Environment and technology', 'Study environment and technology vocabulary; write example sentences.', 60],
  [41, 'Reading', 'Timed reading test', 'Complete a timed Academic Reading test or three timed passages.', 60],
  [42, 'Review', 'Weekly review: reading errors', 'Classify reading errors: vocabulary, misunderstanding or time pressure.', 60],

  [43, 'Writing Task 2', 'Problem-and-solution essay', 'Practise problem-and-solution essay planning and development.', 60],
  [44, 'Reading', 'Yes / No / Not Given', 'Practise Yes/No/Not Given questions.', 60],
  [45, 'Writing Task 1', 'Process or diagram', 'Describe a process or diagram using clear sequencing language.', 60],
  [46, 'Speaking', 'Part 3: causes and consequences', 'Practise comparing ideas and discussing causes and consequences.', 60],
  [47, 'Grammar', 'Tenses, relative clauses and variety', 'Review verb tenses, relative clauses and sentence variety.', 60],
  [48, 'Writing', 'Timed Task 1 and Task 2', 'Complete Task 1 in 20 minutes and Task 2 in 40 minutes.', 60],
  [49, 'Review', 'Weekly review: writing mistakes', 'Correct your writing and list five recurring mistakes.', 60],

  [50, 'Listening', 'Full timed listening and raw score', 'Complete a full timed practice and calculate your raw score.', 60],
  [51, 'Reading', 'Full Academic Reading practice', 'Complete a full 60-minute Academic Reading practice.', 75],
  [52, 'Writing Task 2', 'Timed essay and self-evaluation', 'Write an essay in 40 minutes and evaluate task response and coherence.', 60],
  [53, 'Speaking', 'Simulated Speaking test', 'Complete a simulated 11–14 minute Speaking test.', 60],
  [54, 'Vocabulary', 'Academic collocations and paraphrasing', 'Review academic collocations and practise paraphrasing.', 60],
  [55, 'Mixed practice', 'Weakest question types, timed', 'Repeat your weakest question types under timed conditions.', 60],
  [56, 'Review', 'Progress review', 'Compare your results with Week 4 and update your priorities.', 60],

  [57, 'Listening', 'Following questions and spelling', 'Practise following questions while listening and checking spelling.', 60],
  [58, 'Reading', 'Time allocation across passages', 'Practise allocating time across three passages.', 60],
  [59, 'Writing Task 1', 'Overview and accurate comparisons', 'Write a report with a clear overview and accurate comparisons.', 60],
  [60, 'Speaking', 'Extended answers', 'Practise giving extended answers with reasons and examples.', 60],
  [61, 'Grammar', 'Edit a previous essay', 'Edit a previous essay for grammar, punctuation and word choice.', 60],
  [62, 'Timed practice', 'Timed listening test', 'Complete one listening test and review every wrong answer.', 60],
  [63, 'Review', 'Weekly review', 'Review mistakes and repeat your weakest reading exercise.', 60],

  [64, 'Reading', 'Full timed reading test', 'Complete a full timed Academic Reading test.', 75],
  [65, 'Writing', 'Both tasks in 60 minutes', 'Complete both Writing tasks within the 60-minute limit.', 60],
  [66, 'Listening', 'Full listening test', 'Complete a full Listening test and review difficult sections.', 60],
  [67, 'Speaking', 'Mock interview', 'Complete a mock interview and listen to your recording.', 60],
  [68, 'Mixed practice', 'Weakness repair', 'Spend the hour on your weakest skill and its three most common errors.', 60],
  [69, 'Mock test', 'Listening and reading mock', 'Complete a full Listening and Reading practice under test conditions.', 90],
  [70, 'Review', 'Weekly review: strategy', 'Analyse scores and revise the strategy for each test section.', 60],

  [71, 'Mock test', 'Full mock: listening and reading', 'Complete Listening and Reading under official timing.', 90],
  [72, 'Mock test', 'Writing mock', 'Complete Task 1 and Task 2 in 60 minutes.', 60],
  [73, 'Mock test', 'Speaking mock', 'Practise all three parts and assess fluency, vocabulary and grammar.', 60],
  [74, 'Review', 'Analyse mock results', 'Analyse your mock results and prioritise errors with the biggest impact.', 60],
  [75, 'Listening', 'Listening repair', 'Practise the two weakest listening question types.', 60],
  [76, 'Reading', 'Reading repair', 'Practise your weakest reading question types under time limits.', 60],
  [77, 'Review', 'Progress review', 'Estimate progress and check whether your required component scores are on track.', 60],

  [78, 'Writing Task 1', 'Task 1 report review', 'Write one Task 1 report and review the overview and comparisons.', 60],
  [79, 'Writing Task 2', 'Timed essay and edit', 'Write one Task 2 essay in 40 minutes and edit it.', 60],
  [80, 'Listening', 'Full timed listening test', 'Complete a full timed test and review your errors.', 60],
  [81, 'Reading', 'Full timed reading test', 'Complete a full timed test and review answer evidence.', 75],
  [82, 'Speaking', 'Mock interview', 'Complete a mock interview and practise natural, developed answers.', 60],
  [83, 'Mock test', 'Full exam simulation', 'Simulate the complete exam, taking breaks only as appropriate.', 165],
  [84, 'Review', 'Mock review', 'Review scores, recurring errors and your test-day routine.', 60],

  [85, 'Mixed practice', 'Weakest skill', 'Spend 60 minutes on the one skill most below target.', 60],
  [86, 'Review', 'Writing review', 'Review essay structure, Task 1 overviews and your personal error log.', 60],
  [87, 'Mixed practice', 'Short listening and reading drills', 'Complete short timed exercises and review the answers.', 60],
  [88, 'Speaking', 'Speaking practice', 'Practise common topics, pronunciation and extending answers naturally.', 60],
  [89, 'Mock test', 'Light mock', 'Do a short mixed practice and review only the most important mistakes.', 60],
  [90, 'Rest', 'Rest and readiness', 'Review exam logistics, identification requirements and booking details; rest well.', 30],
];

export const PLAN = RAW.map(([day, skill, title, instructions, minutes]) => ({
  day, week: weekOf(day), skill, title, instructions, minutes,
}));

export function weekOf(day) {
  return Math.ceil(day / 7);
}

export const WEEKS = [...new Set(PLAN.map((p) => p.week))];

export function weekLabel(week) {
  return week === 13 ? 'Final 6 days' : `Week ${week}`;
}

export function daysInWeek(week) {
  return PLAN.filter((p) => p.week === week);
}
