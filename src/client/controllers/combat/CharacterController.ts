import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { Workspace } from "@rbxts/services";
import { LOCAL_PLAYER } from "client/constants";
import DataController from "client/controllers/DataController";
import { Calculations } from "shared/utils/Calculations";
import { STATUS_EFFECTS } from "shared/utils/constants";
import { getHumanoid } from "shared/utils/vrldk/PlayerUtils";

declare global {
    interface KnitControllers {
        CharacterController: typeof CharacterController;
    }
}

const CharacterService = KnitClient.GetService("CharacterService");

const CharacterController = Knit.CreateController({
    Name: "CharacterController",

    BASE_GRAVITY: Workspace.Gravity,
    characterLocked: false,
    speedBonus: 0,

    updateHumanoid() {
        const humanoid = getHumanoid(LOCAL_PLAYER);
        if (humanoid) {
            let ws = 0;
            let gravity = this.BASE_GRAVITY;
            humanoid.AutoRotate = !this.characterLocked;
            ws = Calculations.getBaseWalkspeed(DataController.stats.Speed ?? 0) + this.speedBonus;
            for (const stacks of humanoid.WaitForChild("StatusEffects").GetChildren()) {
                const statusEffect = STATUS_EFFECTS[stacks.Name];
                if (statusEffect) {
                    const amplifier = (stacks.GetAttribute("BestAmplifier") as number) ?? 0;
                    if (amplifier > 0) {
                        if (statusEffect.Effect.SelfWalkSpeed) {
                            ws = statusEffect.Effect.SelfWalkSpeed(amplifier, ws);
                        }
                        if (statusEffect.Effect.Gravity) {
                            gravity = statusEffect.Effect.Gravity(amplifier, gravity);
                        }
                    }
                }
            }
    
            humanoid.WalkSpeed = ws;
            Workspace.Gravity = gravity;
        }
    },

    addSpeed(walkSpeed: number, duration: number) {
        this.speedBonus += walkSpeed;
        this.updateHumanoid();
        task.delay(duration, () => {
            this.speedBonus -= walkSpeed;
            this.updateHumanoid();
        });
    },

    KnitInit() {
        CharacterService.humanoidUpdated.Connect(() => {
            this.updateHumanoid();
        });
        DataController.statsUpdated.Connect(() => {
            this.updateHumanoid();
        });
    },

});

export = CharacterController;