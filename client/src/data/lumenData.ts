import linesData from './lines.json'

export type LumenItemType = 'line' | 'fact' | 'trivia'

export interface LumenItem {
  id: string
  type: LumenItemType
  category: string
  content: string
  sourceOrAuthor?: string
  answer?: string // For trivia
}

export const lumenWisdomLines: LumenItem[] = (linesData as string[]).map((text, idx) => ({
  id: `line-${idx + 1}`,
  type: 'line',
  category: 'Philosophy',
  content: text,
}))

export const lumenFunFacts: LumenItem[] = [
  {
    id: 'fact-1',
    type: 'fact',
    category: 'Trivia',
    content: 'A day on Venus is longer than a year on Venus. It takes Venus 243 Earth days to rotate once on its axis, but only 225 Earth days to orbit the Sun.',
  },
  {
    id: 'fact-2',
    type: 'fact',
    category: 'History quirks',
    content: 'Oxford University is older than the Aztec Empire. Teaching at Oxford existed in some form as early as 1096, whereas the Aztec Empire began around 1428.',
  },
  {
    id: 'fact-3',
    type: 'fact',
    category: 'Brain benders',
    content: 'If you shuffle a deck of 52 cards properly, it is statistically almost certain that the exact order of cards you hold has never existed before in the history of the universe.',
  },
  {
    id: 'fact-4',
    type: 'fact',
    category: 'Trivia',
    content: 'Water can boil and freeze at the exact same time under specific temperature and pressure conditions known as the "triple point".',
  },
  {
    id: 'fact-5',
    type: 'fact',
    category: 'Untranslatable Words',
    content: 'Kintsugi (Japanese): The art of repairing broken pottery with gold or silver lacquer, treating breakage and repair as part of the history of an object, rather than something to disguise.',
  },
  {
    id: 'fact-6',
    type: 'fact',
    category: 'Paradoxes',
    content: 'The Ship of Theseus: If you replace every single wooden part of a ship over time, is it still the same ship?',
  },
  {
    id: 'fact-7',
    type: 'fact',
    category: 'Untranslatable Words',
    content: 'Sonder (English neologism): The realization that each random passerby has a life as vivid and complex as your own.',
  },
  {
    id: 'fact-8',
    type: 'fact',
    category: 'History quirks',
    content: 'The Great Emu War of 1932: Australia deployed its military with machine guns against a population of emus that were ravaging crops. The emus ultimately won.',
  },
  {
    id: 'fact-9',
    type: 'fact',
    category: 'Trivia',
    content: 'Bananas share about 50% of their DNA with humans, illustrating the universal biological code shared by all living organisms on Earth.',
  },
]

export const lumenTriviaCards: LumenItem[] = [
  {
    id: 'trivia-1',
    type: 'trivia',
    category: 'Question',
    content: 'What was the original name of the Python programming language named after?',
    answer: 'It was named after the British comedy troupe Monty Python (from "Monty Python\'s Flying Circus"), not the snake!',
  },
  {
    id: 'trivia-2',
    type: 'trivia',
    category: 'Question',
    content: 'Which planet in our solar system could float in water if there were a bathtub large enough?',
    answer: 'Saturn! Its average density is roughly 0.687 grams per cubic centimeter, making it less dense than water (1.0 g/cm³).',
  },
  {
    id: 'trivia-3',
    type: 'trivia',
    category: 'Question',
    content: 'What famous sequence of numbers starts: 0, 1, 1, 2, 3, 5, 8, 13, 21...?',
    answer: 'The Fibonacci Sequence, where each number is the sum of the two preceding ones, closely tied to the Golden Ratio in nature.',
  },
  {
    id: 'trivia-4',
    type: 'trivia',
    category: 'Question',
    content: 'What is the only continent on Earth that has no native species of ants?',
    answer: 'Antarctica!',
  },
]

export const allLumenItems: LumenItem[] = [
  ...lumenWisdomLines,
  ...lumenFunFacts,
  ...lumenTriviaCards,
]
