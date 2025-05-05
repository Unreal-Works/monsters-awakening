import { KnitClient as Knit, KnitClient, Signal } from "@rbxts/knit";
import { LOCAL_PLAYER } from "client/constants";
import DataController from "client/controllers/DataController";
import SkillController from "client/controllers/combat/SkillController";
import { getSkill } from "shared/utils/Skill";
import { getHumanoid } from "shared/utils/vrldk/PlayerUtils";

declare global {
    interface KnitControllers {
        DamageController: typeof DamageController;
    }
}

const CombatService = KnitClient.GetService("CombatService");

const DamageController = Knit.CreateController({
    Name: "DamageController",

    humanoid: getHumanoid(LOCAL_PLAYER),
    damageDealt: new Signal<(target: Humanoid, damage: number) => void>(),

    /**
     * Returns whether the player is in a virtual region with a given position and size.
     * 
     * @param cFrame CFrame of the region
     * @param size Size of the region
     */
    playerIsIn(cFrame: CFrame, size: Vector3) {
        if (this.humanoid && this.humanoid.RootPart) {
            const checkPart = new Instance("Part");
            checkPart.Anchored = true;
            checkPart.CanCollide = false;
            checkPart.Transparency = 1;
            checkPart.CFrame = cFrame;
            checkPart.Size = size;
            checkPart.Touched.Connect(() => {});
            for (const v of checkPart.GetTouchingParts()) {
                if (v === this.humanoid.RootPart) {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * Returns whether the player is in a part as a region.
     * 
     * @param part Part
     */
    playerIsInPart(part: BasePart) {
        if (this.humanoid && this.humanoid.RootPart) {
            part.Touched.Connect(() => {});
            for (const v of part.GetTouchingParts()) {
                if (v === this.humanoid.RootPart) {
                    return true;
                }
            }
        }
        return false;
    },

    load() {

    },

    KnitInit() {
        LOCAL_PLAYER.CharacterAdded.Connect((character) => {
            this.humanoid = character.WaitForChild("Humanoid") as Humanoid;
        });
    },
});

export = DamageController;