
import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { INSPECT_WINDOW } from "client/constants";
import AdaptiveTabController from "client/controllers/interface/AdapativeTabController";
import SlotController from "client/controllers/interface/SlotController";
import { Item } from "shared/utils/constants";

declare global {
    interface KnitControllers {
        InspectController: typeof InspectController;
    }
}

const InventoryService = KnitClient.GetService("InventoryService");

const InspectController = Knit.CreateController({
    Name: "InspectController",

    refreshInspectWindow(name: string, equipment: {[key: string]: Item}) {
        INSPECT_WINDOW.PlayerNameLabel.Text = name;
        SlotController.setItemOfSlot(INSPECT_WINDOW.AvatarView.Helmet, equipment.Helmet);
        SlotController.setItemOfSlot(INSPECT_WINDOW.AvatarView.Chestplate, equipment.Chestplate);
        SlotController.setItemOfSlot(INSPECT_WINDOW.AvatarView.Weapon, equipment.Weapon);
    },

    load() {

    },

    KnitInit() {
        InventoryService.targetInspected.Connect((name, targetEquipment) => {
            this.refreshInspectWindow(name, targetEquipment);
            AdaptiveTabController.showAdaptiveTab("Inspect");
        });
    }
});

export = InspectController;