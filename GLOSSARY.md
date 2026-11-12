# Glossary

The domain terms of planning-poker, as the code and UI use them. Where the two disagree, the entry says which word to prefer. Open naming questions are at the bottom.

## Room

**Room**: a shared session where a team estimates together. It has an id, a set of participants, a deck and a phase. State lives in memory on the room server and is gone once everyone leaves. Anyone in a room can reveal, start a new round or change the deck; there is no host role.

**Room id**: the short string in the room URL (`/room/<id>`). The home page generates one (8 characters); joining accepts any non-empty id, and a room exists as soon as someone connects to it.

**Room full**: the state of a room at its connection limit (50). New connections are refused and the client stops retrying.

## People

**Participant**: anyone in a room, whether voting or not. The room's state holds one participant per connection. _Avoid_: user, member.

**Player**: a participant who is not a spectator. Only players vote, and only players count towards "x of y voted" and auto-reveal.

**Spectator**: a participant who watches without voting. A participant can switch between player and spectator at any time; becoming a spectator discards their vote. The UI says _observing_; the code says `isSpectator`. _Avoid_: observer, viewer.

**Connection**: one open WebSocket from one browser tab. A participant is identified by their connection id, so a second tab is a second participant. A dropped connection removes the participant; a reconnect of the same socket rejoins under the same id with the latest name and spectator setting.

## Cards and voting

**Deck**: the set of card values available in a room. There are two: _fibonacci_ (1, 3, 5, 8, 13, 21, ?) and _t-shirt_ (XS, S, M, L, XL, XXL, ?). Changing the deck discards all votes and returns the room to the voting phase.

**Card**: one value in a deck. Card order within the deck defines "low" and "high". The `?` card means "can't estimate": it is a real vote, but is ignored for range and outliers.

**Vote**: the card a player has chosen. It is stored as a string even for numeric cards, and can be changed until the reveal. A player with no vote is shown as _thinking_ while voting and _no vote_ once revealed.

**Phase**: where a room is in its cycle. Either **voting** (votes are hidden and can be changed) or **revealed** (votes are visible and locked).

**Reveal**: the move from voting to revealed, so everyone sees every vote. The UI button says _flip cards_; the message is `reveal`. Anyone in the room can do it.

**Auto-reveal**: a reveal the room triggers itself when there is at least one player and every player has voted. It can also fire when a non-voting player leaves or becomes a spectator.

**Round**: one cycle of voting, then revealing, for a single item being estimated. There is no round object: a round starts when the room is created, when someone starts a **new round** (clears all votes, back to voting), or when the deck changes.

## Results

**Distribution**: the count of players per card value among revealed votes, shown as bars.

**Most common**: the card with the most votes. If two or more cards tie for the most, the result is **tied** and no card is named.

**Range**: the lowest to highest card among revealed votes, ignoring `?` and any value not in the deck.

**Outlier**: a numeric vote that equals the highest or lowest numeric vote, flagged _high_ or _low_. A vote is only an outlier when there are at least two numeric votes and they are not all the same. Non-numeric cards (t-shirt sizes, `?`) are never outliers.

## Open questions

1. **Spectator vs observing.** Keep both (code says spectator, UI says observing), or settle on one? This glossary prefers _spectator_ for code and docs and leaves the UI copy alone.
2. **Round.** Should it become a concept in the code (for example a round counter), or stay implied by the phase cycle?
3. **PartyKit names.** The `party/` folder, the `NEXT_PUBLIC_PARTYKIT_HOST` variable and the `/parties/main/` URL path still use PartyKit's naming although the room server now runs on PartyServer and Cloudflare (ADR 0001). Rename, or leave as is?
4. **Outliers in t-shirt decks.** Outliers are numeric-only today, so a t-shirt round never shows any. Is that intended?
