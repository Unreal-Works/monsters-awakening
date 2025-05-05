import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";

declare global {
	interface KnitServices {
		MsgService: typeof MsgService;
	}
}

const MsgService = KnitServer.CreateService({
    Name: "MsgService",

    hotbarNotificationSent: new Signal<(player: Player, message: string, color: Color3) => void>(), 
    notificationSent: new Signal<(player: Player, message: string, color: Color3) => void>(),

    Client: {
        hotbarNotificationSent: new RemoteSignal<(message: string, color: Color3) => void>(),
        notificationSent: new RemoteSignal<(message: string, color: Color3) => void>(),
        cameraShaked: new RemoteSignal<() => void>(),
    },

    sendHotbarNotification(player: Player, message: string, color?: Color3) {
        const c = color ?? new Color3(1, 1, 1);
        this.hotbarNotificationSent.Fire(player, message, c);
        this.Client.hotbarNotificationSent.Fire(player, message, c);
    },

    sendNotification(player: Player, message: string, color: Color3) {
        this.notificationSent.Fire(player, message, color);
        this.Client.notificationSent.Fire(player, message, color);
    },

    sendGlobalNotification(message: string, color: Color3) {
        this.Client.notificationSent.FireAll(message, color);
    },

    shakeCamera(player: Player) {
        this.Client.cameraShaked.Fire(player);
    },

    shakeAllCameras() {
        this.Client.cameraShaked.FireAll();
    },

    KnitInit() {

    }
});


export = MsgService;

