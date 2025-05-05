import { KnitServer as Knit, RemoteSignal, Signal } from "@rbxts/knit";
import { Players, Workspace } from "@rbxts/services";
import { getCurrentDungeon, getRandomisedDungeonLoot, isLobby } from "shared/utils/Dungeon";
import { getItemsOfTypeInStorage } from "shared/utils/Inventory";
import { DUNGEONS } from "shared/utils/constants";
import { convertToHHMMSS } from "shared/utils/vrldk/NumberAbbreviations";
import MsgService from "./MsgService";
import InventoryService from "./playerdata/InventoryService";
import LevelService from "./playerdata/LevelService";
import RecordService from "./playerdata/RecordService";
import SpecialService from "./playerdata/SpecialService";
import LootService from "./LootService";

declare global {
    interface KnitServices {
        LobbyService: typeof LobbyService;
    }
}

const LobbyService = Knit.CreateService({
    Name: "LobbyService",
    playersInUpgrade: [] as Player[],
    playersInSell: [] as Player[],
    collectedDaily: [] as Player[],
    sellShown: new Signal<(player: Player) => void>(),
    upgradeShown: new Signal<(player: Player) => void>(),

    Client: {
        sellShown: new RemoteSignal<() => void>(),
        upgradeShown: new RemoteSignal<() => void>(),
    },

    showSell(player: Player) {
        this.sellShown.Fire(player);
        this.Client.sellShown.Fire(player);
    },

    showUpgrade(player: Player) {
        this.upgradeShown.Fire(player);
        this.Client.upgradeShown.Fire(player);
    },
    
    getPlayerFromPart(part: BasePart) {
        return part.Parent ? Players.FindFirstChild(part.Parent.Name) as Player | undefined : undefined;
    },

    load() {

    },

    KnitInit() {
        if (!isLobby()) {
            return;
        }
        const touchUpgrade = Workspace.WaitForChild("Upgrade").WaitForChild("TouchPart") as BasePart;
        const touchSell = Workspace.WaitForChild("Sell").WaitForChild("TouchPart") as BasePart;
        const touchDaily = Workspace.WaitForChild("Map").WaitForChild("DailyRing").WaitForChild("TouchPart") as BasePart;

        touchUpgrade.Touched.Connect((part) => {
            const player = this.getPlayerFromPart(part);
            if (player && !this.playersInUpgrade.includes(player)) {
                this.playersInUpgrade.push(player);
                this.showUpgrade(player);
            }
        });

        touchUpgrade.TouchEnded.Connect((part) => {
            const player = this.getPlayerFromPart(part);
            if (player) {
                const index = this.playersInUpgrade.indexOf(player);
                if (index > -1) {
                    this.playersInUpgrade.remove(index);
                }
            }
        });

        touchSell.Touched.Connect((part) => {
            const player = this.getPlayerFromPart(part);
            if (player && !this.playersInSell.includes(player)) {
                this.playersInSell.push(player);
                this.showSell(player);
            }
        });

        touchSell.TouchEnded.Connect((part) => {
            const player = this.getPlayerFromPart(part);
            if (player) {
                const index = this.playersInSell.indexOf(player);
                if (index > -1) {
                    this.playersInSell.remove(index);
                }
            }
        });

        touchDaily.Touched.Connect((part) => {
            const player = this.getPlayerFromPart(part);
            if (player && !this.collectedDaily.includes(player)) {
                this.collectedDaily.push(player);
                task.delay(2, () => {
                    const index = this.collectedDaily.indexOf(player);
                    if (index > -1) {
                        this.collectedDaily.remove(index);
                    }
                });
                const last = RecordService.getLastDaily(player);
                if (tick() - last > 43200) {
                    LootService.giveLoot(player, getRandomisedDungeonLoot(DUNGEONS.LOBBY, "", 
                        2 + (SpecialService.isInGroup(player) ? 1 : 0) + (SpecialService.isExtraItem(player) ? 1 : 0), 
                        LevelService.getLevel(player)));
                    RecordService.incrementDailyRewardsCollected(player, 1);
                    RecordService.setLastDaily(player, tick());
                }
                else {
                    MsgService.sendNotification(player, "Time left: " + convertToHHMMSS(43200 - (tick() - last)), new Color3(1, 0, 0));
                }
            }
        });
    },
});

export = LobbyService;