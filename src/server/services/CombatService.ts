import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import { CollectionService } from "@rbxts/services";
import { getHumanoid } from "shared/utils/vrldk/PlayerUtils";
import CharacterService from "./CharacterService";
import StatusEffectsService from "./StatusEffectsService";
declare global {
	interface KnitServices {
		CombatService: typeof CombatService;
	}
}

const CombatService = KnitServer.CreateService({
    Name: "CombatService",

    Client: {
        checkDamage: new RemoteSignal<(part: BasePart, damage: number) => void>(),
        damageDealt: new RemoteSignal<(target: Humanoid, damage: number) => void>(),
        manaGiven: new RemoteSignal<(mana: number) => void>(),

        takeDamage(player: Player, damage: number) {
            if (damage > 0) {
                getHumanoid(player)?.TakeDamage(damage);
            }
        },

        dealDamage(player: Player, target: Humanoid, damage: number) {
            if (player && target && target.Parent && CollectionService.HasTag(target.Parent, "Mob") && damage > 0) {
                target.TakeDamage(damage);
                this.damageDealt.Fire(player, target, damage);
            }
        },

        dealRelativeDamage(player: Player, target: Humanoid, scale: string, relativeDamage: number) {
            this.dealDamage(player, target, CharacterService.getBaseDamage(player, scale) * relativeDamage);
        },

        heal(player: Player, target: Humanoid, amount: number) {
            if (player && target && target.Parent && amount > 0) {
                target.TakeDamage(target.Health + amount > target.MaxHealth ? 
                    (target.Health - target.MaxHealth) :
                    -amount);
            }
        },

        healRelative(player: Player, target: Humanoid, scale: string, relativeAmount: number) {
            this.heal(player, target, CharacterService.getBaseDamage(player, scale) * relativeAmount);
        },

        addStatusEffect(_player: Player, target: Humanoid, ID: string, multiplier: number, duration: number) {
            StatusEffectsService.addStack(target, ID, multiplier, duration);
        },

        removeStatusEffect(_player: Player, target: Humanoid, ID: string) {
            StatusEffectsService.removeStacks(target, ID);
        },

        giveMana(player: Player, target: Player, mana: number) {
            if (player !== target) {
                this.manaGiven.Fire(target, mana);
            }
        },
    },

    checkDamage(part: BasePart, damage: number) {
        this.Client.checkDamage.FireAll(part, damage);
    },

    load() {

    },

    KnitInit() {
        
    }
});


export = CombatService;