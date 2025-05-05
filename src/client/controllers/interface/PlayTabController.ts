import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { Workspace } from "@rbxts/services";
import { ASSETS, LOCAL_PLAYER, PLAY_WINDOW, TELEPORT_INTERMISSION_WINDOW } from "client/constants";
import DataController from "client/controllers/DataController";
import UIController from "client/controllers/interface/UIController";
import AnnouncementLabelController from "client/controllers/interface/AnnouncementLabelController";
import { getDifficultyColor, getDungeonID, isLobby } from "shared/utils/Dungeon";
import { DUNGEONS, Dungeon, Party } from "shared/utils/constants";
import { paintObjects } from "shared/utils/vrldk/UIUtils";

declare global {
    interface KnitControllers {
        PlayTabController: typeof PlayTabController;
    }
}

const InventoryService = KnitClient.GetService("InventoryService");
const PartyService = KnitClient.GetService("PartyService");

const PlayTabController = Knit.CreateController({
    Name: "PlayTabController",

    party: undefined as Party | undefined,
    cachedParties: [] as Party[],
    selectedDungeon: DUNGEONS.ANCIENT_JUNGLE as Dungeon,
    selectedDifficulty: "Easy",
    isInsaneMode: false,

    refreshPlayWindow(window?: string) {
        if (!isLobby()) {
            return;
        }
    
        task.spawn(() => {
            this.cachedParties = PartyService.getParties();
        });
        PLAY_WINDOW.InPartyWindow.Visible = this.party !== undefined;
        PLAY_WINDOW.DungeonSelectionWindow.Visible = false;
        PLAY_WINDOW.PartySearcherWindow.Visible = false;
        if (window) {
            (PLAY_WINDOW.WaitForChild(window) as Frame).Visible = true;
        }
    
        if (this.party) {
            PLAY_WINDOW.InPartyWindow.NameLabel.Text = this.party.Dungeon.name;
            PLAY_WINDOW.InPartyWindow.DifficultyLabel.Text = this.party.Difficulty;
            PLAY_WINDOW.InPartyWindow.DifficultyLabel.TextColor3 = getDifficultyColor(this.party.Difficulty);
            PLAY_WINDOW.InPartyWindow.DifficultyLabel.UIStroke.Color = getDifficultyColor(this.party.Difficulty);
    
            for (const v of PLAY_WINDOW.InPartyWindow.PlayerList.GetChildren()) {
                if (v.IsA("Frame")) {
                    v.Destroy();
                }
            }
            for (const member of this.party.Members) {
                const playerSlot = ASSETS.PlayWindow.PlayerSlot.Clone();
                playerSlot.Parent = PLAY_WINDOW.InPartyWindow.PlayerList;
                playerSlot.KickButton.Visible = LOCAL_PLAYER === this.party.Host && LOCAL_PLAYER !== member;
                task.spawn(() => {
                    if (!this.party) {
                        return;
                    }
                    playerSlot.PlayerNameLabel.Text =
                        this.party.Host === member ? member.DisplayName + " [Host]" : member.DisplayName;
                    playerSlot.LevelLabel.Text = tostring(DataController.playerLevels.get(member.Name) ?? 0);
                    playerSlot.InspectButton.MouseButton1Click.Connect(() => {
                        InventoryService.requestInspect(member);
                    });
                    playerSlot.KickButton.MouseButton1Click.Connect(() => {
                        PartyService.kickPlayer(member);
                    });
                });
            }
        }
        else {
            task.spawn(() => {
                for (const v of PLAY_WINDOW.DungeonSelectionWindow.DifficultyOptions.GetChildren()) {
                    if (v.IsA("TextButton")) {
                        v.Visible = this.selectedDungeon !== undefined
                            && this.selectedDungeon.difficulties[v.Name] !== undefined;
                    }
                }
                if (!this.selectedDungeon.difficulties[this.selectedDifficulty]) {
                    for (const v of PLAY_WINDOW.DungeonSelectionWindow.DifficultyOptions.GetChildren()) {
                        if (v.IsA("TextButton") && v.Visible) {
                            this.selectedDifficulty = v.Name;
                            break;
                        }
                    }
                }
    
                PLAY_WINDOW.DungeonSelectionWindow.NameLabel.Text = this.selectedDungeon.name;
                PLAY_WINDOW.DungeonSelectionWindow.DifficultyLabel.Text = this.selectedDifficulty;
                PLAY_WINDOW.DungeonSelectionWindow.DifficultyLabel.TextColor3 = getDifficultyColor(this.selectedDifficulty);
                PLAY_WINDOW.DungeonSelectionWindow.DifficultyLabel.UIStroke.Color = getDifficultyColor(this.selectedDifficulty);
                PLAY_WINDOW.DungeonSelectionWindow.DescriptionLabel.Text = this.selectedDungeon.description;
                PLAY_WINDOW.DungeonSelectionWindow.LevelRequirementLabel.Text = 
                    "Level Requirement: " + this.selectedDungeon.difficulties[this.selectedDifficulty].levelReq;
                paintObjects(PLAY_WINDOW.DungeonSelectionWindow.InsaneMode, 
                    this.isInsaneMode ? Color3.fromRGB(170, 255, 127) : Color3.fromRGB(255, 58, 58), true);
            });
    
            task.spawn(() => {
                for (const v of PLAY_WINDOW.PartySearcherWindow.PartyList.GetChildren()) {
                    if (v.IsA("Frame")) {
                        v.Destroy();
                    }
                }
    
                for (const foundParty of this.cachedParties) {
                    const partySlot = ASSETS.PlayWindow.PartySlot.Clone();
                    partySlot.Parent = PLAY_WINDOW.PartySearcherWindow.PartyList;
                    partySlot.PlayerNameLabel.Text = foundParty.Host.DisplayName;
                    partySlot.DungeonNameLabel.Text = foundParty.Dungeon.name + " [" + foundParty.Difficulty + "]";
                    partySlot.LevelRequirementLabel.Text = "Level Requirement: " + foundParty.Dungeon.difficulties[foundParty.Difficulty].levelReq;
                    partySlot.PublicityLabel.Text = (foundParty.Public ? "Public  (" : "Private (") + foundParty.Members.size() + " others)";
                    partySlot.PublicityLabel.TextColor3 = foundParty.Public ? Color3.fromRGB(85, 255, 0) : Color3.fromRGB(255, 81, 0);
                    partySlot.PublicityLabel.UIStroke.Color = foundParty.Public ? Color3.fromRGB(85, 255, 0) : Color3.fromRGB(255, 81, 0);
    
                    partySlot.JoinButton.MouseButton1Click.Connect(() => {
                        const [joinedParty, errorMessage] = KnitClient.GetService("PartyService").joinParty(foundParty);
                        this.setParty(joinedParty);
                        if (errorMessage) {
                            AnnouncementLabelController.createAnnouncement(errorMessage);
                        }
                    });
                }
            });
        }
    },
    
    setParty(updatedParty?: Party) {
        this.party = updatedParty;
        this.refreshPlayWindow(!this.party ? "PartySearcherWindow" : undefined);
    },
    
    getParty(): Party | undefined {
        return this.party;
    },
    
    createParty() {
        if (!this.party) {
            const p = PartyService.createParty(this.selectedDungeon, this.selectedDifficulty, true, this.isInsaneMode);
            if (p) {
                this.setParty(p);
            }
            else {
                AnnouncementLabelController.createAnnouncement("You do not meet the level requirement for this dungeon.");
            }
        }
    },
    
    startParty() {
        if (this.party) {
            PartyService.startDungeon();
        }
    },
    
    leaveParty() {
        if (this.party) {
            PartyService.leaveParty();
        }
    },
    
    showTeleportIntermissionWindow(party: Party) {
        const window = TELEPORT_INTERMISSION_WINDOW;
        TELEPORT_INTERMISSION_WINDOW.DungeonThumbnail.DungeonNameLabel.Text =
            party.Dungeon.name;
        TELEPORT_INTERMISSION_WINDOW.DungeonThumbnail.DungeonDifficultyLabel.Text = party.Difficulty;
        TELEPORT_INTERMISSION_WINDOW.DungeonThumbnail.DungeonDifficultyLabel.TextColor3 =
            getDifficultyColor(party.Difficulty);
        TELEPORT_INTERMISSION_WINDOW.DungeonThumbnail.DungeonDifficultyLabel.UIStroke.Color =
            getDifficultyColor(party.Difficulty);
        TELEPORT_INTERMISSION_WINDOW.DungeonThumbnail.Image =
            "rbxgameasset://Images/" + getDungeonID(party.Dungeon);
    
        window.Visible = true;
    },

    moveCameraToMapPreview() {
        if (Workspace.CurrentCamera) {
            Workspace.CurrentCamera.CameraType = Enum.CameraType.Scriptable;
            const mapPreviews = Workspace.FindFirstChild("MapPreviews");
            if (mapPreviews) {
                const location = mapPreviews.WaitForChild("Locations").FindFirstChild(this.selectedDungeon.name) as BasePart;
                if (location) {
                    Workspace.CurrentCamera.CFrame = location.CFrame;
                }
            }
        }
    },

    KnitInit() {
        PLAY_WINDOW.DungeonSelectionWindow.SearchParties.MouseButton1Click.Connect(() => {
            this.refreshPlayWindow("PartySearcherWindow");
        });
        
        PLAY_WINDOW.PartySearcherWindow.Refresh.MouseButton1Click.Connect(() => {
            this.refreshPlayWindow("PartySearcherWindow");
        });
        
        PLAY_WINDOW.PartySearcherWindow.SwitchToDungeonSelection.MouseButton1Click.Connect(() => {
            this.refreshPlayWindow("DungeonSelectionWindow");
        });
        
        PLAY_WINDOW.DungeonSelectionWindow.InsaneMode.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.isInsaneMode = !this.isInsaneMode;
            this.refreshPlayWindow("DungeonSelectionWindow");
        });
        
        PLAY_WINDOW.DungeonSelectionWindow.InsaneMode.MouseEnter.Connect(() => {
            PLAY_WINDOW.DungeonSelectionWindow.InsaneModeDescriptionLabel.Text = "One life, two less minutes, three items.";
        });
        
        PLAY_WINDOW.DungeonSelectionWindow.InsaneMode.MouseLeave.Connect(() => {
            PLAY_WINDOW.DungeonSelectionWindow.InsaneModeDescriptionLabel.Text = "Insane Mode";
        });
        
        for (const dungeonOption of PLAY_WINDOW.DungeonSelectionWindow.DungeonOptions.GetChildren()) {
            if (dungeonOption.IsA("TextButton")) {
                dungeonOption.MouseButton1Click.Connect(() => {
                    UIController.playSound("Click");
                    this.selectedDungeon = DUNGEONS[dungeonOption.Name];
                    this.refreshPlayWindow("DungeonSelectionWindow");
                    this.moveCameraToMapPreview();
                });
            }
        }
        
        for (const difficultyOption of PLAY_WINDOW.DungeonSelectionWindow.DifficultyOptions.GetChildren()) {
            if (difficultyOption.IsA("TextButton")) {
                difficultyOption.MouseButton1Click.Connect(() => {
                    UIController.playSound("Click");
                    this.selectedDifficulty = difficultyOption.Name;
                    this.refreshPlayWindow("DungeonSelectionWindow");
                });
            }
        }
        
        PLAY_WINDOW.DungeonSelectionWindow.CreateParty.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.createParty();
        });
        
        PLAY_WINDOW.InPartyWindow.Start.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.startParty();	
        });
        
        PLAY_WINDOW.InPartyWindow.Leave.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.leaveParty();	
        });

        PartyService.partyChanged.Connect((party) => {
            this.setParty(party);
        });
        
        PartyService.partyStarted.Connect((party) => {
            this.showTeleportIntermissionWindow(party);
        });
        
    }
});

export = PlayTabController;