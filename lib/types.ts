export type Deck = 'fibonacci' | 'tshirt'

export const DECKS: Record<Deck, (string | number)[]> = {
  fibonacci: [1, 3, 5, 8, 13, 21, '?'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'],
}

export type Participant = {
  id: string
  name: string
  isSpectator: boolean
  vote: string | null
}

export type Phase = 'voting' | 'revealed'

export type RoomState = {
  participants: Record<string, Participant>
  phase: Phase
  deck: Deck
}

// Client → Server messages
export type ClientMessage =
  | { type: 'join'; name: string; isSpectator: boolean; deck: Deck }
  | { type: 'vote'; value: string }
  | { type: 'rename'; name: string }
  | { type: 'setSpectator'; isSpectator: boolean }
  | { type: 'reveal' }
  | { type: 'newRound' }
  | { type: 'changeDeck'; deck: Deck }

// Server → Client messages
export type ServerMessage = { type: 'state' } & RoomState
