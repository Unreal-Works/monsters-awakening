import { KnitClient as Knit } from "@rbxts/knit";
import { CollectionService, TweenService } from "@rbxts/services";
import { BOSS_LABEL } from "client/constants";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";

declare global {
    interface KnitControllers {
        BossLabelController: typeof BossLabelController;
    }
}

const BossLabelController = Knit.CreateController({
    Name: "BossLabelController",

    displayBossLabel(enemy: Model) {
        task.spawn(() => {
            const humanoid = enemy.WaitForChild("Humanoid", 1) as Humanoid;
            if (humanoid && humanoid.WaitForChild("Boss", 1)) {
                BOSS_LABEL.NameLabel.Text = enemy.Name;
                BOSS_LABEL.Visible = true;
                BOSS_LABEL.HealthBar.ValueLabel.Text = abbreviate(humanoid.Health);
                humanoid.HealthChanged.Connect((health) => {
                    BOSS_LABEL.HealthBar.ValueLabel.Text = abbreviate(health);
                    TweenService.Create(BOSS_LABEL.HealthBar.ExtendingBar, 
                        new TweenInfo(0.1), {Size: new UDim2(health / humanoid.MaxHealth, 0, 1, 0)}).Play();
                });
            }
        });
    },

    load() {

    },
    
    KnitInit() {
        CollectionService.GetInstanceAddedSignal("Mob").Connect((enemy) => {
            this.displayBossLabel(enemy as Model);
        });
        CollectionService.GetInstanceRemovedSignal("Mob").Connect((enemy) => {
            const humanoid = enemy.FindFirstChildOfClass("Humanoid");
            if (humanoid && humanoid.FindFirstChild("Boss")) {
                BOSS_LABEL.Visible = false;
            }
        });
    }
});

export = BossLabelController;