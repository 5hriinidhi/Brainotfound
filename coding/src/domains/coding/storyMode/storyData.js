import serverRoom from '../../../assets/serverroom.png';
import commandCenter from '../../../assets/commandcenter.png';
import meltdown from '../../../assets/meltdown.png';
import alarm from '../../../assets/alarm.png';

export const storyData = {
    startNode: "node_1",
    nodes: {
        // === NODE 1: Server Room ===
        "node_1": {
            id: "node_1",
            text: "You wake up in a dimly lit server hall. A terminal is flashing red: 'UNAUTHORIZED ACCESS DETECTED'. You need to bypass the security script to proceed.",
            background: serverRoom,
            challenge: {
                skill: "cybersecurity",
                difficulty: "easy"
            },
            nextSuccess: "node_2",
            nextFailure: "node_1_fail",
        },

        "node_1_fail": {
            id: "node_1_fail",
            text: "The security system locks you out. Alarms blare across the facility. Armed drones converge on your position. The terminal displays: 'INTRUDER NEUTRALIZED'. Your mission has failed before it even began.",
            background: alarm,
            isEnding: true,
            endingType: "failure",
            endingTitle: "MISSION FAILED",
            endingMessage: "You were unable to bypass the security system. The facility went into full lockdown.",
        },

        // === NODE 2: Command Center ===
        "node_2": {
            id: "node_2",
            text: "The alarm silences. You make your way to the Command Center. The view of the planet is breathtaking, but the main reactor is overheating. You must optimize the cooling logic before it reaches critical temperature.",
            background: commandCenter,
            challenge: {
                skill: "development",
                difficulty: "medium"
            },
            nextSuccess: "node_2_success",
            nextFailure: "node_2_fail",
        },

        "node_2_success": {
            id: "node_2_success",
            text: "The cooling system stabilizes. Temperature readings drop back to normal. The crew cheers as the reactor hums quietly. You've saved the station.",
            background: commandCenter,
            isEnding: true,
            endingType: "victory",
            endingTitle: "CHAPTER COMPLETE",
            endingMessage: "You have successfully navigated the debug adventure. The station is safe — for now.",
        },

        "node_2_fail": {
            id: "node_2_fail",
            text: "The cooling logic fails. Warning sirens fill the Command Center as the reactor temperature spikes past critical levels. Flames erupt from the ventilation shafts. The station shakes violently as systems cascade into failure. Through the smoke, the last terminal reads: 'CORE MELTDOWN IMMINENT'.",
            background: meltdown,
            isEnding: true,
            endingType: "failure",
            endingTitle: "REACTOR MELTDOWN",
            endingMessage: "Your code couldn't stabilize the reactor in time. The command center is engulfed in flames. The station is lost.",
        },
    }
};
