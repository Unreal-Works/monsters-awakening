import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import CosmeticsService from "./CosmeticsService";
import GameAssetService from "../GameAssetService";

declare global {
	interface KnitServices {
		SnowflakesService: typeof SnowflakesService;
	}
}

const SnowflakesService = KnitServer.CreateService({
    Name: "SnowflakesService",
    snowflakesChanged: new Signal<(player: Player, snowflakes: number) => void>(),
    costPerCosmetic: new Map<number, number>(),
    snowflakePurchaseOptions: {
        Small: {
            snowflakes: 200,
            cost: 99,
            productID: 1714422800
        },
        Normal: {
            snowflakes: 1000,
            cost: 399,
            productID: 1714423033
        },
        Large: {
            snowflakes: 2500,
            cost: 999,
            productID: 1714423235
        },
        Massive: {
            snowflakes: 5000,
            cost: 1799,
            productID: 1714423415
        },
    } as {[key: string]: {snowflakes: number, cost: number, productID: number}},

    Client: {
        snowflakesChanged: new RemoteSignal<(snowflakes: number) => void>(),

        getSnowflakes(player: Player) {
            return this.Server.getSnowflakes(player);
        },

        getCost(_player: Player, cosmeticID: number) {
            return this.Server.getCost(cosmeticID);
        },

        getSnowflakePurchaseOption(_player: Player, ID: string) {
            return this.Server.getSnowflakePurchaseOption(ID);
        },
    

        buyCosmetic(player: Player, cosmeticID: number) {
            return this.Server.buyCosmetic(player, cosmeticID);
        },
    },

    getDataStore(player: Player) {
        return DataStore2<number>("Snowflakes", player);
    },

    getSnowflakes(player: Player) {
        return this.getDataStore(player).Get(0);
    },

    setSnowflakes(player: Player, value: number) {
        this.getDataStore(player).Set(value);
    },

    incrementSnowflakes(player: Player, delta: number) {
        this.getDataStore(player).Increment(delta);
    },

    getCost(cosmeticID: number) {
        return this.costPerCosmetic.get(cosmeticID) ?? 0;
    },

    buyCosmetic(player: Player, cosmeticID: number) {
        const cost = this.getCost(cosmeticID);
        if (this.getSnowflakes(player) < cost) {
            return false;
        }
        this.incrementSnowflakes(player, -cost);
        CosmeticsService.grantCosmetic(player, cosmeticID);
    },

    getSnowflakePurchaseOption(ID: string) {
        return this.snowflakePurchaseOptions[ID];
    },

    load(player: Player) {
        const dataStore = this.getDataStore(player);
        dataStore.OnUpdate((value) => {
            this.snowflakesChanged.Fire(player, value);
            this.Client.snowflakesChanged.Fire(player, value);
        });
    },
    
    KnitInit() {
        DataStore2.Combine("Data", "Snowflakes");
        this.costPerCosmetic.set(3, 10000);
        this.costPerCosmetic.set(4, 1500);
        this.costPerCosmetic.set(5, 1500);
        for (const [_ID, purchaseOption] of pairs(this.snowflakePurchaseOptions)) {
            GameAssetService.setProductFunction(purchaseOption.productID, (_receiptInfo, player) => {
                this.incrementSnowflakes(player, purchaseOption.snowflakes);
                return Enum.ProductPurchaseDecision.PurchaseGranted;
            });
        }
    }
});


export = SnowflakesService;

