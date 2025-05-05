import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import { Players } from "@rbxts/services";
import InventoryService from "server/services/playerdata/InventoryService";
import { isSameItem } from "shared/utils/Item";
import { Item, Trade } from "shared/utils/constants";
import LootService from "./LootService";
import RecordService from "./playerdata/RecordService";

declare global {
	interface KnitServices {
		TradeService: typeof TradeService;
	}
}

const TradeService = KnitServer.CreateService({
    Name: "TradeService",

    trades: [] as Trade[],
    completedTrades: [] as Trade[],
    pending: [] as Player[],
    partyAdded: new Signal<() => void>(), 
    isEnabled: false,

    Client: {
        tradeUpdated: new RemoteSignal<(trade: Trade | undefined) => void>(),
        tradeRequestSent: new RemoteSignal<(player: Player) => void>(),

        toggleTradeAcceptance(player: Player) {
            return this.Server.acceptTrade(player);
        },

        sendTradeRequest(player: Player, target: Player) {
            return this.Server.sendTradeRequest(player, target);
        },

        acceptTradeRequest(player: Player, sender: Player) {
            return this.Server.acceptTradeRequest(player, sender);
        },

        setItems(player: Player, items: Item[]) {
            this.Server.setItems(player, items);
        },

        leaveTrade(player: Player) {
            this.Server.cancelTrade(player);
        },
    },

    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    },

    findTrade(player: Player): Trade | undefined {
        if (this.isEnabled) {
            for (const trade of this.trades) {
                if (trade.P1 === player || trade.P2 === player) {
                    return trade;
                }
            }
        }
        return undefined;
    },

    cancelTrade(player: Player) {
        const trade = this.findTrade(player);

        if (trade) {
            this.Client.tradeUpdated.Fire(trade.P1, undefined);
            this.Client.tradeUpdated.Fire(trade.P2, undefined);
            this.trades = this.trades.filter((v) => {
                return v !== trade;
            })
        }
    },

    sendTradeRequest(sender: Player, target: Player) {
        if (this.findTrade(sender) || this.findTrade(target) || sender === target) {
            return;
        }
        this.pending.push(sender);
        this.Client.tradeRequestSent.Fire(target, sender);
        task.delay(45, () => {
            this.pending.filter((v) => { 
                return v !== sender;
            });
        });
    },

    acceptTradeRequest(player: Player, sender: Player): Trade | undefined {
        if (player === sender) {
            return undefined;
        }
        for (const v of this.pending) {
            if (v === sender) {
                this.pending = this.pending.filter((v) => {
                    return v !== sender;
                });
                const trade = {
                    P1: sender,
                    P2: player,
                    OfferP1: [],
                    OfferP2: [],
                    AcceptedP1: false,
                    AcceptedP2: false
                }
                this.trades.push(trade);
                this.Client.tradeUpdated.Fire(player, trade);
                this.Client.tradeUpdated.Fire(sender, trade);
                return trade;
            }
        }
        return undefined;
    },

    setItems(player: Player, items: Item[]) {
        const trade = this.findTrade(player);
        if (trade) {
            const reg = trade.P1 === player ? "OfferP1" : "OfferP2";
            trade[reg] = [];
            for (const item of InventoryService.getInventory(player).storage) {
                for (const selectedItem of items) {
                    if (isSameItem(item, selectedItem) && item.type !== "DailyReward") {
                        trade[reg].push(item);
                    }
                }
            }
            this.Client.tradeUpdated.Fire(trade.P1, trade);
            this.Client.tradeUpdated.Fire(trade.P2, trade);
        }
    },

    acceptTrade(player: Player) {
        const trade = this.findTrade(player);
        if (trade) {
            const reg = trade.P1 === player ? "AcceptedP1" : "AcceptedP2";
            trade[reg] = !trade[reg];
            this.Client.tradeUpdated.Fire(trade.P1, trade);
            this.Client.tradeUpdated.Fire(trade.P2, trade);
            if (trade.AcceptedP1 && trade.AcceptedP2) {
                task.delay(5, () => {
                    if (trade.AcceptedP1 && trade.AcceptedP2 && !this.completedTrades.includes(trade)) {
                        for (const v of trade.OfferP1) {
                            if (InventoryService.removeItemFromStorage(trade.P1, v)) {
                                LootService.giveLoot(trade.P2, {gold: 0, items: [v], cosmetics: [], badges: []});
                            }
                        }

                        for (const v of trade.OfferP2) {
                            if (InventoryService.removeItemFromStorage(trade.P2, v)) {
                                LootService.giveLoot(trade.P1, {gold: 0, items: [v], cosmetics: [], badges: []});
                            }
                        }
                        this.cancelTrade(player);
                        this.completedTrades.push(trade);

                        RecordService.addCompletedTrade(trade.P1, {trade: trade, otherPlayer: trade.P2});
                        RecordService.addCompletedTrade(trade.P2, {trade: trade, otherPlayer: trade.P1});
                        RecordService.getDataStore(trade.P1).Save();
                        RecordService.getDataStore(trade.P2).Save();
                    }
                });
            }
        }
    },

    KnitInit() {
        Players.PlayerRemoving.Connect((player) => {
            this.cancelTrade(player);
        });
    }
});


export = TradeService;

