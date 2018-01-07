import { PlayerProxy } from '../player'

export type UNOMode = '胜者为王' | '赢者通吃' | '大隐于市'

export interface UNOStatusOption {
  mode: UNOMode
  maxRounds?: number
  maxScore?: number
}

const DEFAULT_MAX_ROUNDS = 3
const DEFAULT_MAX_SCORE = 300

export class UNOStatus {
  public mode: UNOMode

  public readonly maxRounds: number = DEFAULT_MAX_ROUNDS

  public readonly maxScore: number = DEFAULT_MAX_SCORE

  public rounds: number = 0

  public scores: { [playerUid: string]: number } = {}

  constructor(option: UNOStatusOption) {
    this.mode = option.mode
    this.maxRounds = option.maxRounds || DEFAULT_MAX_ROUNDS
    this.maxScore = option.maxScore || DEFAULT_MAX_SCORE
  }

  get hasFinished(): boolean {
    if (this.mode === '胜者为王') {
      return this.rounds === 1
    }

    if (this.mode === '赢者通吃') {
      return Object.keys(this.scores).some(player => this.scores[player] >= this.maxScore)
    }

    if (this.mode === '大隐于市') {
      return this.rounds >= this.maxRounds
    }

    return true
  }

  init(proxies: PlayerProxy[]) {
    proxies.forEach(proxy => this.scores[proxy.player.uid] = 0)
  }

  settleup(winner: PlayerProxy, proxies: PlayerProxy[]) {
    if (this.mode === '赢者通吃') {
      this.scores[winner.player.uid] +=
        proxies.reduce((sum, player) => sum + player.score, 0)
    }

    if (this.mode === '大隐于市') {
      proxies.forEach(proxy => {
        this.scores[proxy.player.uid] += proxy.score
      })
    }

    this.rounds++
  }
}
