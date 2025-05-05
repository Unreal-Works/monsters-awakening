import { KnitServer as Knit, RemoteSignal } from "@rbxts/knit";
import { BadgeService } from "@rbxts/services";
import CosmeticsService from "server/services/playerdata/CosmeticsService";
import GoldService from "server/services/playerdata/GoldService";
import InventoryService from "server/services/playerdata/InventoryService";
import { Loot } from "shared/utils/constants";

declare global {
    interface KnitServices {
        LootService: typeof LootService;
    }
}

const LootService = Knit.CreateService({
    Name: "LootService",

    Client: {
        lootReceived: new RemoteSignal<(loot: Loot) => void>(),
    },

    giveLoot(player: Player, loot: Loot) {
        GoldService.incrementGold(player, loot.gold);
        for (const item of loot.items) {
            InventoryService.addItemToStorage(player, item);
        }
        for (const cosmetic of loot.cosmetics) {
            CosmeticsService.grantCosmetic(player, cosmetic);
        }
        for (const badge of loot.badges) {
            BadgeService.AwardBadge(player.UserId, badge);
        }
        this.Client.lootReceived.Fire(player, loot);
        InventoryService.getDataStore(player).Save();
        CosmeticsService.getDataStore(player).Save();
    },

    KnitInit() {
        
    },
});

export = LootService;