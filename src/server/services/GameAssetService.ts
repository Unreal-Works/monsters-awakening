import { KnitServer as Knit } from "@rbxts/knit";
import { InsertService, MarketplaceService, Players, ReplicatedStorage } from "@rbxts/services";

declare global {
    interface KnitServices {
        GameAssetService: typeof GameAssetService;
    }
}

type ProductFunction = (receiptInfo: ReceiptInfo, player: Player) => Enum.ProductPurchaseDecision;

const GameAssetService = Knit.CreateService({
    Name: "GameAssetService",

    skillTrees: undefined as Folder | undefined,
    productFunctions: new Map<number, ProductFunction>(),

    Client: {
    },

    loadSkillTrees() {
        task.spawn(() => {
            this.skillTrees = InsertService.LoadAsset(15361820775).WaitForChild("SkillTrees") as Folder;
            this.skillTrees.Parent = ReplicatedStorage;
        });
    },

    setProductFunction(productID: number, productFunction: ProductFunction) {
        this.productFunctions.set(productID, productFunction);
    },

    KnitInit() {
        MarketplaceService.ProcessReceipt = (receiptInfo: ReceiptInfo) => {
            const productFunction = this.productFunctions.get(receiptInfo.ProductId);
            const player = Players.GetPlayerByUserId(receiptInfo.PlayerId);
            if (productFunction === undefined || player === undefined) {
                return Enum.ProductPurchaseDecision.NotProcessedYet;
            }
            return productFunction(receiptInfo, player);
        }
    },
});

export = GameAssetService;