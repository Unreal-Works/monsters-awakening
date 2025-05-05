import { KnitClient as Knit, KnitClient, Signal } from "@rbxts/knit";
import { Calculations } from "shared/utils/Calculations";
import DataController from "../DataController";
import { RunService } from "@rbxts/services";

declare global {
    interface KnitControllers {
        ManaController: typeof ManaController;
    }
}

const CombatService = KnitClient.GetService("CombatService");

const ManaController = Knit.CreateController({
    Name: "ManaController",

    mana: 0,
    maxMana: Calculations.getMaxMana(DataController.stats.MagicProficiency ?? 0),
    manaUpdated: new Signal<(mana: number) => void>(),
    maxManaUpdated: new Signal<(maxMana: number) => void>(),

    getMana() {
        return this.mana ?? 0;
    },

    getMaxMana() {
        return this.maxMana ?? 0;
    },

    setMana(mana: number) {
        const maxMana = this.getMaxMana();
        if (mana > maxMana) {
            mana = maxMana;
        }
        else if (mana < 0) {
            mana = 0;
        }
        this.mana = mana;
        this.manaUpdated.Fire(mana);
    },

    incrementMana(delta: number) {
        this.setMana(this.getMana() + delta);
    },

    KnitInit() {
        RunService.Heartbeat.Connect((deltaTime) => {
            this.incrementMana(this.getMaxMana() * 0.1 * deltaTime);
        });
        DataController.statsUpdated.Connect(() => {
            const maxMana = Calculations.getMaxMana(DataController.stats.MagicProficiency ?? 0);
            this.maxMana = maxMana;
            this.maxManaUpdated.Fire(maxMana);
        });
        CombatService.manaGiven.Connect((mana) => {
            this.incrementMana(mana);
        });
    },
});

export = ManaController;