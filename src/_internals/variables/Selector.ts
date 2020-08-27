import type { ENTITY_TYPES, MinecraftCondition, TextComponentObject } from '@arguments'
import type { CommandsRoot } from '@commands'
import type { LiteralUnion } from '../generalTypes'

export type Range = number | [min: number, max: number] | [min: number, max: null] | [min: null, max: number]

type ScoreArgument = Record<string, Range>

type AdvancementsArgument = Record<string, boolean | Record<string, boolean>>

/**
 * If MustBeSingle is false, then anything is allowed.
 * If it is true, then you must provide limit=1 or limit=0.
 */
export type SelectorProperties<MustBeSingle extends boolean, MustBePlayer extends boolean> = {
  /**
   * Filter target selection based on their Euclidean distances from some point,
   * searching for the target's feet (a point at the bottom of the center of their hitbox).
   *
   * If the positional arguments `x`, `y` and `z` are left undefined,
   * radius is calculated relative to the position of the command's execution.
   *
   * Only unsigned values are allowed.
   */
  distance?: Range,

  /** Filter target selection based on their scores in the specified objectives. */
  score?: ScoreArgument

  /**
   * Filter target selection to those who are on a given team.
   *
   * Allowed values are:
   * - `teamName`, to filter those who are in the given team.
   * - `!teamName`, to filter those who are not in the given team.
   * - `false`, to filter those who are teamless (in no team).
   * - `true`, ot filter those who have at least one team.
   */
  team?: string | boolean

  /**
   * Filter target selection to those that have the given tag(s).
   *
   * Multiple values are allowed, when passed as an array.
   *
   * @example
   *
   * Selector(`@e`, { tag: 'alive' }) => `@e[tag=alive]`
   *
   * Selector(`@e`, { tag: ['alive', 'winner'] }) => `@e[tag=alive, tag=winner]`
   *
   */
  tag?: string | string[]

  /** Filter target selection to all those with a given name. This cannot be a JSON text compound. */
  name?: string

  /**
   * Specify the targets selection priority.
   *
   * - `nearest`: Sort by increasing distance. (Default for `@p`)
   * - `furthest`: Sort by decreasing distance.
   * - `random`: Sort randomly. (Default for `@r`)
   * - `arbitrary`: Do not sort. (Default for `@e`, `@a`)
   */
  sort?: LiteralUnion<'nearest' | 'furthest' | 'random' | 'abitrary'>

  /** Filter target selection based on their experience levels. This naturally filters out all non-player targets. */
  level?: Range

  /** Filter target selection to those who are in the specified game mode. */
  gamemode?: LiteralUnion<'adventure' | 'creative' | 'spectator' | 'survival' | '!adventure' | '!creative' | '!spectator' | '!survival'>

  // Selecting targets by vertical rotation

  /**
   * Filter target selection based on their vertical rotation, measured in degrees.
   *
   * Values range from `-90` (straight up) to `0` (at the horizon) to `+90` (straight down).
   */
  x_rotation?: Range

  /**
   * Filter target selection based on their rotation in the horizontal XZ-plane,
   * measured clockwise in degrees from due south (or the positive Z direction).
   *
   * Values vary:
   * - from `-180` (facing due north, the -Z direction)
   * - to `-90` (facing due east, the +X direction)
   * - to `0` (facing due south, the +Z direction)
   * - to `+90` (facing due west, the -X direction)
   * - to `+180` (facing due north again).
   */
  y_rotation?: Range

  /**
   * Filter target selection to those of a specific entity type.
   *
   * Multiple values are allowed, when passed as an array.
   *
   * @example
   *
   * Selector(`@e`, { type: 'minecraft:cow' }) => `@e[type=!minecraft:cow]`
   *
   * Selector(`@e`, { type: ['!minecraft:cow', '!minecraft:skeleton'] }) => `@e[type=!minecraft:cow, type=!minecraft:skeleton]`
   */
  type?: MustBePlayer extends true ? 'minecraft:player' | 'minecraft:player'[] : (LiteralUnion<ENTITY_TYPES> | LiteralUnion<ENTITY_TYPES>[])

  /** Select all targets that match the specified advancement and value. */
  advancements?: AdvancementsArgument

  /** Select all targets that match the specified predicate. */
  predicate?: string | string[]
} & ({} | {
  /** Define a position on the X-axis in the world the selector starts at,
   * for use with the `distance` argument or the volume arguments, `dx`, `dy` and `dz`. */
  x: number

  /** Define a position on the Y-axis in the world the selector starts at,
   * for use with the `distance` argument or the volume arguments, `dx`, `dy` and `dz`. */
  y: number

  /** Define a position on the Z-axis in the world the selector starts at,
   * for use with the `distance` argument or the volume arguments, `dx`, `dy` and `dz`. */
  z: number
}) & ({} | {
  /** Filter target selection based on their x-difference, from some point,
   * as measured from the closest corner of the entities' hitboxes */
  dx: number

  /** Filter target selection based on their y-difference, from some point,
   * as measured from the closest corner of the entities' hitboxes */
  dy: number

  /** Filter target selection based on their z-difference, from some point,
   * as measured from the closest corner of the entities' hitboxes */
  dz: number
}) & (
    MustBeSingle extends true ? { limit: 0 | 1 } : { limit?: number }
  )

function parseScore(scores: ScoreArgument): string {
  return `{${Object.entries(scores).map(([scoreName, value]) => {
    if (Array.isArray(value)) {
      return [scoreName, `${value[0] ?? ''}..${value[1] ?? ''}`].join('=')
    }
    return [scoreName, value].join('=')
  }).join(', ')}}`
}

function parseAdvancements(advancements: AdvancementsArgument): string {
  return `{${Object.entries(advancements).map(([advancementName, value]) => {
    if (typeof value === 'boolean') {
      return [advancementName, value].join('=')
    }

    return [advancementName, parseAdvancements(value)].join('=')
  }).join(', ')}}`
}

export class SelectorClass<IsSingle extends boolean, IsPlayer extends boolean> {
  protected commandsRoot: CommandsRoot

  protected target: string

  protected arguments: SelectorProperties<IsSingle, IsPlayer>

  constructor(
    commandsRoot: CommandsRoot,
    target: LiteralUnion<'@s' | '@p' | '@a' | '@e' | '@r'>,
    selectorArguments?: SelectorProperties<IsSingle, IsPlayer>,
  ) {
    this.commandsRoot = commandsRoot
    this.target = target
    this.arguments = selectorArguments ?? {} as SelectorProperties<IsSingle, IsPlayer>
  }

  // Custom actions //

  /**
   * List all scores of this entity.
   */
  listScores = () => {
    this.commandsRoot.scoreboard.players.list(this.toString())
  }

  /**
   * Returns a condition, that Minecraft will evaluate to `true` if this selector finds at least one entity.
   */
  exists = (): MinecraftCondition => ({
    value: ['entity', this],
  })

  toString() {
    if (!Object.keys(this.arguments).length) {
      return this.target
    }

    const result: (readonly [string, string])[] = []

    if (this.arguments) {
      const args = { ...this.arguments }

      const modifiers = {
        // Parse scores
        score: (score: ScoreArgument) => result.push(['score', parseScore(score)]),

        // Parse advancements
        advancements: (advancements: AdvancementsArgument) => result.push(
          ['advancements', parseAdvancements(advancements)],
        ),

        // Parse potentially multiple tags
        tag: (tag: string | string[]) => {
          const tags = Array.isArray(tag) ? tag : [tag]
          result.push(...tags.map((tag_) => ['tag', tag_] as const))
        },

        // Parse potentially multiple predicates
        predicate: (predicate: string | string[]) => {
          const predicates = Array.isArray(predicate) ? predicate : [predicate]
          result.push(...predicates.map((pred) => ['predicate', pred] as const))
        },

        // Handle boolean values for teams
        team: (team: string | boolean) => {
          let teamRepr: string

          if (team === true) {
            teamRepr = '!'
          } else if (team === false) {
            teamRepr = ''
          } else {
            teamRepr = team
          }
          result.push(['team', teamRepr])
        },
      } as const

      for (const [baseName, modifier] of Object.entries(modifiers)) {
        const name = baseName as keyof typeof args
        const value = args[name]

        if (value !== undefined) {
          modifier(value as any)
          delete args[name]
        }
      }

      Object.entries(args).forEach(([key, value]) => {
        if (value !== undefined) {
          result.push([key, value.toString()])
        }
      })
    }

    return `${this.target}[${result.map(([key, value]) => `${key}=${value}`).join(', ')}]`
  }

  protected _toChatComponent(): TextComponentObject {
    return {
      selector: this.toString(),
    }
  }

  protected toJSON() {
    return this.toString()
  }
}

// Possible selector properties
export type AnySelectorProperties = SelectorProperties<false, false>
export type SingleSelectorProperties = SelectorProperties<true, false>
export type SinglePlayerSelectorProperties = SelectorProperties<true, true>

export function Selector(target: '@s' | '@p' | '@r', selectorArguments?: Omit<AnySelectorProperties, 'limit' | 'type'>): SelectorClass<true, true>
export function Selector(target: '@a', selectorArguments: Omit<SingleSelectorProperties, 'type'>): SelectorClass<true, true>
export function Selector(target: '@a', selectorArguments?: Omit<AnySelectorProperties, 'type'>): SelectorClass<false, true>
export function Selector(target: '@e', selectorArguments: SinglePlayerSelectorProperties): SelectorClass<true, true>
export function Selector(target: '@e', selectorArguments: SingleSelectorProperties): SelectorClass<true, false>
export function Selector(target: string, selectorArguments?: AnySelectorProperties): SelectorClass<false, false>

export function Selector<T extends boolean, U extends boolean>(this: CommandsRoot, target: LiteralUnion<'@s' | '@p' | '@a' | '@e' | '@r'>, selectorArguments?: SelectorProperties<T, U>): SelectorClass<T, U> {
  return new SelectorClass(this, target, selectorArguments)
}