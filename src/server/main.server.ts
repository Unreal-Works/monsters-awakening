import DataStore2 from "@rbxts/datastore2";
import { KnitServer } from "@rbxts/knit";
import { Players } from "@rbxts/services";
import CharacterService from "server/services/CharacterService";
import CombatService from "server/services/CombatService";
import DungeonService from "server/services/DungeonService";
import GameAssetService from "server/services/GameAssetService";
import LobbyService from "server/services/LobbyService";
import MsgService from "server/services/MsgService";
import PartyService from "server/services/PartyService";
import TimeLogService from "server/services/TimeLogService";
import TradeService from "server/services/TradeService";
import ClassService from "server/services/playerdata/ClassService";
import CosmeticsService from "server/services/playerdata/CosmeticsService";
import EXPService from "server/services/playerdata/EXPService";
import GoldService from "server/services/playerdata/GoldService";
import InventoryService from "server/services/playerdata/InventoryService";
import LegacyService from "server/services/playerdata/LegacyService";
import LevelService from "server/services/playerdata/LevelService";
import RecordService from "server/services/playerdata/RecordService";
import SettingsService from "server/services/playerdata/SettingsService";
import SkillsService from "server/services/playerdata/SkillsService";
import SpecialService from "server/services/playerdata/SpecialService";
import StatsService from "server/services/playerdata/StatsService";
import { isLobby } from "shared/utils/Dungeon";

KnitServer.Start().catch((reason: string) => {
    error(reason);
}).done(() => {
    GameAssetService.loadSkillTrees();
    PartyService.setEnabled(isLobby());
    TradeService.setEnabled(isLobby());
    LobbyService.load();
    CombatService.load();

    Players.PlayerAdded.Connect((player: Player) => {
        player.GetAttributeChangedSignal("LoadStatus").Connect(() => {
            MsgService.sendHotbarNotification(player, player.GetAttribute("LoadStatus") as string);
        });

        // do not mind
        ClassService.load(player);
        LevelService.load(player);
        EXPService.load(player);
        GoldService.load(player);
        //SnowflakesService.load(player);
        InventoryService.load(player);
        RecordService.load(player);
        SettingsService.load(player);
        SkillsService.load(player);
        StatsService.load(player);
        CosmeticsService.load(player);
        SpecialService.load(player);
        DungeonService.load(player);
        TimeLogService.load(player);
        LegacyService.convertLegacyData(player);
        CharacterService.load(player);

        player.SetAttribute("LoadStatus", "Finished loading.");
        player.SetAttribute("Loaded", true);
    });

    Players.PlayerRemoving.Connect((player: Player) => {
        print("Saved "+player.Name+" data");
        print(DataStore2("Data", player).Get());
    });
});