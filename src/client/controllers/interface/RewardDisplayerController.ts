import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { TweenService } from "@rbxts/services";
import { ASSETS, REWARD_DISPLAYER_WINDOW } from "client/constants";
import UIController from "client/controllers/interface/UIController";
import { Loot } from "shared/utils/constants";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";
import SlotController from "./SlotController";

declare global {
    interface KnitControllers {
        RewardDisplayerController: typeof RewardDisplayerController;
    }
}

const LootService = KnitClient.GetService("LootService");

const RewardDisplayerController = Knit.CreateController({
    Name: "RewardDisplayerController",

    showRewardDisplayerWindow(loot: Loot) {
        task.spawn(() => {
            if (loot.gold > 0) {
                REWARD_DISPLAYER_WINDOW.GoldGainedLabel.Visible = true;
                REWARD_DISPLAYER_WINDOW.GoldGainedLabel.Text = abbreviate(math.floor(loot.gold), true) + " Gold";
    
                TweenService.Create(REWARD_DISPLAYER_WINDOW.GoldGainedLabel,
                    new TweenInfo(0.2, Enum.EasingStyle.Linear), { TextTransparency: 0 }).Play();
                wait(4);
                TweenService.Create(REWARD_DISPLAYER_WINDOW.GoldGainedLabel,
                    new TweenInfo(1, Enum.EasingStyle.Linear), { TextTransparency: 1 }).Play();
                wait(1);
                REWARD_DISPLAYER_WINDOW.GoldGainedLabel.Visible = false;
            }
        });
    
        for (const item of loot.items) {
            task.spawn(() => {
                const slot = ASSETS.Slot.Clone();
                slot.GroupTransparency = 1;
                SlotController.setItemOfSlot(slot, item);
                slot.Parent = REWARD_DISPLAYER_WINDOW.ItemsList;
                UIController.playSound("ItemGet");
                TweenService.Create(slot, new TweenInfo(0.3, Enum.EasingStyle.Quad), { GroupTransparency: 0 }).Play();
                wait(4);
                TweenService.Create(slot, new TweenInfo(1, Enum.EasingStyle.Linear), { GroupTransparency: 1 }).Play();
                wait(1);
                slot.Destroy();
            });
            wait(0.15);
        }
    },

    load() {

    },

    KnitInit() {
        LootService.lootReceived.Connect((loot) => {
            this.showRewardDisplayerWindow(loot);
        });
    }
});

export = RewardDisplayerController;