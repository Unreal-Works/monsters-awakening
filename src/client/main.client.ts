import { KnitClient } from "@rbxts/knit";
import { RunService, StarterGui, UserInputService } from "@rbxts/services";
import { LOCAL_PLAYER, MOUSE } from "client/constants";
import DamageController from "client/controllers/combat/DamageController";
import EffectController from "client/controllers/combat/EffectController";
import SkillController from "client/controllers/combat/SkillController";
import BossLabelController from "client/controllers/interface/BossLabelController";
import HotbarController from "client/controllers/interface/HotbarController";
import InspectController from "client/controllers/interface/InspectController";
import ItemsTabController from "client/controllers/interface/ItemsTabController";
import LoadingController from "client/controllers/interface/LoadingController";
import PlayTabController from "client/controllers/interface/PlayTabController";
import PlayerListController from "client/controllers/interface/PlayerListController";
import RewardDisplayerController from "client/controllers/interface/RewardDisplayerController";
import SidebarController from "client/controllers/interface/SidebarController";
import StatsTabController from "client/controllers/interface/StatsTabController";
import TimerController from "client/controllers/interface/TimerController";
import ToggleShiftLockController from "client/controllers/interface/ToggleShiftLockController";
import TradeTabController from "client/controllers/interface/TradeTabController";
import SkillsTabController from "./controllers/interface/SkillsTabController";
import HotkeysController from "./controllers/interface/HotkeysController";
import CharacterController from "./controllers/combat/CharacterController";
import EventController from "./controllers/interface/EventController";
import SnowflakesController from "./controllers/interface/SnowflakesController";

const refreshInterface = () => {
	SidebarController.refreshSidebarButtons();
	HotbarController.refreshHotbar();
	PlayTabController.refreshPlayWindow("DungeonSelectionWindow");
	ItemsTabController.refreshItemsWindow();
	SkillsTabController.refreshSkillTree();
	StatsTabController.refreshStatsWindow();
	PlayerListController.refreshPlayerListWindow();
}

KnitClient.Start().catch((reason: string) => {
    error(reason);
}).done(() => {
	StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);
	StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList, false);
	StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.EmotesMenu, false);
	StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Health, false);

	LoadingController.showLoadingWindow();
	refreshInterface();
	CharacterController.updateHumanoid();
	EventController.load();
	SnowflakesController.load();
	InspectController.load();
	TradeTabController.load();
	RewardDisplayerController.load();
	BossLabelController.load();
	TimerController.load();
	ToggleShiftLockController.load();
	DamageController.load();
	EffectController.load();
	HotkeysController.load();
});