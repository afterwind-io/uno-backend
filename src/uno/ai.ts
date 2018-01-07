import Dice from './util/dice'
import { Card, CardColor, CardSymbol, VirtualCardSymbol } from './model/card'
import { Deck } from './model/deck'
import { UNOAction } from './uno';

export default class AIchan {
  static think(
    action: UNOAction,
    color: CardColor,
    symbol: CardSymbol,
    d2: boolean,
    d4: boolean,
    cards: Card[],
    penalties: Card[]
  ): Card[] {
    switch (action) {
      case UNOAction.ReturnPenalty:
        // TODO
        return
      case UNOAction.TakePenalty:
        // TODO
        return [Card.PenaltyOver]
      case UNOAction.Skipped:
        // TODO
        return [Card.Skip]
      case UNOAction.CallColor:
        return [Card.PickColor(strategyCallColor(cards))]
      case UNOAction.Challenge:
        // TODO
        return [Card.Pass]
      default:
        if (cards.length === 1 && cards[0].isActionCard) {
          return [Card.Pass]
        }

        const legalCards = cards.filter(card => card.isLegal(color, symbol, d2, d4))

        if (legalCards.length > 0) {
          // TODO
          return [legalCards[Math.floor(Math.random() * legalCards.length)]]
        } else {
          return [Card.Pass]
        }
    }
  }
}



function move(state, cards, penalties) {
  switch (state.action) {
    case 'penaltyBack':
      let penalty = cards.filter(c => c.legal)
      return penalty
    case 'penalty':
      return strategyReturnPenalty(state, cards, penalties)
    case 'skip':
      let skips = cards.filter(c => c.symbol === 'S')
      let skip
      if (skips.length > 0) {
        skip = applyStrategy(skips, state)
      } else {
        skip = [Card.Skip]
      }
      return skip
    case 'callColor':
      return [Card.PickColor(strategyCallColor(cards))]
    case 'challenge':
      if (checkD4Legal(cards, state.color)) {
        return [Card.Skip]
      } else {
        return [Card.Pass]
      }
    default:
      if (cards.length === 1 && cards[0].isActionCard()) {
        return [Card.Pass]
      }

      cards.forEach(c => { c.legal = c.isLegal(state) })
      let legalCards = cards.filter(c => c.legal)

      let deals
      if (legalCards.length > 0) {
        deals = applyStrategy(legalCards, state)
      } else {
        deals = [Card.Pass]
      }

      return deals
  }
}

function applyStrategy(legalCards, state) {
  // let d4 = legalCards.filter(c => c.symbol === 'D4')[0]

  // if (state.d4) {
  //   // TODO
  //   // 挑战率过低
  //   let r = Dice.roll(2)
  //   let result = d4 ? r ? [d4] : [Card.Challenge]
  //     : r ? [Card.Pass] : [Card.Challenge]
  //   return result
  // } else {
  //   if (d4) legalCards.splice(legalCards.indexOf(d4), 1)
  //   if (legalCards.length === 0) return [d4]

  //   let r = Dice.roll(2)

  //   let normal
  //   let card = legalCards.splice(0, 1)
  //   let card2 = legalCards.length > 1
  //     ? Deck.findDuplicates(legalCards, card[0])
  //     : []

  //   if (card2.length !== 0) {
  //     normal = card.concat(card2)
  //   } else {
  //     normal = card
  //   }

  //   let result = d4 ? r ? [d4] : normal
  //     : normal
  //   return result
  // }
}

function strategyReturnPenalty(state, cards, penalties) {
  if (!state.d4 && !state.d2) {
    let penalty = penalties[0]

    if (!penalty.isActionCard() && penalty.isLegal(state)) {
      if (Dice.check(2)) {
        cards.forEach(c => { c.legal = false })
        penalty.legal = true
        return [Card.PenaltyBack]
      } else {
        return [Card.PenaltyOver]
      }
    }
  }

  return [Card.PenaltyOver]
}

function strategyCallColor(cards: Card[]) {
  // TODO:

  // Strategy 1
  // let max = { name: '', value: 0 }
  // let colors = { 'red': 0, 'green': 0, 'blue': 0, 'yellow': 0 }
  // cards.forEach(c => {
  //   colors[c.color] += c.score
  // })
  // Object.keys(colors).forEach(c => {
  //   if (colors[c] > max.value) max.name = c
  // })

  // return CardColor[max.name]

  // Strategy 2
  let colors = [
    CardColor.Red,
    CardColor.Green,
    CardColor.Blue,
    CardColor.Yellow
  ]
  return colors[Math.floor(Math.random() * 4)]
}

function checkD4Legal(cards, color) {
  return cards.map(c => c.color).indexOf(color) === -1
}
