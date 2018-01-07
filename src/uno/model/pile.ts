/**
 * UNO预生成牌堆
 */

import { Card, CardSymbol, CardColor } from './card'

const colors: CardColor[] = [
  CardColor.Blue,
  CardColor.Green,
  CardColor.Red,
  CardColor.Yellow
]

const symbols: CardSymbol[] = [
  CardSymbol.c0,
  CardSymbol.c1,
  CardSymbol.c2,
  CardSymbol.c3,
  CardSymbol.c4,
  CardSymbol.c5,
  CardSymbol.c6,
  CardSymbol.c7,
  CardSymbol.c8,
  CardSymbol.c9,
  CardSymbol.Skip,
  CardSymbol.Draw2,
  CardSymbol.Reverse
]

const wilds: CardSymbol[] = [
  CardSymbol.Wild,
  CardSymbol.Draw4
]

const pile = []
symbols.forEach(s => {
  colors.forEach(c => {
    if (s !== CardSymbol.c0) pile.push(new Card(c, s))
    pile.push(new Card(c, s))
  })
})
wilds.forEach(w => {
  colors.forEach(c => {
    pile.push(new Card(CardColor.None, w))
  })
})

export default pile