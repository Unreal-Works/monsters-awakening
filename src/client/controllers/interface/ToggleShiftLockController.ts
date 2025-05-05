import { KnitClient as Knit } from "@rbxts/knit";
import { RunService, UserInputService, Workspace } from "@rbxts/services";
import { LOCAL_PLAYER, TOGGLE_SHIFT_LOCK } from "client/constants";
import UIController from "client/controllers/interface/UIController";
import { getHumanoid } from "shared/utils/vrldk/PlayerUtils";

declare global {
    interface KnitControllers {
        ToggleShiftLockController: typeof ToggleShiftLockController;
    }
}

const ToggleShiftLockController = Knit.CreateController({
    Name: "ToggleShiftLockController",

    isShiftLock: false,

    refreshShiftLockButton() {
        TOGGLE_SHIFT_LOCK.Visible = UserInputService.TouchEnabled;
    },

    toggleShiftLock() {
        const hum = getHumanoid(LOCAL_PLAYER);
        if (!hum) {
            return;
        }
        const root = hum.RootPart;
        if (!root) {
            return;
        }
        if (this.isShiftLock) {
            hum.AutoRotate = false;
    
            hum.CameraOffset = new Vector3(1, 0.5, 0);
            RunService.BindToRenderStep("ShiftLock", Enum.RenderPriority.Character.Value, () => {
                if (!Workspace.CurrentCamera) {
                    return;
                }
                const [_, y] = Workspace.CurrentCamera.CFrame.Rotation.ToEulerAnglesYXZ();
                root.CFrame = new CFrame(root.Position).mul(CFrame.Angles(0, y, 0));
                UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;
            });
        }
        else {
            hum.CameraOffset = new Vector3(0,0,0);
            RunService.UnbindFromRenderStep("ShiftLock");
            hum.AutoRotate = true;
            UserInputService.MouseBehavior = Enum.MouseBehavior.Default;
        }
        this.isShiftLock = !this.isShiftLock;
    },

    load() {

    },

    KnitInit() {
        this.refreshShiftLockButton();
        TOGGLE_SHIFT_LOCK.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.toggleShiftLock();
        });
    }
});

export = ToggleShiftLockController;