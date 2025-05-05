import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import { Players, TeleportService } from "@rbxts/services";
import { Dungeon, Party } from "shared/utils/constants";
import LevelService from "./playerdata/LevelService";

declare global {
	interface KnitServices {
		PartyService: typeof PartyService;
	}
}

const PartyService = KnitServer.CreateService({
    Name: "PartyService",

    parties: [] as Party[],
    partyAdded: new Signal<() => void>(), 
    isEnabled: false,

    Client: {
        currentParty: undefined as Party | undefined,
        partyChanged: new RemoteSignal<(newParty: Party | undefined) => void>(),
        partyStarted: new RemoteSignal<(party: Party) => void>(),

        getParties(): Party[] {
            return this.Server.getParties();
        },

        createParty(player: Player, dungeon: Dungeon, 
            difficulty: string, isPublic: boolean, insane: boolean): Party | undefined {
            return this.Server.createParty(player, dungeon, difficulty, isPublic, insane);
        },

        joinParty(player: Player, party: Party): [Party | undefined, string | undefined] {
            return this.Server.joinParty(player, party);
        },

        leaveParty(player: Player) {
            return this.Server.leaveParty(player);  
        },

        kickPlayer(player: Player, target: Player) {
            this.Server.kickPlayer(player, target);
        },

        startDungeon(player: Player) {
            this.Server.startDungeon(player);
        },
    },

    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    },

    getParties() {
        return this.isEnabled ? this.parties : [];
    },

    createParty(player: Player, dungeon: Dungeon, 
        difficulty: string, isPublic: boolean, insane: boolean): Party | undefined {
        const [existingParty, isHost] = this.findParty(player);
        if (existingParty) {
            return undefined;
        }
        if (LevelService.getLevel(player) >= dungeon.difficulties[difficulty].levelReq) {
            const party = {
                Host: player,
                Members: [player],
                Dungeon: dungeon,
                Difficulty: difficulty,
                Insane: insane,
                Public: isPublic,
                Whitelisted: [],
            }
            this.parties.push(party);
            return this.isEnabled ? party : undefined;
        }
        return undefined;
    },

    findParty(player: Player): [Party | undefined, boolean] {
        for (const party of this.getParties()) {
            if (party.Host === player) {
                return [party, true];
            }
            else if (party.Members.includes(player)) {
                return [party, false];
            }
        }
        return [undefined, false];
    },

    kickPlayer(host: Player, toKick: Player) {
        const [party, isHost] = this.findParty(host);

        if (party && isHost) {
            for (let i = 0; i < party.Members.size(); i++) {
                const v = party.Members[i];
                if (v === toKick) {
                    party.Members.remove(i);
                    this.Client.partyChanged.Fire(v, undefined);
                    break;
                }
            }
            for (const v of party.Members) {
                this.Client.partyChanged.Fire(v, party);
            }
		}
    },

    leaveParty(player: Player) {
        const [party, isHost] = this.findParty(player);
        
        if (party) {
            if (isHost) {
                this.getParties().remove(this.getParties().indexOf(party));
            }
            else {
                party.Members.remove(party.Members.indexOf(player));
            }
            
            for (const v of party.Members) {
                this.Client.partyChanged.Fire(v, isHost ? undefined : party);
            }
        }
    },

    startDungeon(player: Player) {
        const [party, isHost] = this.findParty(player);
        
        if (party && isHost) {
            for (const v of party.Members) {
                this.Client.partyStarted.Fire(v, party);
            }
            
            const [accessCode, _pid] = TeleportService.ReserveServer(party.Dungeon.placeID)
            TeleportService.TeleportToPrivateServer(party.Dungeon.placeID, 
                accessCode, party.Members, "SpawnLocation", ({
                    Difficulty: party.Difficulty, 
                    Insane: party.Insane
                } as unknown) as TeleportData);
        }  
    },

    joinParty(player: Player, p: Party): [Party | undefined, string | undefined] {
        const [existingParty, isHost] = this.findParty(player);
        if (existingParty) {
            return [undefined, undefined];
        }
        const [party, _] = this.findParty(p.Host);
        if (!party) {
            return [party, undefined];
        }

        if (!party.Public && !party.Whitelisted.includes(player)) {
            return [undefined, "You are not whitelisted."];
        }

        if (party.Members.size() > 40) {
            return [undefined, "Maximum player count reached."];
        }

        if (LevelService.getLevel(player) < party.Dungeon.difficulties[party.Difficulty].levelReq) {
            return [undefined, "You do not meet the level requirements."];
        }

        party.Members.push(player);
        for (const v of party.Members) {
            this.Client.partyChanged.Fire(v, party);
        }
        return [party, undefined];
    },

    KnitInit() {
        Players.PlayerRemoving.Connect((player) => {
            this.leaveParty(player);
        });
    }
});


export = PartyService;

