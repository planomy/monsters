import type { MorningPollState, PollQuestion } from '../types'

function createQuestion(
  id: string,
  question: string,
  options: { id: string; label: string }[],
): PollQuestion {
  return { id, question, options, responses: {} }
}

export function createDefaultPoll(): MorningPollState {
  return {
    questions: [
      createQuestion('q-1', 'How are you feeling today?', [
        { id: 'opt-1-1', label: 'Great' },
        { id: 'opt-1-2', label: 'Good' },
        { id: 'opt-1-3', label: 'Okay' },
        { id: 'opt-1-4', label: 'Tired' },
      ]),
      createQuestion('q-2', 'Did you eat breakfast?', [
        { id: 'opt-2-1', label: 'Yes' },
        { id: 'opt-2-2', label: 'No' },
        { id: 'opt-2-3', label: 'Not yet' },
      ]),
    ],
    activeQuestionIndex: 0,
    chartType: 'bar',
  }
}
