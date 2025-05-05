import { KnitClient as Knit } from "@rbxts/knit";
import { SIDEBAR_BUTTONS } from "client/constants";
import { isLobby } from "shared/utils/Dungeon";
import AdaptiveTabController from "client/controllers/interface/AdapativeTabController";
import UIController from "client/controllers/interface/UIController";

declare global {
    interface KnitControllers {
        SidebarController: typeof SidebarController;
    }
}

const SidebarController = Knit.CreateController({
    Name: "SidebarController",

    hideSidebarButtons() {
        return SIDEBAR_BUTTONS.Visible = false;
    },
    
    showSidebarButtons() {
        return SIDEBAR_BUTTONS.Visible = true;
    },
    
    refreshSidebarButtons() {
        (SIDEBAR_BUTTONS.WaitForChild("Play") as TextButton).Visible = isLobby();
    },

    KnitInit() {
        for (const sidebarButton of SIDEBAR_BUTTONS.GetChildren()) {
            if (sidebarButton.IsA("TextButton")) {
                sidebarButton.MouseButton1Click.Connect(() => {
                    UIController.playSound("Click");
                    AdaptiveTabController.showAdaptiveTab(sidebarButton.Name);
                })
            }
        }

        AdaptiveTabController.adaptiveTabShown.Connect(() => {
            SidebarController.hideSidebarButtons();
        });

        AdaptiveTabController.adaptiveTabHidden.Connect(() => {
            SidebarController.showSidebarButtons();
        });
    }
});

export = SidebarController;