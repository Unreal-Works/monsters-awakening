import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import { ReplicatedStorage } from "@rbxts/services";
import { CosmeticsData } from "shared/utils/constants";

declare global {
	interface KnitServices {
		CosmeticsService: typeof CosmeticsService;
	}
}

const CosmeticsService = KnitServer.CreateService({
    Name: "CosmeticsService",
    cosmeticsUpdated: new Signal<(player: Player, data: CosmeticsData) => void>(),
    typesPerCosmeticID: new Map<number, "Weapon" | "Armor">(),

    Client: {
        cosmeticsUpdated: new RemoteSignal<(data: CosmeticsData) => void>(),

        getCosmeticsData(player: Player) {
            return this.Server.getCosmeticsData(player);
        }, 

        getOwnedCosmetics(player: Player) {
            return this.Server.getOwnedCosmetics(player);
        },

        getEquippedCosmetic(player: Player) {
            return this.Server.getEquippedCosmetic(player);
        },

        equipCosmetic(player: Player, cosmeticID: number) {
            return this.Server.equipCosmetic(player, cosmeticID);
        },

        unequipCosmetic(player: Player, equipType: "Weapon" | "Armor") {
            return this.Server.unequipCosmetic(player, equipType);
        },
    },

    getDataStore(player: Player) {
        return DataStore2<CosmeticsData>("Cosmetics", player);
    },

    getCosmeticsData(player: Player) {
        const data = this.getDataStore(player).Get({
            Owned: [],
            Equipped: {
                Weapon: undefined,
                Armor: undefined
            }
        });
        if (typeOf(data.Equipped) === "number") {
            data.Equipped = {
                Weapon: undefined,
                Armor: undefined
            }
        }
        return data;
    },

    setCosmeticsData(player: Player, data: CosmeticsData) {
        this.getDataStore(player).Set(data);
    },

    getOwnedCosmetics(player: Player) {
        return this.getCosmeticsData(player).Owned;
    },

    isCosmeticOwned(player: Player, cosmeticID: number) {
        return this.getOwnedCosmetics(player).includes(cosmeticID);
    },

    setOwnedCosmetics(player: Player, value: number[]) {
        const data = this.getCosmeticsData(player);
        data.Owned = value;
        this.setCosmeticsData(player, data);
    },

    grantCosmetic(player: Player, value: number) {
        const owned = this.getOwnedCosmetics(player);
        if (!owned.includes(value)) {
            owned.push(value);
        }
        this.setOwnedCosmetics(player, owned);
    },

    getEquippedCosmetic(player: Player) {
        return this.getCosmeticsData(player).Equipped;
    },

    getCosmeticType(cosmeticID: number) {
        const cached = this.typesPerCosmeticID.get(cosmeticID);
        if (cached === undefined) {
            const physicalItem = ReplicatedStorage.WaitForChild("Assets").WaitForChild("Items").FindFirstChild("Cosmetic" + cosmeticID); // TODO make this not stupid
            const cosmeticType = physicalItem === undefined ? "Armor" : (physicalItem.IsA("Tool") ? "Weapon" : "Armor");
            this.typesPerCosmeticID.set(cosmeticID, cosmeticType);
            return cosmeticType;
        }
        return cached;
    },

    equipCosmetic(player: Player, value: number): boolean {
        if (this.getOwnedCosmetics(player).includes(value) || value === 0) {
            const data = this.getCosmeticsData(player);
            const cosmeticType = this.getCosmeticType(value);
            data.Equipped[cosmeticType] = value === 0 ? undefined : value;
            this.setCosmeticsData(player, data);
            return true;
        }
        return false;
    },

    unequipCosmetic(player: Player, equipType: "Weapon" | "Armor") {
        const data = this.getCosmeticsData(player);
        data.Equipped[equipType] = undefined;
        this.setCosmeticsData(player, data);
    },
    
    load(player: Player) {
        const dataStore = this.getDataStore(player);
        dataStore.OnUpdate((value) => {
            this.Client.cosmeticsUpdated.Fire(player, value);
            this.cosmeticsUpdated.Fire(player, value);
        });
    },

    KnitInit() {
        DataStore2.Combine("Data", "Cosmetics");
        
    }
});


export = CosmeticsService;

