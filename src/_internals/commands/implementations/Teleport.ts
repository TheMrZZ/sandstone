import { Coordinates, coordinatesParser, Rotation, rotationParser, SelectorArgument } from '@arguments'
import { VectorClass } from '@variables/Coordinates'
import { Command } from '../Command'
import { command } from '../decorators'

export class TeleportFacing extends Command {
  /**
   * Specifies the coordinates to make the target(s) facing to.
   * May use tilde and caret notation to specify a position relative to the position where the command is executed.
   */
  @command('facing', { parsers: { '0': coordinatesParser } })
  facing = (location: Coordinates) => { }

  /**
   * Specifies the entity to make the target(s) facing to.
   *
   * @param entity Must be a player name, a target selector, or a UUID‌.
   *             Permits entity other than players.
   *
   * @param anchor Specifies whether the entity'eyes or feet to make the target(s) facing to.
   *             Must be one of eyes and feet. If not specified, defaults to eyes.
   */
  @command(['facing', 'entity'])
  facingEntity = (entity: SelectorArgument<true>, anchor?: 'eyes' | 'feet') => { }
}

export class Teleport extends Command {
  @command('teleport', {
    hasSubcommands: true,
    isRoot: true,
    parsers: {
      '0': coordinatesParser,
      '1': coordinatesParser,
      '2': rotationParser,
    },
  })
  teleport: (
    (
      /**
       * Teleports the executer to a given entity.
       *
       * @param destinationEntity
       *  Specifies the entity to teleport the executer to. Must be a player name, a target selector, or a UUID‌.
       *  Permits entity other than players.
       */
      (destinationEntity: SelectorArgument<true>) => void
    ) & (
      /**
       * Teleports the executer to a given location.
       *
       * @param location
       *  Specifies the coordinates to teleport the executer to.
       *  May use tilde and caret notation to specify a position relative to the position where the command is executed.
       */
      (location: Coordinates) => void
    ) & (
      /**
       * Teleports entities (players, mobs, etc.) to the given entity.
       *
       * @param targets
       *  Specifies the entity(s) to be teleported. Must be a player name, a target selector, or a UUID‌.
       *  Permits entities other than players.
       *
       * @param destinationEntity
       *  Specifies the entity to teleport the executer to. Must be a player name, a target selector, or a UUID‌.
       *  Permits entity other than players.
       */
      (targets: SelectorArgument<false>, destinationEntity: string) => void
    ) & (
      /**
       * Teleports entities (players, mobs, etc.) to the given location.
       *
       * @param targets
       *  Specifies the entity(s) to be teleported. Must be a player name, a target selector, or a UUID‌.
       *  Permits entities other than players.
       *
       * @param location
       *  Specifies the coordinates to teleport the target(s) to.
       *  May use tilde and caret notation to specify a position relative to the position where the command is executed.
       *
       * @returns
       *  An object with two optional possibilities: `facing` or `facingEntity`,
       *  to change the direction the player is facing.
       */
      (targets: SelectorArgument<false>, location: Coordinates) => TeleportFacing
    ) & (
      /**
       * Teleports entities (players, mobs, etc.) to the given location, with the given rotation.
       *
       * @param targets
       *  Specifies the entity(s) to be teleported. Must be a player name, a target selector, or a UUID‌.
       *  Permits entities other than players.
       *
       * @param location
       *  Specifies the coordinates to teleport the target(s) to.
       *  May use tilde and caret notation to specify a position relative to the position where the command is executed.
       *
       * @param rotation
       *  Specifies the rotation.
       *  Tilde notation can be used to specify a rotation relative to the target's previous rotation.
       */
      (targets: SelectorArgument<false>, location: Coordinates, rotation: Rotation) => void)
  ) = (...args: unknown[]): any => {
    if (args.length === 2 && (args[1] instanceof VectorClass || typeof args[1] === 'string')) {
      return new TeleportFacing(this.commandsRoot)
    }

    this.commandsRoot.register()
  }
}
