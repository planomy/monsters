import type { PollQuestion } from '../types'
import { POLL_OPTION_COUNT } from './pollDefaults'

export interface FunQuestion2Prompt {
  question: string
  options: [string, string, string, string]
}

export const FUN_QUESTION_2_PROMPTS: FunQuestion2Prompt[] = [
  {
    question: "What's your favourite dinosaur?",
    options: ['T-Rex', 'Triceratops', 'Stegosaurus', 'Velociraptor'],
  },
  {
    question: "What's your favourite ice cream flavour?",
    options: ['Chocolate', 'Vanilla', 'Strawberry', 'Mint choc chip'],
  },
  {
    question: "What's your favourite movie genre?",
    options: ['Action', 'Comedy', 'Animation', 'Adventure'],
  },
  {
    question: 'What colour do you like to wear most?',
    options: ['Blue', 'Red', 'Green', 'Purple'],
  },
  {
    question: 'What type of footwear do you prefer?',
    options: ['Sneakers', 'Boots', 'Sandals', 'Slippers'],
  },
  {
    question: 'Best food to eat from a bowl?',
    options: ['Cereal', 'Soup', 'Pasta', 'Ice cream'],
  },
  {
    question: 'Best toast topping?',
    options: ['Butter', 'Jam', 'Honey', 'Vegemite'],
  },
  {
    question: 'Dream holiday destination?',
    options: ['Beach', 'Mountains', 'Big city', 'Theme park'],
  },
  {
    question: 'Favourite season?',
    options: ['Spring', 'Summer', 'Autumn', 'Winter'],
  },
  {
    question: 'Favourite day of the week?',
    options: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
  },
  {
    question: 'Favourite school subject?',
    options: ['Maths', 'Art', 'PE', 'Science'],
  },
  {
    question: 'Best pet (real or imaginary)?',
    options: ['Dog', 'Cat', 'Dragon', 'Unicorn'],
  },
  {
    question: 'Preferred pizza topping?',
    options: ['Cheese', 'Pepperoni', 'Pineapple', 'Veggie'],
  },
  {
    question: 'Best way to eat a potato?',
    options: ['Chips', 'Mashed', 'Baked', 'Hash browns'],
  },
  {
    question: 'If you had a theme song, it would be…',
    options: ['Epic', 'Silly', 'Chill', 'Super fast'],
  },
  {
    question: 'Which would you rather ride?',
    options: ['Giant snail', 'Rocket skateboard', 'Cloud bicycle', 'Tame tornado'],
  },
  {
    question: 'If your backpack could talk, it would say…',
    options: ['"Too heavy!"', '"Snack time!"', '"Where\'s my lid?"', '"I\'m a portal"'],
  },
  {
    question: 'Best superpower for doing homework?',
    options: ['Freeze time', 'Clone yourself', 'Talk to pencils', 'Teleport home'],
  },
  {
    question: 'Which animal would win at dodgeball?',
    options: ['Giraffe', 'Penguin', 'Octopus', 'Sloth'],
  },
  {
    question: 'If you were a potato, how would you travel?',
    options: ['Roll everywhere', 'Hot-air fryer', 'Mash surf', 'Baked barge'],
  },
  {
    question: 'Most useful ridiculous invention?',
    options: ['Sock finder robot', 'Homework-eating dog', 'Flying scooter', 'Snack hat'],
  },
  {
    question: 'What would your hat say?',
    options: ['"Nap expert"', '"I brought snacks"', '"Ask me about tacos"', '"Certified silly"'],
  },
  {
    question: 'Best name for a pet rock?',
    options: ['Pebbleton', 'Sir Crunch', 'Rocky McRockface', 'Jeff'],
  },
  {
    question: 'If your lunch could talk, it would say…',
    options: ['"Eat me!"', '"I\'m suspicious"', '"Teamwork!"', '"Surprise inside"'],
  },
  {
    question: 'Preferred sock situation?',
    options: ['Matching pair', 'Solo rebel', 'Inside out', 'On my hands'],
  },
  {
    question: 'Would you rather fight one horse-sized duck or…',
    options: ['100 duck-sized horses', 'One polite dragon', 'A grumpy sandwich', 'A sneezing cloud'],
  },
  {
    question: 'Best smell in the world?',
    options: ['Fresh bread', 'Rain on pavement', 'Popcorn', 'Marker pens'],
  },
  {
    question: 'If you ruled the world for one day, first law is…',
    options: ['Extra recess', 'Pets at school', 'Dessert for lunch', 'Naps for everyone'],
  },
]

export function pickRandomQuestion2Prompt(excludeQuestion?: string): FunQuestion2Prompt {
  let pool = FUN_QUESTION_2_PROMPTS
  if (excludeQuestion) {
    const filtered = pool.filter((prompt) => prompt.question !== excludeQuestion)
    if (filtered.length > 0) pool = filtered
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

export function applyQuestion2Prompt(
  question: PollQuestion,
  prompt: FunQuestion2Prompt,
  clearResponses = true,
): PollQuestion {
  const options = Array.from({ length: POLL_OPTION_COUNT }, (_, index) => ({
    id: question.options[index]?.id ?? `opt-2-${index + 1}`,
    label: prompt.options[index] ?? '',
  }))

  return {
    ...question,
    question: prompt.question,
    options,
    responses: clearResponses ? {} : question.responses,
  }
}

export function createDefaultQuestion2(): Pick<PollQuestion, 'question' | 'options'> {
  const prompt = pickRandomQuestion2Prompt()
  return {
    question: prompt.question,
    options: prompt.options.map((label, index) => ({
      id: `opt-2-${index + 1}`,
      label,
    })),
  }
}
