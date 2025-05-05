import { ChatTag, GetLuaChatService } from "@rbxts/chat-service";
import { KnitServer as Knit } from "@rbxts/knit";
import { MarketplaceService } from "@rbxts/services";

declare global {
    interface KnitServices {
        SpecialService: typeof SpecialService;
    }
}

const SpecialService = Knit.CreateService({
    Name: "SpecialService",

    isLoadedPerPlayer: new Map<Player, boolean>(),
    isVIPPerPlayer: new Map<Player, boolean>(),
    isExtraItemPerPlayer: new Map<Player, boolean>(),
    isAdminPerPlayer: new Map<Player, boolean>(),
    isInGroupPerPlayer: new Map<Player, boolean>(),

    Client: {
    },

    isVIP(player: Player): boolean {
        return this.isVIPPerPlayer.get(player) ?? false;
    },

    setVIP(player: Player, value: boolean) {
        this.isVIPPerPlayer.set(player, value);
    },

    isExtraItem(player: Player): boolean {
        return this.isExtraItemPerPlayer.get(player) ?? false;
    },

    setExtraItem(player: Player, value: boolean) {
        this.isExtraItemPerPlayer.set(player, value);
    },

    isInGroup(player: Player): boolean {
        return this.isInGroupPerPlayer.get(player) ?? false;
    },

    setInGroup(player: Player, value: boolean) {
        this.isInGroupPerPlayer.set(player, value);
    },
    
    isAdmin(player: Player): boolean {
        return this.isAdminPerPlayer.get(player) ?? false;
    },

    setAdmin(player: Player, value: boolean) {
        this.isAdminPerPlayer.set(player, value);
    },

    getChatTags(player: Player): ChatTag[] {
        const tags: ChatTag[] = [];
        if (this.isAdmin(player)) {
            tags.push({TagText: "Admin", TagColor: new Color3(0.66, 0.2, 0.2)});
        }
        if (this.isVIP(player)) {
            tags.push({TagText: "VIP", TagColor: new Color3(0.96, 0.8, 0.19)});
        }
        return tags;
    },

    load(player: Player) {
        this.setAdmin(player, player.UserId === 1021594469 || player.GetRankInGroup(10940445) > 253);
        this.setVIP(player, MarketplaceService.UserOwnsGamePassAsync(player.UserId, 21562108) || this.isAdmin(player));
        this.setExtraItem(player, MarketplaceService.UserOwnsGamePassAsync(player.UserId, 21562133) || 
        this.isAdmin(player));
        this.setInGroup(player, player.IsInGroup(10940445));
        player.SetAttribute("IsVIP", SpecialService.isVIP(player));
        player.SetAttribute("IsAdmin", SpecialService.isAdmin(player));
        player.SetAttribute("LoadStatus", "Loaded player types.");
        const ChatService = GetLuaChatService();
        const speaker = ChatService.GetSpeaker(player.Name);
        const tags = this.getChatTags(player);
        if (speaker && tags) {
            speaker.SetExtraData("Tags", tags);
        }
    },
});

export = SpecialService;