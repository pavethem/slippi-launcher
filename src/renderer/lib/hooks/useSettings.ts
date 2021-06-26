import { DolphinLaunchType } from "@dolphin/types";
import {
  setIsoPath,
  setLaunchMeleeOnPlay,
  setNetplayDolphinPath,
  setPlaybackDolphinPath,
  setRootSlpPath,
  setSpectateSlpPath,
} from "@settings/ipc";
import { AppSettings } from "@settings/types";
import { ipcRenderer } from "electron";
import create from "zustand";
import { combine } from "zustand/middleware";

const initialState = ipcRenderer.sendSync("getAppSettingsSync") as AppSettings;
console.log("initial state: ", initialState);

export const useSettings = create(
  combine(
    {
      ...initialState,
    },
    (set) => ({
      updateSettings: (settings: AppSettings) => set(() => settings),
    }),
  ),
);

export const useIsoPath = () => {
  const isoPath = useSettings((store) => store.settings.isoPath);
  const setPath = async (isoPath: string | null) => {
    const setResult = await setIsoPath.renderer!.trigger({ isoPath });
    if (!setResult.result) {
      throw new Error("Error setting ISO path");
    }
  };
  return [isoPath, setPath] as const;
};

export const useRootSlpPath = () => {
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const setReplayDir = async (path: string) => {
    const setResult = await setRootSlpPath.renderer!.trigger({ path });
    if (!setResult.result) {
      throw new Error("Error setting root SLP path");
    }
  };
  return [rootSlpPath, setReplayDir] as const;
};

export const useSpectateSlpPath = () => {
  const spectateSlpPath = useSettings((store) => store.settings.spectateSlpPath);
  const setSpectateDir = async (path: string) => {
    const setResult = await setSpectateSlpPath.renderer!.trigger({ path });
    if (!setResult.result) {
      throw new Error("Error setting spectate SLP path");
    }
  };
  return [spectateSlpPath, setSpectateDir] as const;
};

export const useDolphinPath = (dolphinType: DolphinLaunchType) => {
  const netplayDolphinPath = useSettings((store) => store.settings.netplayDolphinPath);
  const setNetplayPath = async (path: string) => {
    const setResult = await setNetplayDolphinPath.renderer!.trigger({ path });
    if (!setResult.result) {
      throw new Error("Error setting netplay dolphin path");
    }
  };

  const playbackDolphinPath = useSettings((store) => store.settings.playbackDolphinPath);
  const setDolphinPath = async (path: string) => {
    const setResult = await setPlaybackDolphinPath.renderer!.trigger({ path });
    if (!setResult.result) {
      throw new Error("Error setting playback dolphin path");
    }
  };

  switch (dolphinType) {
    case DolphinLaunchType.NETPLAY: {
      return [netplayDolphinPath, setNetplayPath] as const;
    }
    case DolphinLaunchType.PLAYBACK: {
      return [playbackDolphinPath, setDolphinPath] as const;
    }
  }
};

export const useLaunchMeleeOnPlay = () => {
  const launchMeleeOnPlay = useSettings((store) => store.settings.launchMeleeOnPlay);
  const setLaunchMelee = async (launchMelee: boolean) => {
    const setResult = await setLaunchMeleeOnPlay.renderer!.trigger({ launchMelee });
    if (!setResult.result) {
      throw new Error("Error setting launch melee on Play");
    }
  };

  return [launchMeleeOnPlay, setLaunchMelee] as const;
};
