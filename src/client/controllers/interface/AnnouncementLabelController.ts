import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { TweenService } from "@rbxts/services";
import { ANNOUNCEMENT_LABEL } from "client/constants";

declare global {
    interface KnitControllers {
        AnnouncementLabelController: typeof AnnouncementLabelController;
    }
}

const MsgService = KnitClient.GetService("MsgService");

const AnnouncementLabelController = Knit.CreateController({
    Name: "AnnouncementLabelController",

    tweens: [] as Tween[],

    createAnnouncement(message: string, color?: Color3) {
        for (const v of this.tweens) {
            v.Cancel();
            v.Destroy();
        }
        ANNOUNCEMENT_LABEL.TextColor3 = color ?? Color3.fromRGB(255, 99, 99);
        ANNOUNCEMENT_LABEL.Text = message;
        ANNOUNCEMENT_LABEL.TextTransparency = 0;
        ANNOUNCEMENT_LABEL.TextStrokeTransparency = 0;
        ANNOUNCEMENT_LABEL.BorderSizePixel += 1;
        const bsp = ANNOUNCEMENT_LABEL.BorderSizePixel;
        task.delay(2.5, () => {
            if (ANNOUNCEMENT_LABEL.BorderSizePixel === bsp) {
                const tween1 = TweenService.Create(ANNOUNCEMENT_LABEL, new TweenInfo(1), { TextTransparency: 1, TextStrokeTransparency: 1 });
                this.tweens.push(tween1);
                tween1.Play();
            }
        });
    },

    KnitInit() {
        MsgService.notificationSent.Connect((message) => {
            this.createAnnouncement(message);
        });
    }
});

export = AnnouncementLabelController;