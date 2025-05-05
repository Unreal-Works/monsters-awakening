import CameraShaker from "@rbxts/camera-shaker";
import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { Lighting, RunService, TweenService, Workspace } from "@rbxts/services";
import Icon from "@rbxts/topbar-plus";
import { ASSETS, LOCAL_PLAYER, MOUSE, PLAYER_GUI } from "client/constants";
import { getHumanoid } from "shared/utils/vrldk/PlayerUtils";

declare global {
    interface KnitControllers {
        UIController: typeof UIController;
    }
}

const MsgService = KnitClient.GetService("MsgService");

const UIController = Knit.CreateController({
    Name: "UIController",

    settingsIcon: new Icon().setImage(7059346373).setLabel("Settings").setRight(),

    playSound(soundName: string) {
        (ASSETS.WaitForChild(soundName + "Sound") as Sound).Play();
    },

    getLocalBlurEffect(): BlurEffect {
        let blur = Lighting.FindFirstChild("Blur") as BlurEffect;
        if (!blur) {
            blur = new Instance("BlurEffect", Lighting);
            blur.Name = "Blur";
            blur.Enabled = false;
        }
        return blur;
    },
    
    enableBlur() {
        const blur = this.getLocalBlurEffect();
        blur.Enabled = true;
        blur.Size = 0;
        TweenService.Create(blur, new TweenInfo(0.2), { Size: 12 }).Play();
    },
    
    disableBlur() {
        const blur = this.getLocalBlurEffect();
        TweenService.Create(blur, new TweenInfo(0.2), { Size: 0 }).Play();
        task.delay(0.2, () => {
            blur.Enabled = false;
        });
    },

    isCursorObstructed() {
        const objs = PLAYER_GUI.GetGuiObjectsAtPosition(MOUSE.X, MOUSE.Y);
        for (const v of objs) {
            if (v.IsA("GuiObject") && v.Visible && v.BackgroundTransparency < 1) {
                return true;
            }
        }
        return false;
    },
    
    moveCameraToHumanoid() {
        if (Workspace.CurrentCamera) {
            Workspace.CurrentCamera.CameraType = Enum.CameraType.Custom;
            Workspace.CurrentCamera.CameraSubject = getHumanoid(LOCAL_PLAYER);
        }
    },

    KnitInit() {
        MsgService.cameraShaked.Connect(() => {
            const camShake = new CameraShaker(Enum.RenderPriority.Camera.Value, (shakeCf) => {
                if (Workspace.CurrentCamera) {
                    Workspace.CurrentCamera.CFrame = Workspace.CurrentCamera.CFrame.mul(shakeCf);
                }
            });
            camShake.Start();
            camShake.Shake(CameraShaker.Presets.Bump);
        });
    }
});

export = UIController;