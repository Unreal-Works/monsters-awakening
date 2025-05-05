import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import DataController from "client/controllers/DataController";
import ManaController from "client/controllers/combat/ManaController";
import { getManaCost } from "shared/utils/Skill";

declare global {
    interface KnitControllers {
        SkillController: typeof SkillController;
    }
}

const SkillsService = KnitClient.GetService("SkillsService");

const SkillController = Knit.CreateController({
    Name: "SkillController",

    useSkillSlot(slotNumber: number): [boolean, number] {
        const skill = DataController.skills.Equipped["b" + slotNumber];
        if (skill) {
            const manaCost = getManaCost(skill);
            if (ManaController.getMana() > manaCost) {
                const result = SkillsService.useSkill(slotNumber);
                if (result) {
                    ManaController.incrementMana(-manaCost);
                }
                return [result, result === true ? manaCost : 0];
            }
            return [false, manaCost];
        }
        return [false, 0];
    },


    KnitInit() {

    },
});

export = SkillController;