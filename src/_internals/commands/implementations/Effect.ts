import { LiteralUnion } from '@/generalTypes'
import { MOB_EFFECTS, SelectorArgument } from '@arguments'
import { Command } from '@commands/Command'
import { command } from '@commands/decorators'

export class Effect extends Command {
  @command(['effect', 'give'], { isRoot: true })
  give = (
    targets: SelectorArgument<false>,
    effect: LiteralUnion<MOB_EFFECTS>,
    seconds: number,
    amplifier: number,
    hideParticles: boolean,
  ) => {}

  @command(['effect', 'clear'], { isRoot: true })
  clear = (targets?: SelectorArgument<false>, effect?: LiteralUnion<MOB_EFFECTS>) => {}
}
